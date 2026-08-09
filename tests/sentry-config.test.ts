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
    const [entrySource, sentrySource] = await Promise.all([
        readProjectFile('index.tsx'),
        readProjectFile('lib/sentry-client.ts'),
    ]);

    assert.match(entrySource, /vite:preloadError/);
    assert.match(entrySource, /attemptStaleChunkReload/);
    assert.match(sentrySource, /Unable to preload CSS for/);
    assert.match(sentrySource, /isStaleChunkMessage\(exceptions\) && !hasExhaustedStaleChunkReloads\(\)\) return null/);
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

test('stale-chunk reload recovery is bounded so a genuinely broken deploy still reaches Sentry', async () => {
    const recoverySource = await readProjectFile('lib/stale-chunk-recovery.ts');

    assert.match(recoverySource, /MAX_RELOAD_ATTEMPTS = 1/);
    assert.match(recoverySource, /export function attemptStaleChunkReload/);
    assert.match(recoverySource, /export function hasExhaustedStaleChunkReloads/);
    // Storage failures (e.g. private browsing) must fail safe toward "exhausted",
    // not toward an unbounded reload loop.
    assert.match(recoverySource, /attempts === null \|\| attempts >= MAX_RELOAD_ATTEMPTS/);
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
