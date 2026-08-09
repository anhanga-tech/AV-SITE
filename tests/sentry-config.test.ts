import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { isStaleChunkMessage, sentryBeforeSend, sentryBeforeSendLog } from '../lib/sentry-client';
import { resetErrorTrackerForTests, setErrorTrackerForTests } from '../lib/error-tracking';
import { STALE_CHUNK_EXHAUSTED_TAG_KEY, STALE_CHUNK_EXHAUSTED_TAG_VALUE } from '../lib/stale-chunk-recovery';
import type { ErrorEvent as SentryErrorEvent } from '@sentry/react';

type SentryLog = Parameters<typeof sentryBeforeSendLog>[0];

async function readProjectFile(path: string): Promise<string> {
    return await readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('package declares Sentry SDKs for React and Cloudflare Pages', async () => {
    const pkg = JSON.parse(await readProjectFile('package.json')) as {
        dependencies?: Record<string, string>;
    };

    assert.match(pkg.dependencies?.['@sentry/react'] ?? '', /^\^/);
    assert.match(pkg.dependencies?.['@sentry/cloudflare'] ?? '', /^\^/);
});

test('env example documents server and browser Sentry DSNs separately', async () => {
    const envExample = await readProjectFile('.env.example');

    assert.match(envExample, /^SENTRY_DSN=/m);
    assert.match(envExample, /^VITE_SENTRY_DSN=/m);
});

test('client initializes Sentry before React mounts and filters browser extension noise', async () => {
    const [entrySource, sentrySource] = await Promise.all([
        readProjectFile('index.tsx'),
        readProjectFile('lib/sentry-client.ts'),
    ]);

    assert.match(entrySource, /initClientErrorTracking\(\);[\s\S]*ReactDOM\.(?:hydrateRoot|createRoot)/);
    assert.match(sentrySource, /@sentry\/react/);
    assert.match(sentrySource, /setErrorTracker\(Sentry\.captureException\)/);
    assert.match(sentrySource, /import\.meta\.env\.VITE_SENTRY_DSN/);
    assert.match(sentrySource, /beforeSend/);
    assert.match(sentrySource, /extension:\/\//);
});

test('client drops stale-chunk noise unconditionally, relying on stale-chunk-recovery to report genuine incidents itself', async () => {
    const [entrySource, sentrySource, recoverySource] = await Promise.all([
        readProjectFile('index.tsx'),
        readProjectFile('lib/sentry-client.ts'),
        readProjectFile('lib/stale-chunk-recovery.ts'),
    ]);

    assert.match(entrySource, /vite:preloadError/);
    assert.match(entrySource, /handleStaleChunkPreloadError/);
    assert.match(recoverySource, /Unable to preload CSS for/);
    assert.match(sentrySource, /isStaleChunkMessage\(exceptions\)\) return null/);
    assert.match(sentrySource, /STALE_CHUNK_EXHAUSTED_TAG_KEY/);
    assert.match(sentrySource, /beforeSendLog: sentryBeforeSendLog/);
});

test('isStaleChunkMessage recognizes Chromium and Firefox stale-chunk wording, not unrelated errors', () => {
    const chromiumCases = [
        'Failed to fetch dynamically imported module: https://anhanga.tur.br/assets/Blog-a1b2c3.js',
        'Unable to preload CSS for /assets/App-d4e5f6.css',
        'Importing a module script failed',
    ];
    const firefoxCase = 'error loading dynamically imported module: https://anhanga.tur.br/assets/Blog-a1b2c3.js';
    const unrelatedCases = [
        'TypeError: Cannot read properties of undefined (reading \'map\')',
        'Network request failed',
    ];

    for (const value of [...chromiumCases, firefoxCase]) {
        assert.equal(isStaleChunkMessage([{ value }]), true, `expected match for: ${value}`);
    }

    for (const value of unrelatedCases) {
        assert.equal(isStaleChunkMessage([{ value }]), false, `expected no match for: ${value}`);
    }

    assert.equal(isStaleChunkMessage(undefined), false);
    assert.equal(isStaleChunkMessage([{}]), false);
});

test('sentryBeforeSend drops an ordinary (untagged) stale-chunk exception', () => {
    const event = {
        type: undefined,
        exception: { values: [{ value: STALE_ASSET_MESSAGE }] },
    } as SentryErrorEvent;

    assert.equal(sentryBeforeSend(event), null);
});

test('sentryBeforeSend lets a tagged exhausted-budget report through even though its message still matches the stale-chunk pattern', () => {
    // Mirrors exactly what reportUnrecoveredStaleChunk (lib/stale-chunk-recovery.ts)
    // produces: an Error whose message embeds the original stale-chunk wording
    // (for readability) plus the bypass tag. A prior version of this fix built
    // this report without the tag, and isStaleChunkMessage silently dropped it
    // right back out — this test exercises the real beforeSend pipeline
    // end-to-end rather than a stubbed error tracker, which can't catch that
    // class of self-filtering bug.
    const event = {
        type: undefined,
        tags: { [STALE_CHUNK_EXHAUSTED_TAG_KEY]: STALE_CHUNK_EXHAUSTED_TAG_VALUE },
        exception: {
            values: [{ value: `Stale-chunk reload did not recover the app: ${STALE_ASSET_MESSAGE}` }],
        },
    } as SentryErrorEvent;

    assert.equal(sentryBeforeSend(event), event);
});

test('sentryBeforeSendLog drops stale-chunk console noise from the separate Logs pipeline', () => {
    // React logs every error a boundary catches (ChunkErrorBoundary included)
    // to console.error by default, and consoleLoggingIntegration forwards
    // that through Sentry Logs — a separate pipeline from beforeSend's
    // exception events, so it needs its own filter.
    const staleLog = { message: STALE_ASSET_MESSAGE } as SentryLog;
    const unrelatedLog = { message: 'user clicked checkout' } as SentryLog;

    assert.equal(sentryBeforeSendLog(staleLog), null);
    assert.equal(sentryBeforeSendLog(unrelatedLog), unrelatedLog);
});

const STALE_ASSET_MESSAGE = 'Failed to fetch dynamically imported module: https://anhanga.tur.br/assets/Blog-a1b2c3.js';
const OTHER_DEPLOY_ASSET_MESSAGE = 'Failed to fetch dynamically imported module: https://anhanga.tur.br/assets/Blog-z9y8x7.js';
const BARE_MESSAGE_NO_URL = 'Importing a module script failed';

function stubWindow(initialBuildSrc = 'https://anhanga.tur.br/assets/index-BUILD1.js'): {
    reloadCalls: number;
    buildSrc: string;
} {
    const store = new Map<string, string>();
    const state = { reloadCalls: 0, buildSrc: initialBuildSrc };

    (globalThis as { window?: unknown }).window = {
        document: {
            querySelector: () => ({ src: state.buildSrc }),
        },
        sessionStorage: {
            getItem: (key: string) => store.get(key) ?? null,
            setItem: (key: string, value: string) => {
                store.set(key, value);
            },
        },
        location: {
            reload: () => {
                state.reloadCalls += 1;
            },
        },
    };

    return state;
}

function restoreWindow(): void {
    delete (globalThis as { window?: unknown }).window;
}

test('handleStaleChunkPreloadError reloads once for a failing asset, then reports (without reloading again) if it recurs', async () => {
    const { handleStaleChunkPreloadError } = await import('../lib/stale-chunk-recovery');
    const state = stubWindow();
    const reported: Array<{ error: unknown; context: unknown }> = [];
    setErrorTrackerForTests((error, context) => { reported.push({ error, context }); });

    try {
        handleStaleChunkPreloadError({ payload: new Error(STALE_ASSET_MESSAGE) });
        assert.equal(state.reloadCalls, 1);
        assert.equal(reported.length, 0, 'must not report while still within the reload budget');

        // Same build, same failing asset, failing again: treated as a real
        // incident. We report it ourselves rather than relying on the
        // underlying JS exception reaching Sentry on its own (it may not —
        // see lib/stale-chunk-recovery.ts).
        handleStaleChunkPreloadError({ payload: new Error(STALE_ASSET_MESSAGE) });
        assert.equal(state.reloadCalls, 1, 'must not reload again once the budget is spent');
        assert.equal(reported.length, 1, 'must report once the budget is spent');
        assert.match((reported[0].error as Error).message, /Blog-a1b2c3\.js/);

        // The report must carry the bypass tag — this is what lets it survive
        // sentryBeforeSend's message-pattern filter in production (see the
        // 'sentryBeforeSend lets a tagged exhausted-budget report through'
        // test below); a report without it would silently self-filter.
        const context = reported[0].context as { tags?: Record<string, string> };
        assert.equal(context.tags?.[STALE_CHUNK_EXHAUSTED_TAG_KEY], STALE_CHUNK_EXHAUSTED_TAG_VALUE);
    } finally {
        restoreWindow();
        resetErrorTrackerForTests();
    }
});

test('a different deploy\'s failing asset gets its own reload budget in the same tab session', async () => {
    const { handleStaleChunkPreloadError } = await import('../lib/stale-chunk-recovery');
    const state = stubWindow();
    const reported: unknown[] = [];
    setErrorTrackerForTests((error) => { reported.push(error); });

    try {
        handleStaleChunkPreloadError({ payload: new Error(STALE_ASSET_MESSAGE) });
        assert.equal(state.reloadCalls, 1);

        // A long-lived tab spans a second deploy: a different content-hashed
        // asset now fails. It must still get its own reload rather than being
        // treated as exhausted by the earlier, unrelated failure.
        handleStaleChunkPreloadError({ payload: new Error(OTHER_DEPLOY_ASSET_MESSAGE) });

        assert.equal(state.reloadCalls, 2, 'a new deploy\'s distinct failure must still get a reload');
        assert.equal(reported.length, 0);
    } finally {
        restoreWindow();
        resetErrorTrackerForTests();
    }
});

test('a different build gets its own reload budget even for a message with no embedded URL', async () => {
    const { handleStaleChunkPreloadError } = await import('../lib/stale-chunk-recovery');
    const state = stubWindow('https://anhanga.tur.br/assets/index-BUILD1.js');
    const reported: unknown[] = [];
    setErrorTrackerForTests((error) => { reported.push(error); });

    try {
        handleStaleChunkPreloadError({ payload: new Error(BARE_MESSAGE_NO_URL) });
        assert.equal(state.reloadCalls, 1);

        // The reload lands on a NEW deploy (different content-hashed entry
        // script), which then also hits the exact same URL-less message.
        // Keying purely by message text would collide here; the build
        // fingerprint must disambiguate it.
        state.buildSrc = 'https://anhanga.tur.br/assets/index-BUILD2.js';
        handleStaleChunkPreloadError({ payload: new Error(BARE_MESSAGE_NO_URL) });

        assert.equal(state.reloadCalls, 2, 'a new build must still get its own reload despite the identical message');
        assert.equal(reported.length, 0);
    } finally {
        restoreWindow();
        resetErrorTrackerForTests();
    }
});

test('stale-chunk recovery reports (without reloading) when sessionStorage is unavailable', async () => {
    const { handleStaleChunkPreloadError } = await import('../lib/stale-chunk-recovery');
    const reported: unknown[] = [];
    setErrorTrackerForTests((error) => { reported.push(error); });

    (globalThis as { window?: unknown }).window = {
        document: { querySelector: () => ({ src: 'https://anhanga.tur.br/assets/index-BUILD1.js' }) },
        sessionStorage: {
            getItem: () => { throw new Error('SecurityError: storage disabled'); },
        },
        location: { reload: () => { throw new Error('must not be called'); } },
    };

    try {
        handleStaleChunkPreloadError({ payload: new Error(STALE_ASSET_MESSAGE) });
        assert.equal(reported.length, 1, 'must report immediately when the budget cannot be tracked at all');
    } finally {
        restoreWindow();
        resetErrorTrackerForTests();
    }
});

test('ChunkErrorBoundary shares its reload budget and message patterns with the preload-error listener', async () => {
    const boundarySource = await readProjectFile('components/ChunkErrorBoundary.tsx');

    assert.match(boundarySource, /from ['"]\.\.\/lib\/stale-chunk-recovery['"]/);
    assert.match(boundarySource, /attemptStaleChunkBoundaryReload/);
    assert.match(boundarySource, /isStaleChunkErrorMessage\(error\?\.message\)/);
    // The boundary must not keep its own independent reload-tracking flag —
    // that's exactly the uncoordinated-double-reload bug this consolidation fixes.
    assert.doesNotMatch(boundarySource, /sessionStorage/);
});

test('the vite:preloadError listener and ChunkErrorBoundary cannot each reload independently for one failure', async () => {
    const { handleStaleChunkPreloadError, attemptStaleChunkBoundaryReload } = await import('../lib/stale-chunk-recovery');
    const state = stubWindow();
    setErrorTrackerForTests(() => undefined);

    try {
        // The vite:preloadError listener reloads first and consumes the budget
        // for this specific failing asset...
        handleStaleChunkPreloadError({ payload: new Error(STALE_ASSET_MESSAGE) });
        assert.equal(state.reloadCalls, 1);

        // ...so if the SAME failure also reaches ChunkErrorBoundary afterward
        // (e.g. via the render-time throw that the listener deliberately lets
        // propagate), the boundary must see that asset's budget already spent
        // and must NOT reload again.
        const boundaryReloaded = attemptStaleChunkBoundaryReload(new Error(STALE_ASSET_MESSAGE));

        assert.equal(boundaryReloaded, false);
        assert.equal(state.reloadCalls, 1, 'a single failure must not trigger two reloads');
    } finally {
        restoreWindow();
        resetErrorTrackerForTests();
    }
});

test('Cloudflare Pages middleware initializes Sentry from request environment', async () => {
    const middlewareSource = await readProjectFile('functions/_middleware.ts');

    assert.match(middlewareSource, /@sentry\/cloudflare/);
    assert.match(middlewareSource, /sentryPagesPlugin/);
    assert.match(middlewareSource, /setErrorTracker\(Sentry\.captureException\)/);
    assert.match(middlewareSource, /context\.env\.SENTRY_DSN/);
});

test('shared error tracking module stays runtime-agnostic for browser bundles', async () => {
    const [errorTrackingSource, loggerSource] = await Promise.all([
        readProjectFile('lib/error-tracking.ts'),
        readProjectFile('lib/logger.ts'),
    ]);

    assert.doesNotMatch(errorTrackingSource, /process\.env/);
    assert.match(loggerSource, /from ['"]\.\/error-tracking['"]/);
});
