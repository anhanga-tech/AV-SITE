import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { isStaleChunkMessage } from '../lib/sentry-client';

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

test('client filters stale-chunk noise only while the preload-error reload budget remains', async () => {
    const [entrySource, sentrySource, recoverySource] = await Promise.all([
        readProjectFile('index.tsx'),
        readProjectFile('lib/sentry-client.ts'),
        readProjectFile('lib/stale-chunk-recovery.ts'),
    ]);

    assert.match(entrySource, /vite:preloadError/);
    assert.match(entrySource, /handleStaleChunkPreloadError/);
    assert.match(recoverySource, /Unable to preload CSS for/);
    assert.match(sentrySource, /!hasExhaustedStaleChunkReloads\(staleChunkMessage\)\) return null/);
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

function stubWindow(): { reloadCalls: number } {
    const store = new Map<string, string>();
    const state = { reloadCalls: 0 };

    (globalThis as { window?: unknown }).window = {
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

const STALE_ASSET_MESSAGE = 'Failed to fetch dynamically imported module: https://anhanga.tur.br/assets/Blog-a1b2c3.js';
const OTHER_DEPLOY_ASSET_MESSAGE = 'Failed to fetch dynamically imported module: https://anhanga.tur.br/assets/Blog-z9y8x7.js';

test('handleStaleChunkPreloadError reloads (and prevents the default re-throw) only on the first, recoverable failure', async () => {
    const { handleStaleChunkPreloadError, hasExhaustedStaleChunkReloads } = await import('../lib/stale-chunk-recovery');
    const state = stubWindow();

    try {
        assert.equal(hasExhaustedStaleChunkReloads(STALE_ASSET_MESSAGE), false, 'budget should start unspent');

        let prevented = false;
        handleStaleChunkPreloadError({
            payload: new Error(STALE_ASSET_MESSAGE),
            preventDefault: () => { prevented = true; },
        });

        assert.equal(prevented, true, 'must call preventDefault() so Vite does not re-throw the recoverable error');
        assert.equal(state.reloadCalls, 1);

        // Second failure for the SAME failing asset: budget is spent, so this
        // must be treated as a real incident — no reload, and the error is
        // left to propagate (preventDefault NOT called) so it reaches Sentry.
        assert.equal(hasExhaustedStaleChunkReloads(STALE_ASSET_MESSAGE), true);

        let preventedAgain = false;
        handleStaleChunkPreloadError({
            payload: new Error(STALE_ASSET_MESSAGE),
            preventDefault: () => { preventedAgain = true; },
        });

        assert.equal(preventedAgain, false, 'must not suppress the error once the reload budget is spent');
        assert.equal(state.reloadCalls, 1, 'must not reload again once the budget is spent');
    } finally {
        restoreWindow();
    }
});

test('a different deploy\'s failing asset gets its own reload budget in the same tab session', async () => {
    const { handleStaleChunkPreloadError, hasExhaustedStaleChunkReloads } = await import('../lib/stale-chunk-recovery');
    const state = stubWindow();

    try {
        handleStaleChunkPreloadError({ payload: new Error(STALE_ASSET_MESSAGE), preventDefault: () => {} });
        assert.equal(hasExhaustedStaleChunkReloads(STALE_ASSET_MESSAGE), true);

        // A long-lived tab spans a second deploy: a different content-hashed
        // asset now fails. It must still get its own reload rather than being
        // treated as exhausted by the earlier, unrelated failure.
        let preventedForNewDeploy = false;
        handleStaleChunkPreloadError({
            payload: new Error(OTHER_DEPLOY_ASSET_MESSAGE),
            preventDefault: () => { preventedForNewDeploy = true; },
        });

        assert.equal(preventedForNewDeploy, true, 'a new deploy\'s distinct failure must still get a reload');
        assert.equal(state.reloadCalls, 2);
    } finally {
        restoreWindow();
    }
});

test('stale-chunk reload recovery fails safe toward "exhausted" when sessionStorage is unavailable', async () => {
    const { handleStaleChunkPreloadError, hasExhaustedStaleChunkReloads } = await import('../lib/stale-chunk-recovery');

    (globalThis as { window?: unknown }).window = {
        sessionStorage: {
            getItem: () => { throw new Error('SecurityError: storage disabled'); },
        },
        location: { reload: () => { throw new Error('must not be called'); } },
    };

    try {
        assert.equal(hasExhaustedStaleChunkReloads(STALE_ASSET_MESSAGE), true);

        let prevented = false;
        handleStaleChunkPreloadError({
            payload: new Error(STALE_ASSET_MESSAGE),
            preventDefault: () => { prevented = true; },
        });
        assert.equal(prevented, false, 'must not reload (or swallow the error) when attempts cannot be tracked');
    } finally {
        restoreWindow();
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

    try {
        // The vite:preloadError listener reloads first and consumes the budget
        // for this specific failing asset...
        handleStaleChunkPreloadError({ payload: new Error(STALE_ASSET_MESSAGE), preventDefault: () => {} });
        assert.equal(state.reloadCalls, 1);

        // ...so if the SAME failure also reaches ChunkErrorBoundary afterward
        // (e.g. preventDefault() didn't fully suppress it), the boundary must
        // see that asset's budget already spent and must NOT reload again.
        const boundaryReloaded = attemptStaleChunkBoundaryReload(new Error(STALE_ASSET_MESSAGE));

        assert.equal(boundaryReloaded, false);
        assert.equal(state.reloadCalls, 1, 'a single failure must not trigger two reloads');
    } finally {
        restoreWindow();
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
