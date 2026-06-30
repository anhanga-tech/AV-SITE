import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { classifySubmitQuizError } from '../api/submit-quiz';
import { setOdooEnv, clearOdooEnv } from './odoo-mock.ts';

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
    assert.equal((await response.json()).code, 'METHOD_NOT_ALLOWED');
});

test('submit-quiz should return 503 when Odoo config is missing', async (t) => {
    t.after(clearOdooEnv);
    clearOdooEnv();
    const response = await handler(buildRequest({}));
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, 'SERVER_CONFIG_ERROR');
});

test('classifySubmitQuizError should return generic error message but preserve detail', () => {
    const result = classifySubmitQuizError(new Error('ODOO_ERROR:502:Internal Server Error'));
    assert.equal(result.code, 'ODOO_ERROR');
    assert.equal(result.status, 502);
    assert.equal(result.error, 'Erro ao processar quiz.');
    assert.equal(result.detail, 'Internal Server Error');
});

test('submit-quiz should enforce rate-limit even for invalid payloads', async (t) => {
    t.after(clearOdooEnv);
    setOdooEnv();

    const sharedIP = '10.0.0.1';
    const req = (body: unknown) => new Request('http://localhost/api/submit-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-real-ip': sharedIP },
        body: JSON.stringify(body),
    });

    for (let i = 0; i < 5; i++) {
        const res = await handler(req({ invalid: true }));
        assert.equal(res.status, 400);
    }

    const res = await handler(req({}));
    assert.equal(res.status, 429);
    assert.equal((await res.json()).code, 'RATE_LIMIT_EXCEEDED');
});
