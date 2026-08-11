import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
    isStaleChunkMessage,
    sentryBeforeBreadcrumb,
    sentryBeforeSend,
    sentryBeforeSendLog,
} from '../lib/sentry-client';
import {
    resetErrorTrackerForTests,
    sanitizeForErrorTracking,
    scrubEventUrls,
    scrubQueryParams,
    scrubSensitiveUrl,
    setErrorTrackerForTests,
} from '../lib/error-tracking';
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
    const { handleStaleChunkPreloadError, resetStaleChunkRecoveryForTests } = await import('../lib/stale-chunk-recovery');
    resetStaleChunkRecoveryForTests();
    const state = stubWindow();
    const reported: Array<{ error: unknown; context: unknown }> = [];
    setErrorTrackerForTests((error, context) => { reported.push({ error, context }); });

    try {
        handleStaleChunkPreloadError({ payload: new Error(STALE_ASSET_MESSAGE) });
        assert.equal(state.reloadCalls, 1);
        assert.equal(reported.length, 0, 'must not report while still within the reload budget');

        // The first reload's navigation completes — a fresh page load, whose
        // module state resets even though the sessionStorage budget persists.
        resetStaleChunkRecoveryForTests();

        // Same build, same failing asset, failing again on the new page:
        // treated as a real incident. We report it ourselves rather than
        // relying on the underlying JS exception reaching Sentry on its own
        // (it may not — see lib/stale-chunk-recovery.ts).
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
    const { handleStaleChunkPreloadError, resetStaleChunkRecoveryForTests } = await import('../lib/stale-chunk-recovery');
    resetStaleChunkRecoveryForTests();
    const state = stubWindow();
    const reported: unknown[] = [];
    setErrorTrackerForTests((error) => { reported.push(error); });

    try {
        handleStaleChunkPreloadError({ payload: new Error(STALE_ASSET_MESSAGE) });
        assert.equal(state.reloadCalls, 1);

        // A long-lived tab spans a second deploy: a different content-hashed
        // asset now fails. It must still get its own reload rather than being
        // treated as exhausted by the earlier, unrelated failure. The first
        // reload's navigation would have actually completed by now (a fresh
        // page load), so simulate that module-state reset explicitly.
        resetStaleChunkRecoveryForTests();
        handleStaleChunkPreloadError({ payload: new Error(OTHER_DEPLOY_ASSET_MESSAGE) });

        assert.equal(state.reloadCalls, 2, 'a new deploy\'s distinct failure must still get a reload');
        assert.equal(reported.length, 0);
    } finally {
        restoreWindow();
        resetErrorTrackerForTests();
    }
});

test('a different build gets its own reload budget even for a message with no embedded URL', async () => {
    const { handleStaleChunkPreloadError, resetStaleChunkRecoveryForTests } = await import('../lib/stale-chunk-recovery');
    resetStaleChunkRecoveryForTests();
    const state = stubWindow('https://anhanga.tur.br/assets/index-BUILD1.js');
    const reported: unknown[] = [];
    setErrorTrackerForTests((error) => { reported.push(error); });

    try {
        handleStaleChunkPreloadError({ payload: new Error(BARE_MESSAGE_NO_URL) });
        assert.equal(state.reloadCalls, 1);

        // The reload lands on a NEW deploy (different content-hashed entry
        // script), which then also hits the exact same URL-less message.
        // Keying purely by message text would collide here; the build
        // fingerprint must disambiguate it. Simulate the fresh page load's
        // module-state reset that a real reload's navigation would produce.
        resetStaleChunkRecoveryForTests();
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
    const { handleStaleChunkPreloadError, resetStaleChunkRecoveryForTests } = await import('../lib/stale-chunk-recovery');
    resetStaleChunkRecoveryForTests();
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

test('the vite:preloadError listener and ChunkErrorBoundary cannot each reload independently for one failure, and no false incident is reported', async () => {
    const { handleStaleChunkPreloadError, attemptStaleChunkBoundaryReload, resetStaleChunkRecoveryForTests } =
        await import('../lib/stale-chunk-recovery');
    resetStaleChunkRecoveryForTests();
    const state = stubWindow();
    const reported: unknown[] = [];
    setErrorTrackerForTests((error) => { reported.push(error); });

    try {
        // The vite:preloadError listener reloads first and consumes the budget
        // for this specific failing asset...
        handleStaleChunkPreloadError({ payload: new Error(STALE_ASSET_MESSAGE) });
        assert.equal(state.reloadCalls, 1);

        // ...so if the SAME failure also reaches ChunkErrorBoundary afterward
        // (e.g. via the render-time throw that the listener deliberately lets
        // propagate) *before the reload's navigation actually completes* —
        // location.reload() doesn't halt the current script — the boundary
        // must see that asset's budget already spent and must NOT reload
        // again. Crucially, it also must NOT report a false "did not
        // recover" incident: recovery is still genuinely underway, just not
        // finished navigating yet.
        const boundaryReloaded = attemptStaleChunkBoundaryReload(new Error(STALE_ASSET_MESSAGE));

        assert.equal(boundaryReloaded, false);
        assert.equal(state.reloadCalls, 1, 'a single failure must not trigger two reloads');
        assert.equal(reported.length, 0, 'must not report a false incident while the in-flight reload has not finished navigating yet');
    } finally {
        restoreWindow();
        resetErrorTrackerForTests();
    }
});

test('a failure that survives a completed reload (a fresh page load) is still reported as a genuine incident', async () => {
    const { handleStaleChunkPreloadError, attemptStaleChunkBoundaryReload, resetStaleChunkRecoveryForTests } =
        await import('../lib/stale-chunk-recovery');
    resetStaleChunkRecoveryForTests();
    const state = stubWindow();
    const reported: unknown[] = [];
    setErrorTrackerForTests((error) => { reported.push(error); });

    try {
        // First page load: the listener reloads once for this failing asset.
        handleStaleChunkPreloadError({ payload: new Error(STALE_ASSET_MESSAGE) });
        assert.equal(state.reloadCalls, 1);

        // The reload's navigation completes — a genuinely fresh page load,
        // distinct from the in-flight case above. sessionStorage (and so the
        // budget) persists across it; module state does not.
        resetStaleChunkRecoveryForTests();

        // The same asset fails again on the new page: the deploy is
        // genuinely broken, not just stale. This must be reported, not
        // silently swallowed as though a reload were still pending.
        const boundaryReloaded = attemptStaleChunkBoundaryReload(new Error(STALE_ASSET_MESSAGE));

        assert.equal(boundaryReloaded, false);
        assert.equal(state.reloadCalls, 1, 'must not reload a second time for the same asset');
        assert.equal(reported.length, 1, 'a failure persisting across a completed reload must be reported');
    } finally {
        restoreWindow();
        resetErrorTrackerForTests();
    }
});

test('an already-exhausted failure reaching both the listener and ChunkErrorBoundary is reported once, not twice', async () => {
    const { handleStaleChunkPreloadError, attemptStaleChunkBoundaryReload, resetStaleChunkRecoveryForTests } =
        await import('../lib/stale-chunk-recovery');
    resetStaleChunkRecoveryForTests();
    const state = stubWindow();
    const reported: unknown[] = [];
    setErrorTrackerForTests((error) => { reported.push(error); });

    try {
        // First page load spends the budget for this asset...
        handleStaleChunkPreloadError({ payload: new Error(STALE_ASSET_MESSAGE) });
        assert.equal(state.reloadCalls, 1);

        // ...that reload's navigation completes (a fresh page load; the
        // sessionStorage budget persists, module state doesn't), and the
        // SAME asset fails again — a genuine, already-exhausted incident.
        resetStaleChunkRecoveryForTests();
        handleStaleChunkPreloadError({ payload: new Error(STALE_ASSET_MESSAGE) });
        assert.equal(reported.length, 1, 'the listener must report the already-exhausted failure');

        // Without preventDefault(), Vite's re-thrown rejection also reaches
        // ChunkErrorBoundary (via React re-rendering the failed lazy
        // component) for this exact same occurrence, still within the same
        // page load as the listener's report above.
        const boundaryReloaded = attemptStaleChunkBoundaryReload(new Error(STALE_ASSET_MESSAGE));

        assert.equal(boundaryReloaded, false);
        assert.equal(state.reloadCalls, 1, 'must not reload again for an already-exhausted asset');
        assert.equal(reported.length, 1, 'the boundary must not report the same already-handled occurrence a second time');
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

// --- Credential leakage through telemetry URLs (CWE-532) -------------------
// The signed NPS invite link (`/nps?token=…`, lib/nps-invite.ts) is a bearer
// credential: it authorizes writing a score/comment onto a customer's Odoo
// `res.partner`. Sentry attaches the raw URL to errors AND to every sampled
// transaction, so it must never reach the wire unredacted.

test('scrubSensitiveUrl redacts credential-bearing query params but keeps attribution', () => {
    const scrubbed = scrubSensitiveUrl(
        'https://www.anhanga.tur.br/nps?firstname=Ana&token=abc.def&utm_source=email&gclid=xyz',
    );

    assert.doesNotMatch(scrubbed, /abc\.def/);
    assert.match(scrubbed, /token=\[redacted\]/);
    // Attribution params must survive or Sentry URLs stop being useful.
    assert.match(scrubbed, /utm_source=email/);
    assert.match(scrubbed, /gclid=xyz/);
    assert.match(scrubbed, /firstname=Ana/);
});

test('scrubSensitiveUrl leaves clean URLs untouched and never throws on malformed input', () => {
    const clean = 'https://www.anhanga.tur.br/blog/vistos?page=2#faq';
    assert.equal(scrubSensitiveUrl(clean), clean);
    assert.equal(scrubSensitiveUrl('/nps'), '/nps');
    // A malformed percent-escape must not blow up the beforeSend hook.
    assert.equal(scrubSensitiveUrl('/nps?token=%E0%A4%A'), '/nps?token=[redacted]');
    // The fragment must be preserved verbatim after the scrubbed query.
    assert.equal(scrubSensitiveUrl('/nps?token=abc#thanks'), '/nps?token=[redacted]#thanks');
});

test('scrubEventUrls redacts the request URL on errors and transactions', () => {
    const event = {
        request: { url: 'https://www.anhanga.tur.br/nps?token=secret-invite' },
        contexts: { trace: { data: { 'url.full': 'https://www.anhanga.tur.br/nps?token=secret-invite' } } },
    };

    const scrubbed = scrubEventUrls(event);

    assert.equal(scrubbed.request.url, 'https://www.anhanga.tur.br/nps?token=[redacted]');
    assert.equal(
        scrubbed.contexts.trace.data['url.full'],
        'https://www.anhanga.tur.br/nps?token=[redacted]',
    );
});

test('sentryBeforeSend scrubs the request URL of events it keeps', () => {
    const event = {
        request: { url: 'https://www.anhanga.tur.br/nps?token=secret-invite' },
        exception: { values: [{ value: 'Boom' }] },
    } as unknown as SentryErrorEvent;

    const kept = sentryBeforeSend(event);

    assert.ok(kept, 'a genuine error must still be reported');
    assert.equal(kept.request?.url, 'https://www.anhanga.tur.br/nps?token=[redacted]');
});

test('sentryBeforeBreadcrumb scrubs navigation and fetch breadcrumb URLs', () => {
    const navigation = sentryBeforeBreadcrumb({
        category: 'navigation',
        data: { from: '/nps?token=one', to: '/nps?token=two' },
    });

    assert.equal(navigation.data?.from, '/nps?token=[redacted]');
    assert.equal(navigation.data?.to, '/nps?token=[redacted]');

    const untouched = { category: 'ui.click', data: { url: '/blog' } };
    assert.equal(sentryBeforeBreadcrumb(untouched), untouched, 'clean breadcrumbs must not be re-allocated');
});

test('both Sentry entry points scrub URLs on errors, transactions and breadcrumbs', async () => {
    const [clientSource, middlewareSource] = await Promise.all([
        readProjectFile('lib/sentry-client.ts'),
        readProjectFile('functions/_middleware.ts'),
    ]);

    // Both SDKs sample 10% of traffic into transactions, which carry request.url
    // even with no error — beforeSend alone is not enough.
    assert.match(clientSource, /beforeSendTransaction:\s*scrubEventUrls/);
    assert.match(clientSource, /beforeBreadcrumb:\s*sentryBeforeBreadcrumb/);
    assert.match(middlewareSource, /beforeSend:\s*scrubEventUrls/);
    assert.match(middlewareSource, /beforeSendTransaction:\s*scrubEventUrls/);
    // The middleware needs all three too: the Workers runtime auto-instruments
    // outbound fetch breadcrumbs. Asserting this only on the client is what let
    // the missing hook slip through review the first time.
    assert.match(middlewareSource, /beforeBreadcrumb:\s*scrubBreadcrumbUrls/);

    // The Pages middleware must reach the scrubber without pulling @sentry/react
    // into the Worker bundle.
    assert.doesNotMatch(middlewareSource, /from ['"]\.\.\/lib\/sentry-client['"]/);
});

// --- Gaps found in review of the first cut of this fix ---------------------

test('scrubEventUrls redacts request.query_string, which the Cloudflare SDK fills separately from request.url', () => {
    // @sentry/cloudflare builds event.request via winterCGRequestToRequestData,
    // which sets `query_string` from the same URL but as its own field. Scrubbing
    // only `url` left the token fully intact on the server path.
    const event = scrubEventUrls({
        request: {
            url: 'https://www.anhanga.tur.br/nps?token=secret-invite',
            query_string: 'firstname=Ana&token=secret-invite',
        },
    });

    assert.equal(event.request.url, 'https://www.anhanga.tur.br/nps?token=[redacted]');
    assert.equal(event.request.query_string, 'firstname=Ana&token=[redacted]');
});

test('scrubQueryParams handles all three shapes Sentry may use for query_string', () => {
    assert.equal(scrubQueryParams('a=1&token=x'), 'a=1&token=[redacted]');
    assert.deepEqual(scrubQueryParams({ utm_source: 'email', token: 'x' }), {
        utm_source: 'email',
        token: '[redacted]',
    });
    assert.deepEqual(scrubQueryParams([['gclid', 'g'], ['token', 'x']]), [
        ['gclid', 'g'],
        ['token', '[redacted]'],
    ]);
});

test('scrubEventUrls redacts child span attributes, not just the root trace context', () => {
    // A sampled transaction carries instrumented outbound fetches as child spans.
    // The GA4 Measurement Protocol requires api_secret in the query string
    // (lib/conversions/google.ts), so that secret rides in a span URL by design.
    const event = scrubEventUrls({
        spans: [
            { data: { 'url.full': 'https://www.google-analytics.com/mp/collect?measurement_id=G-X&api_secret=live-secret' } },
            { data: { 'http.method': 'POST' } },
        ],
    });

    assert.equal(
        event.spans[0].data['url.full'],
        'https://www.google-analytics.com/mp/collect?measurement_id=G-X&api_secret=[redacted]',
    );
    assert.equal(event.spans[1].data['http.method'], 'POST', 'non-URL span attributes must be left alone');
});

test('scrubSensitiveUrl redacts the OAuth authorization code and state', () => {
    // api/auth/callback.ts receives ?code=&state= on every login. The code is
    // exchangeable for a repo,user-scoped GitHub token until it is spent, and
    // neither name is matched by the payload-key pattern.
    const scrubbed = scrubSensitiveUrl('https://www.anhanga.tur.br/api/auth/callback?code=live-code&state=csrf');

    assert.equal(scrubbed, 'https://www.anhanga.tur.br/api/auth/callback?code=[redacted]&state=[redacted]');
});

test('code and state stay readable in structured log payloads', () => {
    // The URL-only list must NOT leak into sanitizeForErrorTracking: nearly every
    // JSON response in this repo carries a `code` field, and redacting it there
    // would erase the error taxonomy.
    const sanitized = sanitizeForErrorTracking({ code: 'VALIDATION_ERROR', state: 'form', token: 'abc' }) as Record<string, unknown>;

    assert.equal(sanitized.code, 'VALIDATION_ERROR');
    assert.equal(sanitized.state, 'form');
    assert.equal(sanitized.token, '[redacted]');
});

test('scrubSensitiveUrl matches percent-encoded parameter names', () => {
    // URLSearchParams.get('token') decodes %74oken, so the page still reads the
    // credential — matching only the raw spelling would let it through.
    assert.equal(scrubSensitiveUrl('/nps?%74oken=secret'), '/nps?%74oken=[redacted]');
    // A malformed escape must fall back to the raw spelling instead of throwing.
    assert.equal(scrubSensitiveUrl('/nps?%E0%A4%A=1&token=x'), '/nps?%E0%A4%A=1&token=[redacted]');
});
