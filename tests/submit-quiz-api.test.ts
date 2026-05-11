import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { classifySubmitQuizError } from '../api/submit-quiz.ts';

const originalFetch = global.fetch;

function buildRequest(body: Record<string, unknown>, init?: { headers?: Record<string, string>; method?: string }): Request {
    const ipSuffix = Math.floor(Math.random() * 200) + 1;
    const method = init?.method || 'POST';

    return new Request('http://localhost/api/submit-quiz', {
        method,
        headers: {
            'Content-Type': 'application/json',
            'x-real-ip': `127.0.0.${ipSuffix}`,
            ...init?.headers,
        },
        body: (method === 'OPTIONS' || method === 'GET' || method === 'HEAD') ? undefined : JSON.stringify(body),
    });
}

test('submit-quiz should return 405 for non-POST requests', async () => {
    const response = await handler(buildRequest({}, { method: 'GET' }));
    assert.equal(response.status, 405);
    const payload = await response.json();
    assert.equal(payload.code, 'METHOD_NOT_ALLOWED');
});

test('submit-quiz should return 503 when config is missing', async () => {
    const originalUrl = process.env.N8N_SUBMIT_QUIZ_WEBHOOK_URL;
    const originalSecret = process.env.N8N_WEBHOOK_SECRET;

    delete process.env.N8N_SUBMIT_QUIZ_WEBHOOK_URL;
    delete process.env.N8N_WEBHOOK_SECRET;

    try {
        const response = await handler(buildRequest({}));
        assert.equal(response.status, 503);
        const payload = await response.json();
        assert.equal(payload.code, 'SERVER_CONFIG_ERROR');
    } finally {
        process.env.N8N_SUBMIT_QUIZ_WEBHOOK_URL = originalUrl;
        process.env.N8N_WEBHOOK_SECRET = originalSecret;
    }
});

test('classifySubmitQuizError should return generic error message but preserve detail', () => {
    const error = new Error('N8N_WEBHOOK_ERROR:502:Internal Server Error');
    const result = classifySubmitQuizError(error);

    assert.equal(result.code, 'N8N_WEBHOOK_ERROR');
    assert.equal(result.status, 502);
    assert.equal(result.error, 'Erro ao processar quiz.');
    assert.equal(result.detail, 'Internal Server Error');
});

test('submit-quiz should enforce rate-limit even for invalid payloads', async () => {
    const originalUrl = process.env.N8N_SUBMIT_QUIZ_WEBHOOK_URL;
    const originalSecret = process.env.N8N_WEBHOOK_SECRET;
    process.env.N8N_SUBMIT_QUIZ_WEBHOOK_URL = 'http://mock';
    process.env.N8N_WEBHOOK_SECRET = 'secret';

    const sharedIP = '10.0.0.1';
    const buildSharedRequest = (body: unknown) => new Request('http://localhost/api/submit-quiz', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-real-ip': sharedIP,
        },
        body: JSON.stringify(body),
    });

    try {
        // limit is 5
        for (let i = 0; i < 5; i++) {
            const res = await handler(buildSharedRequest({ invalid: true }));
            assert.equal(res.status, 400);
        }

        const res = await handler(buildSharedRequest({}));
        assert.equal(res.status, 429);
        const payload = await res.json();
        assert.equal(payload.code, 'RATE_LIMIT_EXCEEDED');
    } finally {
        process.env.N8N_SUBMIT_QUIZ_WEBHOOK_URL = originalUrl;
        process.env.N8N_WEBHOOK_SECRET = originalSecret;
    }
});
