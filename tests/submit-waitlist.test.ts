import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { classifySubmitWaitlistError } from '../api/submit-waitlist.ts';

const originalFetch = global.fetch;
const originalEnv = {
    ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    N8N_SUBMIT_WAITLIST_WEBHOOK_URL: process.env.N8N_SUBMIT_WAITLIST_WEBHOOK_URL,
    N8N_WEBHOOK_SECRET: process.env.N8N_WEBHOOK_SECRET,
    N8N_WEBHOOK_TIMEOUT_MS: process.env.N8N_WEBHOOK_TIMEOUT_MS,
};

function restoreEnvValue(key: string, value: string | undefined) {
    if (value === undefined) {
        delete process.env[key];
        return;
    }

    process.env[key] = value;
}

function restoreEnv() {
    restoreEnvValue('ALLOWED_ORIGIN', originalEnv.ALLOWED_ORIGIN);
    restoreEnvValue('UPSTASH_REDIS_REST_URL', originalEnv.UPSTASH_REDIS_REST_URL);
    restoreEnvValue('UPSTASH_REDIS_REST_TOKEN', originalEnv.UPSTASH_REDIS_REST_TOKEN);
    restoreEnvValue('N8N_SUBMIT_WAITLIST_WEBHOOK_URL', originalEnv.N8N_SUBMIT_WAITLIST_WEBHOOK_URL);
    restoreEnvValue('N8N_WEBHOOK_SECRET', originalEnv.N8N_WEBHOOK_SECRET);
    restoreEnvValue('N8N_WEBHOOK_TIMEOUT_MS', originalEnv.N8N_WEBHOOK_TIMEOUT_MS);
}

function buildRequest(
    body: Record<string, unknown> | string,
    init?: { headers?: Record<string, string>; method?: string },
): Request {
    const ipSuffix = Math.floor(Math.random() * 200) + 1;
    const method = init?.method || 'POST';

    return new Request('http://localhost/api/submit-waitlist', {
        method,
        headers: {
            'Content-Type': 'application/json',
            'x-real-ip': `127.0.0.${ipSuffix}`,
            ...init?.headers,
        },
        body: method === 'OPTIONS'
            ? undefined
            : typeof body === 'string'
                ? body
                : JSON.stringify(body),
    });
}

function getUrl(input: RequestInfo | URL): string {
    if (typeof input === 'string') return input;
    if (input instanceof URL) return input.toString();
    return input.url;
}

interface MockN8nRequest {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: Record<string, unknown>;
}

function buildMockN8nRequest(input: RequestInfo | URL, init?: RequestInit): MockN8nRequest {
    const headers = new Headers(init?.headers);

    return {
        url: getUrl(input),
        method: init?.method || 'GET',
        headers: Object.fromEntries(headers.entries()),
        body: init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : undefined,
    };
}

function createMockN8nFetch(
    calls: MockN8nRequest[],
    response: Response | ((request: MockN8nRequest) => Response | Promise<Response>),
): typeof fetch {
    return (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const request = buildMockN8nRequest(input, init);
        calls.push(request);

        if (typeof response === 'function') {
            return await response(request);
        }

        return response;
    }) as typeof fetch;
}

function buildDirtyWaitlistPayload() {
    return {
        name: '  Ana <Maria>  ',
        email: '  ANA@example.com  ',
        sourcePage: ' /lollapalooza?slot=<hero> ',
        utms: {
            utm_source: ' google ',
            utm_medium: ' cpc ',
            utm_campaign: ' lolla <2027> ',
            utm_term: '   ',
            utm_content: ' hero ad ',
        },
        tracking: {
            fbclid: ' fbclid-123 ',
            extras: {
                ref: ' hero <cta> ',
                campaign_note: ' hurry > now ',
            },
            custom_source: ' direct ',
        },
    };
}

test('submit-waitlist should return SERVER_CONFIG_ERROR before parsing malformed JSON when config is missing', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    delete process.env.N8N_SUBMIT_WAITLIST_WEBHOOK_URL;
    delete process.env.N8N_WEBHOOK_SECRET;

    let fetchCalled = false;
    global.fetch = (async () => {
        fetchCalled = true;
        throw new Error('fetch should not run when config is missing');
    }) as typeof fetch;

    const response = await handler(buildRequest('{"name":"broken"', { method: 'POST' }));
    const payload = await response.json() as { ok: boolean; code?: string; error?: string };

    assert.equal(fetchCalled, false);
    assert.equal(response.status, 500);
    assert.equal(payload.ok, false);
    assert.equal(payload.code, 'SERVER_CONFIG_ERROR');
    assert.equal(payload.error, 'Integração de waitlist indisponível no momento.');
});

test('submit-waitlist should deliver a sanitized payload to n8n and return a neutral success response', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.N8N_SUBMIT_WAITLIST_WEBHOOK_URL = 'https://n8n.example/webhook/waitlist';
    process.env.N8N_WEBHOOK_SECRET = 'secret-456';
    process.env.N8N_WEBHOOK_TIMEOUT_MS = '200';

    const calls: MockN8nRequest[] = [];
    global.fetch = createMockN8nFetch(calls, new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const response = await handler(buildRequest(buildDirtyWaitlistPayload(), {
        headers: {
            'x-real-ip': '127.0.0.41',
        },
    }));

    assert.equal(response.status, 201);

    const payload = await response.json() as { ok: boolean; requestId?: string; message?: string; contactId?: string };
    assert.equal(payload.ok, true);
    assert.equal(payload.message, 'Enviado com sucesso');
    assert.equal(payload.contactId, undefined);
    assert.ok(payload.requestId);

    assert.equal(calls.length, 1);
    const request = calls[0]!;
    assert.equal(request.url, 'https://n8n.example/webhook/waitlist');
    assert.equal(request.method, 'POST');

    const headers = new Headers(request.headers);
    assert.equal(headers.get('Content-Type'), 'application/json');
    assert.equal(headers.get('X-Webhook-Secret'), 'secret-456');
    assert.equal(headers.get('X-Request-Id'), payload.requestId);

    const body = request.body as {
        requestId: string;
        source: string;
        waitlist: { name: string; email: string; sourcePage: string };
        utms: Record<string, unknown>;
        tracking: Record<string, unknown>;
        meta: { receivedAt: string };
    };

    assert.equal(body.requestId, payload.requestId);
    assert.equal(body.source, 'submit-waitlist');
    assert.deepEqual(body.waitlist, {
        name: 'Ana &lt;Maria&gt;',
        email: 'ana@example.com',
        sourcePage: '/lollapalooza?slot=&lt;hero&gt;',
    });
    assert.deepEqual(body.utms, {
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'lolla &lt;2027&gt;',
        utm_term: null,
        utm_content: 'hero ad',
    });
    assert.deepEqual(body.tracking, {
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'lolla &lt;2027&gt;',
        utm_term: null,
        utm_content: 'hero ad',
        cid: null,
        sid: null,
        gclid: null,
        fbclid: 'fbclid-123',
        msclkid: null,
        ttclid: null,
        wbraid: null,
        gbraid: null,
        fbc: null,
        fbp: null,
        extras: {
            ref: 'hero &lt;cta&gt;',
            campaign_note: 'hurry &gt; now',
            custom_source: 'direct',
        },
    });
    assert.match(body.meta.receivedAt, /^\d{4}-\d{2}-\d{2}T/);
});

test('submit-waitlist should return VALIDATION_ERROR without consuming rate-limit quota', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.N8N_SUBMIT_WAITLIST_WEBHOOK_URL = 'https://n8n.example/webhook/waitlist';
    process.env.N8N_WEBHOOK_SECRET = 'secret-456';

    const calls: MockN8nRequest[] = [];
    global.fetch = createMockN8nFetch(calls, new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const sharedIP = '127.0.0.142';
    const buildSharedRequest = (body: Record<string, unknown>) => buildRequest(body, {
        headers: {
            'x-real-ip': sharedIP,
        },
    });

    const invalidResponse = await handler(buildSharedRequest({
        name: 'Ana Maria',
        email: 'not-an-email',
        sourcePage: '/lollapalooza',
        utms: {},
        tracking: {},
    }));
    const invalidPayload = await invalidResponse.json() as { ok: boolean; code?: string };

    assert.equal(invalidResponse.status, 400);
    assert.equal(invalidPayload.ok, false);
    assert.equal(invalidPayload.code, 'VALIDATION_ERROR');
    assert.equal(calls.length, 0);

    const validBody = buildDirtyWaitlistPayload();
    for (let i = 0; i < 5; i++) {
        const response = await handler(buildSharedRequest(validBody));
        assert.equal(response.status, 201);
    }

    assert.equal(calls.length, 5);
});

test('submit-waitlist should map webhook failures to N8N_WEBHOOK_ERROR', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.N8N_SUBMIT_WAITLIST_WEBHOOK_URL = 'https://n8n.example/webhook/waitlist';
    process.env.N8N_WEBHOOK_SECRET = 'secret-456';
    process.env.N8N_WEBHOOK_TIMEOUT_MS = '200';

    global.fetch = (async () => new Response(JSON.stringify({ error: 'upstream failed' }), { status: 503 })) as typeof fetch;

    const response = await handler(buildRequest(buildDirtyWaitlistPayload(), {
        headers: {
            'x-real-ip': '127.0.0.43',
        },
    }));
    const payload = await response.json() as { ok: boolean; code?: string; error?: string };

    assert.equal(response.status, 502);
    assert.equal(payload.ok, false);
    assert.equal(payload.code, 'N8N_WEBHOOK_ERROR');
    assert.equal(payload.error, 'Erro ao enviar inscrição na lista de espera.');
});

test('classifySubmitWaitlistError should preserve unexpected internal failures', () => {
    const classified = classifySubmitWaitlistError(new Error('unexpected database failure'));

    assert.equal(classified.code, 'INTERNAL_ERROR');
    assert.equal(classified.status, 500);
    assert.equal(classified.error, 'Erro interno ao processar envio da lista de espera.');
});

test('classifySubmitWaitlistError should preserve sanitized webhook detail for internal handling', () => {
    const classified = classifySubmitWaitlistError(new Error('N8N_WEBHOOK_ERROR:503: upstream failed\nwith extra detail '));

    assert.equal(classified.code, 'N8N_WEBHOOK_ERROR');
    assert.equal(classified.status, 502);
    assert.equal(classified.error, 'Erro ao enviar inscrição na lista de espera.');
    assert.equal(classified.detail, 'upstream failed with extra detail');
});
