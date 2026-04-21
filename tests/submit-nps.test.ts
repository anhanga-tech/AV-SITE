import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/submit-nps.ts';

const originalFetch = global.fetch;
const originalNpsWebhookUrl = process.env.NPS_WEBHOOK_URL;

function restoreEnv() {
    if (originalNpsWebhookUrl === undefined) {
        delete process.env.NPS_WEBHOOK_URL;
    } else {
        process.env.NPS_WEBHOOK_URL = originalNpsWebhookUrl;
    }
}

function buildRequest(
    body: unknown,
    init?: { headers?: Record<string, string>; method?: string },
): Request {
    const ipSuffix = Math.floor(Math.random() * 200) + 1;
    const method = init?.method ?? 'POST';

    return new Request('http://localhost/api/submit-nps', {
        method,
        headers: {
            'Content-Type': 'application/json',
            'x-real-ip': `127.0.0.${ipSuffix}`,
            ...init?.headers,
        },
        body: method === 'OPTIONS' || method === 'GET' ? undefined : JSON.stringify(body),
    });
}

interface MockWebhookCall {
    url: string;
    method: string;
    body?: Record<string, unknown>;
}

function createMockWebhookFetch(
    calls: MockWebhookCall[],
    response: Response,
): typeof fetch {
    return (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        calls.push({
            url,
            method: init?.method ?? 'GET',
            body: init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : undefined,
        });
        return response;
    }) as typeof fetch;
}

function validBody(overrides?: Record<string, unknown>) {
    return {
        firstname: 'Maria',
        email: 'maria@example.com',
        score: 9,
        reason: 'Atendimento excelente e viagem perfeita.',
        highlight: 'A visita às Cataratas do Iguaçu.',
        submittedAt: '2026-04-21T10:00:00.000Z',
        ...overrides,
    };
}

// ─── Config errors ──────────────────────────────────────────────────────────

test('submit-nps returns 500 SERVER_CONFIG_ERROR when NPS_WEBHOOK_URL is absent', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    delete process.env.NPS_WEBHOOK_URL;
    global.fetch = createMockWebhookFetch([], new Response('ok', { status: 200 }));

    const response = await handler(buildRequest(validBody()));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 500);
    assert.equal(body.ok, false);
    assert.equal(body.code, 'SERVER_CONFIG_ERROR');
});

// ─── Method gate ─────────────────────────────────────────────────────────────

test('submit-nps returns 405 METHOD_NOT_ALLOWED for GET requests', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.NPS_WEBHOOK_URL = 'https://n8n.example/webhook/nps';

    const response = await handler(buildRequest({}, { method: 'GET' }));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 405);
    assert.equal(body.ok, false);
    assert.equal(body.code, 'METHOD_NOT_ALLOWED');
});

test('submit-nps returns 204 for OPTIONS preflight', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.NPS_WEBHOOK_URL = 'https://n8n.example/webhook/nps';

    const response = await handler(buildRequest({}, { method: 'OPTIONS' }));

    assert.equal(response.status, 204);
});

// ─── JSON parse error ────────────────────────────────────────────────────────

test('submit-nps returns 400 VALIDATION_ERROR for malformed JSON body', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.NPS_WEBHOOK_URL = 'https://n8n.example/webhook/nps';
    global.fetch = createMockWebhookFetch([], new Response('ok', { status: 200 }));

    const request = new Request('http://localhost/api/submit-nps', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-real-ip': '127.0.0.1',
        },
        body: '{ not valid json',
    });

    const response = await handler(request);
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 400);
    assert.equal(body.ok, false);
    assert.equal(body.code, 'VALIDATION_ERROR');
});

// ─── Validation errors ───────────────────────────────────────────────────────

test('submit-nps returns 400 for missing firstname', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.NPS_WEBHOOK_URL = 'https://n8n.example/webhook/nps';
    global.fetch = createMockWebhookFetch([], new Response('ok', { status: 200 }));

    const response = await handler(buildRequest(validBody({ firstname: '' })));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 400);
    assert.equal(body.ok, false);
    assert.equal(body.code, 'VALIDATION_ERROR');
});

test('submit-nps returns 400 for firstname over 100 characters', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.NPS_WEBHOOK_URL = 'https://n8n.example/webhook/nps';
    global.fetch = createMockWebhookFetch([], new Response('ok', { status: 200 }));

    const response = await handler(buildRequest(validBody({ firstname: 'A'.repeat(101) })));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
});

test('submit-nps returns 400 for invalid email', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.NPS_WEBHOOK_URL = 'https://n8n.example/webhook/nps';
    global.fetch = createMockWebhookFetch([], new Response('ok', { status: 200 }));

    const response = await handler(buildRequest(validBody({ email: 'not-an-email' })));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
});

test('submit-nps returns 400 for score below 0', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.NPS_WEBHOOK_URL = 'https://n8n.example/webhook/nps';
    global.fetch = createMockWebhookFetch([], new Response('ok', { status: 200 }));

    const response = await handler(buildRequest(validBody({ score: -1 })));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
});

test('submit-nps returns 400 for score above 10', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.NPS_WEBHOOK_URL = 'https://n8n.example/webhook/nps';
    global.fetch = createMockWebhookFetch([], new Response('ok', { status: 200 }));

    const response = await handler(buildRequest(validBody({ score: 11 })));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
});

test('submit-nps returns 400 for non-integer score', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.NPS_WEBHOOK_URL = 'https://n8n.example/webhook/nps';
    global.fetch = createMockWebhookFetch([], new Response('ok', { status: 200 }));

    const response = await handler(buildRequest(validBody({ score: 7.5 })));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
});

test('submit-nps returns 400 for non-numeric score', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.NPS_WEBHOOK_URL = 'https://n8n.example/webhook/nps';
    global.fetch = createMockWebhookFetch([], new Response('ok', { status: 200 }));

    const response = await handler(buildRequest(validBody({ score: '9' })));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
});

test('submit-nps returns 400 for empty reason', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.NPS_WEBHOOK_URL = 'https://n8n.example/webhook/nps';
    global.fetch = createMockWebhookFetch([], new Response('ok', { status: 200 }));

    const response = await handler(buildRequest(validBody({ reason: '' })));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
});

test('submit-nps returns 400 for reason over 2000 characters', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.NPS_WEBHOOK_URL = 'https://n8n.example/webhook/nps';
    global.fetch = createMockWebhookFetch([], new Response('ok', { status: 200 }));

    const response = await handler(buildRequest(validBody({ reason: 'x'.repeat(2001) })));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
});

test('submit-nps returns 400 for highlight over 2000 characters', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.NPS_WEBHOOK_URL = 'https://n8n.example/webhook/nps';
    global.fetch = createMockWebhookFetch([], new Response('ok', { status: 200 }));

    const response = await handler(buildRequest(validBody({ highlight: 'x'.repeat(2001) })));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
});

// ─── Success path ─────────────────────────────────────────────────────────────

test('submit-nps returns 201 and forwards payload to webhook on success', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.NPS_WEBHOOK_URL = 'https://n8n.example/webhook/nps';

    const calls: MockWebhookCall[] = [];
    global.fetch = createMockWebhookFetch(calls, new Response('ok', { status: 200 }));

    const payload = validBody();
    const response = await handler(buildRequest(payload));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 201);
    assert.equal(body.ok, true);
    assert.ok(typeof body.requestId === 'string' && body.requestId.length > 0);

    assert.equal(calls.length, 1);
    const webhookCall = calls[0]!;
    assert.equal(webhookCall.url, 'https://n8n.example/webhook/nps');
    assert.equal(webhookCall.method, 'POST');
    assert.equal(webhookCall.body?.firstname, 'Maria');
    assert.equal(webhookCall.body?.email, 'maria@example.com');
    assert.equal(webhookCall.body?.score, 9);
    assert.equal(webhookCall.body?.reason, 'Atendimento excelente e viagem perfeita.');
    assert.equal(webhookCall.body?.highlight, 'A visita às Cataratas do Iguaçu.');
    assert.ok(typeof webhookCall.body?.requestId === 'string');
});

test('submit-nps accepts score 0 (boundary)', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.NPS_WEBHOOK_URL = 'https://n8n.example/webhook/nps';
    global.fetch = createMockWebhookFetch([], new Response('ok', { status: 200 }));

    const response = await handler(buildRequest(validBody({ score: 0 })));
    assert.equal(response.status, 201);
});

test('submit-nps accepts score 10 (boundary)', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.NPS_WEBHOOK_URL = 'https://n8n.example/webhook/nps';
    global.fetch = createMockWebhookFetch([], new Response('ok', { status: 200 }));

    const response = await handler(buildRequest(validBody({ score: 10 })));
    assert.equal(response.status, 201);
});

test('submit-nps accepts empty highlight (optional field)', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.NPS_WEBHOOK_URL = 'https://n8n.example/webhook/nps';
    global.fetch = createMockWebhookFetch([], new Response('ok', { status: 200 }));

    const response = await handler(buildRequest(validBody({ highlight: '' })));
    assert.equal(response.status, 201);
});

// ─── Webhook upstream failure ────────────────────────────────────────────────

test('submit-nps returns 502 WEBHOOK_ERROR when upstream returns non-2xx', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.NPS_WEBHOOK_URL = 'https://n8n.example/webhook/nps';
    global.fetch = createMockWebhookFetch([], new Response('Bad Gateway', { status: 502 }));

    const response = await handler(buildRequest(validBody()));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 502);
    assert.equal(body.ok, false);
    assert.equal(body.code, 'WEBHOOK_ERROR');
});

// ─── Rate limiting ────────────────────────────────────────────────────────────

test('submit-nps enforces rate limit after 3 requests from the same IP', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.NPS_WEBHOOK_URL = 'https://n8n.example/webhook/nps';
    global.fetch = createMockWebhookFetch([], new Response('ok', { status: 200 }));

    // Use a fixed unique IP to isolate this test's rate limit bucket
    const uniqueIp = `10.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}.1`;

    function buildRateLimitRequest() {
        return new Request('http://localhost/api/submit-nps', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-real-ip': uniqueIp,
            },
            body: JSON.stringify(validBody()),
        });
    }

    const r1 = await handler(buildRateLimitRequest());
    const r2 = await handler(buildRateLimitRequest());
    const r3 = await handler(buildRateLimitRequest());
    const r4 = await handler(buildRateLimitRequest());

    assert.equal(r1.status, 201, 'first request should succeed');
    assert.equal(r2.status, 201, 'second request should succeed');
    assert.equal(r3.status, 201, 'third request should succeed');
    assert.equal(r4.status, 429, 'fourth request should be rate limited');

    const body4 = await r4.json() as Record<string, unknown>;
    assert.equal(body4.ok, false);
    assert.equal(body4.code, 'RATE_LIMIT_EXCEEDED');
    assert.ok(r4.headers.get('Retry-After'), 'Retry-After header should be set');
    assert.ok(r4.headers.get('X-RateLimit-Remaining'), 'X-RateLimit-Remaining header should be set');
});

test('submit-nps does not consume rate limit quota for invalid payloads', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.NPS_WEBHOOK_URL = 'https://n8n.example/webhook/nps';
    global.fetch = createMockWebhookFetch([], new Response('ok', { status: 200 }));

    const uniqueIp = `10.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}.2`;

    function buildFixedRequest(body: unknown, valid: boolean) {
        return new Request('http://localhost/api/submit-nps', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-real-ip': uniqueIp,
            },
            body: JSON.stringify(valid ? validBody() : body),
        });
    }

    // 3 invalid requests should not fill the bucket
    for (let i = 0; i < 3; i++) {
        const r = await handler(buildFixedRequest({ score: 'not-a-number' }, false));
        assert.equal(r.status, 400);
    }

    // Valid request should still succeed (quota not consumed by invalid calls)
    const validResponse = await handler(buildFixedRequest(null, true));
    assert.equal(validResponse.status, 201, 'valid request after invalid ones should succeed');
});
