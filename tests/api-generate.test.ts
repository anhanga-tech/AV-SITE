import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { buildGeminiErrorResponse } from '../api/generate.ts';
import { buildCorsHeaders } from '../lib/network.ts';

const originalEnv = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    AI_GATEWAY_ENABLED: process.env.AI_GATEWAY_ENABLED,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_AI_GATEWAY_TOKEN: process.env.CLOUDFLARE_AI_GATEWAY_TOKEN,
};

function restoreEnv() {
    for (const [key, value] of Object.entries(originalEnv)) {
        if (value === undefined) {
            delete process.env[key];
        } else {
            process.env[key] = value;
        }
    }
}

function buildPostRequest(body: unknown, ip?: string): Request {
    const suffix = Math.floor(Math.random() * 200) + 1;
    return new Request('http://localhost/api/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-real-ip': ip ?? `192.168.1.${suffix}`,
        },
        body: JSON.stringify(body),
    });
}

function validBody() {
    return {
        contents: [{ role: 'user', parts: [{ text: 'Quero ir para Maldivas.' }] }],
    };
}

// ─── Method gate ─────────────────────────────────────────────────────────────

test('generate handler returns 204 for OPTIONS preflight', async () => {
    const response = await handler(new Request('http://localhost/api/generate', { method: 'OPTIONS' }));
    assert.equal(response.status, 204);
});

test('generate handler returns 405 for GET requests', async () => {
    const response = await handler(new Request('http://localhost/api/generate', { method: 'GET' }));
    assert.equal(response.status, 405);

    const body = await response.json() as { error: string };
    assert.equal(body.error, 'Method not allowed');
});

// ─── Validation errors ───────────────────────────────────────────────────────

test('generate handler returns 400 VALIDATION_ERROR for empty contents array', async (t) => {
    t.after(restoreEnv);

    process.env.GEMINI_API_KEY = 'test-key';
    delete process.env.AI_GATEWAY_ENABLED;

    const response = await handler(buildPostRequest({ contents: [] }));
    const body = await response.json() as { error: string };

    assert.equal(response.status, 400);
    assert.equal(body.error, 'VALIDATION_ERROR');
});

test('generate handler returns 400 VALIDATION_ERROR for missing contents field', async (t) => {
    t.after(restoreEnv);

    process.env.GEMINI_API_KEY = 'test-key';
    delete process.env.AI_GATEWAY_ENABLED;

    const response = await handler(buildPostRequest({}));
    const body = await response.json() as { error: string };

    assert.equal(response.status, 400);
    assert.equal(body.error, 'VALIDATION_ERROR');
});

test('generate handler returns 400 VALIDATION_ERROR for contents exceeding 50 entries', async (t) => {
    t.after(restoreEnv);

    process.env.GEMINI_API_KEY = 'test-key';
    delete process.env.AI_GATEWAY_ENABLED;

    const contents = Array.from({ length: 51 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'model',
        parts: [{ text: 'mensagem' }],
    }));

    const response = await handler(buildPostRequest({ contents }));
    const body = await response.json() as { error: string };

    assert.equal(response.status, 400);
    assert.equal(body.error, 'VALIDATION_ERROR');
});

test('generate handler returns 400 for malformed JSON body', async (t) => {
    t.after(restoreEnv);

    process.env.GEMINI_API_KEY = 'test-key';
    delete process.env.AI_GATEWAY_ENABLED;

    const response = await handler(new Request('http://localhost/api/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-real-ip': '192.168.2.1',
        },
        body: '{ invalid json',
    }));

    assert.equal(response.status, 400);
});

// ─── Rate limiting ────────────────────────────────────────────────────────────

test('generate handler returns 429 after exceeding rate limit', async (t) => {
    t.after(restoreEnv);

    process.env.GEMINI_API_KEY = 'test-key';
    delete process.env.AI_GATEWAY_ENABLED;

    const sharedIp = `172.16.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`;

    const makeRequest = () => new Request('http://localhost/api/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-real-ip': sharedIp,
        },
        body: JSON.stringify(validBody()),
    });

    // The handler calls Gemini after rate limit check; to avoid that, we use
    // an invalid config so it returns 500 before touching the AI provider.
    // The rate limiter still increments on every request (including 5xx).
    delete process.env.GEMINI_API_KEY;

    for (let i = 0; i < 10; i++) {
        await handler(makeRequest());
    }

    const limited = await handler(makeRequest());
    const body = await limited.json() as { error: string };

    assert.equal(limited.status, 429);
    assert.match(body.error, /Muitas requisições/i);
    assert.ok(limited.headers.get('Retry-After'), 'Retry-After header must be set');
    assert.ok(limited.headers.get('X-RateLimit-Remaining'), 'X-RateLimit-Remaining must be set');
    assert.equal(limited.headers.get('RateLimit-Limit'), '10', 'RateLimit-Limit must reflect the configured max');
    assert.equal(limited.headers.get('RateLimit-Remaining'), '0', 'RateLimit-Remaining must be 0 once exhausted');
    assert.ok(limited.headers.get('RateLimit-Reset'), 'RateLimit-Reset header must be set');
});

// ─── Config error ────────────────────────────────────────────────────────────

test('generate handler returns 500 SERVER_CONFIG_ERROR when GEMINI_API_KEY is missing', async (t) => {
    t.after(restoreEnv);

    delete process.env.GEMINI_API_KEY;
    delete process.env.AI_GATEWAY_ENABLED;

    const response = await handler(buildPostRequest(validBody()));
    const body = await response.json() as { code: string };

    assert.equal(response.status, 500);
    assert.equal(body.code, 'SERVER_CONFIG_ERROR');
    assert.equal(response.headers.get('RateLimit-Limit'), '10', 'the rate-limit check already ran, so quota should be visible even on a config error');
    assert.ok(response.headers.get('RateLimit-Remaining'));
});

test('generate handler sets RateLimit-* headers on a 400 VALIDATION_ERROR (the bucket was already consumed)', async (t) => {
    t.after(restoreEnv);

    process.env.GEMINI_API_KEY = 'test-key';
    delete process.env.AI_GATEWAY_ENABLED;

    const response = await handler(buildPostRequest({ contents: [] }));

    assert.equal(response.status, 400);
    assert.equal(response.headers.get('RateLimit-Limit'), '10');
    assert.ok(response.headers.get('RateLimit-Remaining'));
    assert.ok(response.headers.get('RateLimit-Reset'));
});

// ─── Gemini error mapping (via buildGeminiErrorResponse) ─────────────────────

test('buildGeminiErrorResponse maps 401 to GEMINI_AUTH_ERROR', () => {
    const corsHeaders = buildCorsHeaders();
    const error = { status: 401, message: 'Unauthorized' };

    const response = buildGeminiErrorResponse(error, corsHeaders);

    assert.equal(response.status, 401);
});

test('buildGeminiErrorResponse maps 403 to GEMINI_AUTH_ERROR', async () => {
    const corsHeaders = buildCorsHeaders();
    const error = { status: 403, message: 'Forbidden' };

    const response = buildGeminiErrorResponse(error, corsHeaders);
    const body = await response.json() as { code: string; error: string };

    assert.equal(response.status, 401);
    assert.equal(body.code, 'GEMINI_AUTH_ERROR');
    assert.ok(!body.error.toLowerCase().includes('forbidden'), 'must not leak raw error details');
});

test('buildGeminiErrorResponse maps 429 to GEMINI_RATE_LIMIT', async () => {
    const corsHeaders = buildCorsHeaders();
    const error = { status: 429, message: 'Too Many Requests' };

    const response = buildGeminiErrorResponse(error, corsHeaders);
    const body = await response.json() as { code: string; error: string };

    assert.equal(response.status, 429);
    assert.equal(body.code, 'GEMINI_RATE_LIMIT');
    assert.ok(!body.error.toLowerCase().includes('too many'), 'must not leak raw error details');
});

test('buildGeminiErrorResponse maps 500+ to GEMINI_UPSTREAM_ERROR without leaking details', async () => {
    const corsHeaders = buildCorsHeaders();
    const error = { status: 503, message: 'Service Unavailable — upstream overloaded' };

    const response = buildGeminiErrorResponse(error, corsHeaders);
    const body = await response.json() as { code: string; error: string };

    assert.equal(response.status, 503);
    assert.equal(body.code, 'GEMINI_UPSTREAM_ERROR');
    assert.ok(!body.error.includes('upstream overloaded'), 'must not leak raw upstream error');
});

test('buildGeminiErrorResponse maps 404 with model message to GEMINI_MODEL_ERROR', async () => {
    const corsHeaders = buildCorsHeaders();
    const error = { status: 404, message: 'model not found: gemini-99-flash' };

    const response = buildGeminiErrorResponse(error, corsHeaders);
    const body = await response.json() as { code: string };

    assert.equal(response.status, 500);
    assert.equal(body.code, 'GEMINI_MODEL_ERROR');
});

test('buildGeminiErrorResponse maps 404 without model message to GEMINI_UPSTREAM_ERROR', async () => {
    // A 404 from the AI Gateway (gateway not found, no model context) must not
    // silently collapse to GEMINI_INTERNAL_ERROR — it is an upstream reachability failure.
    const corsHeaders = buildCorsHeaders();
    const error = { status: 404, message: 'Not Found' };

    const response = buildGeminiErrorResponse(error, corsHeaders);
    const body = await response.json() as { code: string; error: string };

    assert.equal(response.status, 503);
    assert.equal(body.code, 'GEMINI_UPSTREAM_ERROR');
    assert.ok(!body.error.includes('Not Found'), 'must not leak raw upstream error');
});

test('buildGeminiErrorResponse maps 400 from upstream to GEMINI_UPSTREAM_ERROR', async () => {
    const corsHeaders = buildCorsHeaders();
    const error = { status: 400, message: 'Bad Request from AI Gateway' };

    const response = buildGeminiErrorResponse(error, corsHeaders);
    const body = await response.json() as { code: string };

    assert.equal(response.status, 503);
    assert.equal(body.code, 'GEMINI_UPSTREAM_ERROR');
});

test('buildGeminiErrorResponse maps unknown errors (no status) to GEMINI_INTERNAL_ERROR', async () => {
    // No status means a network-level failure: TypeError, DNS error, connection refused, etc.
    const corsHeaders = buildCorsHeaders();
    const error = { message: 'something unexpected happened' };

    const response = buildGeminiErrorResponse(error, corsHeaders);
    const body = await response.json() as { code: string };

    assert.equal(response.status, 500);
    assert.equal(body.code, 'GEMINI_INTERNAL_ERROR');
});
