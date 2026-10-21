import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import consentHandler from '../api/consent.ts';
import contactHandler from '../api/submit-contact.ts';
import healthHandler from '../api/health.ts';
import { setOdooEnv } from './odoo-mock.ts';

const required = ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'RATE_LIMIT_KEY_SECRET'] as const;

// Restore the complete environment, including the Odoo fixture, after each case.
let saved: NodeJS.ProcessEnv;
test.afterEach(() => {
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
    mock.restoreAll();
});
test.beforeEach(() => {
    saved = { ...process.env };
    process.env.CF_PAGES = '1';
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    process.env.RATE_LIMIT_KEY_SECRET = 'test-hmac-secret';
    setOdooEnv();
    mock.method(globalThis, 'fetch', async () => {
        throw new Error('These checks must not make outbound requests');
    });
});

for (const missing of required) {
    test(`missing ${missing} returns service errors for contact and consent`, async () => {
        delete process.env[missing];
        for (const handler of [contactHandler, consentHandler]) {
            const response = await handler(new Request('https://example.com/api/form', { method: 'POST', body: '{}' }));
            assert.equal(response.status, 503);
            const body = await response.json();
            assert.equal(body.code, 'SERVICE_UNAVAILABLE');
            assert.match(body.error, /indisponível/);
            assert.doesNotMatch(body.error, /Muitas/);
        }
    });

    test(`health reports missing ${missing} without exposing configuration`, async () => {
        delete process.env[missing];
        for (const method of ['GET', 'HEAD']) {
            const response = await healthHandler(new Request('https://example.com/api/health', { method }));
            assert.equal(response.status, 503);
            assert.equal(response.headers.get('Cache-Control'), 'no-store');
            if (method === 'HEAD') {
                assert.equal(await response.text(), '');
            } else {
                assert.deepEqual(await response.json(), { status: 'unavailable', service: 'anhanga-viagens-public-api' });
            }
        }
    });
}

test('health accepts configured edge and unconfigured local development', async () => {
    for (const local of [false, true]) {
        if (local) {
            delete process.env.CF_PAGES;
            delete process.env.VERCEL_ENV;
            for (const name of required) delete process.env[name];
        }
        const response = await healthHandler(new Request('https://example.com/api/health'));
        assert.equal(response.status, 200);
        assert.equal(response.headers.get('Cache-Control'), 'no-store');
        assert.equal((await response.json()).status, 'ok');
    }
});

test('consent still reports quota exhaustion as 429', async () => {
    delete process.env.CF_PAGES;
    delete process.env.VERCEL_ENV;
    for (const name of required) delete process.env[name];
    let response: Response;
    for (let attempt = 0; attempt < 11; attempt += 1) {
        response = await consentHandler(new Request('https://example.com/api/consent', {
            method: 'POST', headers: { 'x-real-ip': '192.0.2.186' }, body: '{}',
        }));
    }
    assert.equal(response!.status, 429);
    const body = await response!.json();
    assert.equal(body.code, 'RATE_LIMIT_EXCEEDED');
    assert.match(body.error, /Muitas tentativas/);
});

test('health rejects blank configuration on Vercel as well as Cloudflare', async () => {
    delete process.env.CF_PAGES;
    process.env.VERCEL_ENV = 'production';
    process.env.RATE_LIMIT_KEY_SECRET = '   ';
    const response = await healthHandler(new Request('https://example.com/api/health'));
    assert.equal(response.status, 503);
});

test('health preserves HEAD and method handling when configured', async () => {
    const head = await healthHandler(new Request('https://example.com/api/health', { method: 'HEAD' }));
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');
    const post = await healthHandler(new Request('https://example.com/api/health', { method: 'POST' }));
    assert.equal(post.status, 405);
    assert.equal(post.headers.get('Allow'), 'GET, HEAD');
});
