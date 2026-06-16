import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCorsHeaders, buildJsonResponse, getClientIP } from '../lib/network.ts';

test('getClientIP uses Cloudflare connecting IP before spoofable headers', () => {
    const request = new Request('https://example.com/api/generate', {
        headers: {
            'cf-connecting-ip': '203.0.113.10',
            'x-real-ip': '10.0.0.99',
            'x-vercel-forwarded-for': '10.0.0.98',
            'x-forwarded-for': '10.0.0.97, 198.51.100.20',
        },
    });

    assert.equal(getClientIP(request), '203.0.113.10');
});

test('getClientIP uses the leftmost (original client) IP from X-Forwarded-For', () => {
    const request = new Request('https://example.com/api/generate', {
        headers: {
            'x-forwarded-for': '203.0.113.42, 198.51.100.30',
        },
    });

    // Leftmost is the original client per RFC 7239; rightmost is the last proxy.
    assert.equal(getClientIP(request), '203.0.113.42');
});

test('getClientIP X-Forwarded-For with single IP returns that IP', () => {
    const request = new Request('https://example.com/api/generate', {
        headers: {
            'x-forwarded-for': '203.0.113.55',
        },
    });

    assert.equal(getClientIP(request), '203.0.113.55');
});

test('getClientIP X-Forwarded-For is consistent with x-vercel-forwarded-for (both take first IP)', () => {
    const vercelRequest = new Request('https://example.com/api/generate', {
        headers: { 'x-vercel-forwarded-for': '203.0.113.10, 10.0.0.1' },
    });
    const xffRequest = new Request('https://example.com/api/generate', {
        headers: { 'x-forwarded-for': '203.0.113.10, 10.0.0.1' },
    });

    assert.equal(getClientIP(vercelRequest), getClientIP(xffRequest));
});

test('buildCorsHeaders falls back to the default origin for a wildcard', () => {
    const headers = buildCorsHeaders('*');
    assert.equal(headers['Access-Control-Allow-Origin'], 'https://www.anhanga.tur.br');
});

test('buildCorsHeaders echoes a valid HTTPS origin', () => {
    const headers = buildCorsHeaders('https://www.anhanga.tur.br');
    assert.equal(headers['Access-Control-Allow-Origin'], 'https://www.anhanga.tur.br');
});

test('buildCorsHeaders echoes a local http origin for dev', () => {
    const headers = buildCorsHeaders('http://localhost:3000');
    assert.equal(headers['Access-Control-Allow-Origin'], 'http://localhost:3000');
});

test('buildCorsHeaders echoes the IPv6 loopback origin for dev', () => {
    const headers = buildCorsHeaders('http://[::1]:3000');
    assert.equal(headers['Access-Control-Allow-Origin'], 'http://[::1]:3000');
});

test('buildCorsHeaders falls back to the default origin when ALLOWED_ORIGIN is a wildcard', (t) => {
    const original = process.env.ALLOWED_ORIGIN;
    t.after(() => {
        if (original === undefined) {
            delete process.env.ALLOWED_ORIGIN;
        } else {
            process.env.ALLOWED_ORIGIN = original;
        }
    });

    process.env.ALLOWED_ORIGIN = '*';

    const headers = buildCorsHeaders();
    assert.equal(headers['Access-Control-Allow-Origin'], 'https://www.anhanga.tur.br');
});

test('buildJsonResponse auto-derives X-Request-Id from body.requestId', async () => {
    const response = buildJsonResponse({ requestId: 'r1', ok: true }, 200, {});
    assert.equal(response.headers.get('X-Request-Id'), 'r1');
    assert.equal(response.headers.get('Content-Type'), 'application/json');
});

test('buildJsonResponse omits X-Request-Id when body has no requestId', async () => {
    const response = buildJsonResponse({ ok: true }, 200, {});
    assert.equal(response.headers.get('X-Request-Id'), null);
});

test('buildJsonResponse uses options.requestId over body.requestId', async () => {
    const response = buildJsonResponse({ requestId: 'r1', ok: true }, 200, {}, { requestId: 'explicit' });
    assert.equal(response.headers.get('X-Request-Id'), 'explicit');
});

test('buildJsonResponse suppresses X-Request-Id when options.requestId is null', async () => {
    const response = buildJsonResponse({ requestId: 'r1', ok: true }, 200, {}, { requestId: null });
    assert.equal(response.headers.get('X-Request-Id'), null);
});

test('buildJsonResponse handles a null body without throwing', async () => {
    const response = buildJsonResponse(null, 200, {});
    assert.equal(response.headers.get('X-Request-Id'), null);
    assert.equal(response.headers.get('Content-Type'), 'application/json');
});

test('buildJsonResponse merges corsHeaders', async () => {
    const response = buildJsonResponse({ ok: true }, 200, { 'Access-Control-Allow-Origin': 'https://example.com' });
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://example.com');
});
