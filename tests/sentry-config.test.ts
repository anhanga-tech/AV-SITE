import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

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

test('client filters stale-chunk noise already recovered by the preload-error reload', async () => {
    const [entrySource, sentrySource] = await Promise.all([
        readProjectFile('index.tsx'),
        readProjectFile('lib/sentry-client.ts'),
    ]);

    assert.match(entrySource, /vite:preloadError/);
    assert.match(sentrySource, /Unable to preload CSS for/);
    assert.match(sentrySource, /isStaleChunkMessage\(exceptions\)\) return null/);
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
