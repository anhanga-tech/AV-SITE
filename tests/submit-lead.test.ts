import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import handler, { classifySubmitLeadError } from '../api/submit-lead.ts';
import { buildN8nLeadPayload } from '../lib/n8n-payloads.ts';
import { sendLeadToN8n } from '../services/n8n.ts';
import { validatePayload } from '../lib/lead-logic.ts';

const originalFetch = global.fetch;
const originalEnv = {
    SUBMIT_LEAD_RATE_LIMIT_TIMEOUT_MS: process.env.SUBMIT_LEAD_RATE_LIMIT_TIMEOUT_MS,
    META_PIXEL_ID: process.env.META_PIXEL_ID,
    META_ACCESS_TOKEN: process.env.META_ACCESS_TOKEN,
    GA4_MEASUREMENT_ID: process.env.GA4_MEASUREMENT_ID,
    GA4_API_SECRET: process.env.GA4_API_SECRET,
    N8N_SUBMIT_LEAD_WEBHOOK_URL: process.env.N8N_SUBMIT_LEAD_WEBHOOK_URL,
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
    restoreEnvValue('SUBMIT_LEAD_RATE_LIMIT_TIMEOUT_MS', originalEnv.SUBMIT_LEAD_RATE_LIMIT_TIMEOUT_MS);
    restoreEnvValue('META_PIXEL_ID', originalEnv.META_PIXEL_ID);
    restoreEnvValue('META_ACCESS_TOKEN', originalEnv.META_ACCESS_TOKEN);
    restoreEnvValue('GA4_MEASUREMENT_ID', originalEnv.GA4_MEASUREMENT_ID);
    restoreEnvValue('GA4_API_SECRET', originalEnv.GA4_API_SECRET);
    restoreEnvValue('N8N_SUBMIT_LEAD_WEBHOOK_URL', originalEnv.N8N_SUBMIT_LEAD_WEBHOOK_URL);
    restoreEnvValue('N8N_WEBHOOK_SECRET', originalEnv.N8N_WEBHOOK_SECRET);
    restoreEnvValue('N8N_WEBHOOK_TIMEOUT_MS', originalEnv.N8N_WEBHOOK_TIMEOUT_MS);
}

function buildRequest(body: Record<string, unknown>, init?: { headers?: Record<string, string>; method?: string }): Request {
    const ipSuffix = Math.floor(Math.random() * 200) + 1;
    const method = init?.method || 'POST';

    return new Request('http://localhost/api/submit-lead', {
        method,
        headers: {
            'Content-Type': 'application/json',
            'x-real-ip': `127.0.0.${ipSuffix}`,
            ...init?.headers,
        },
        body: method === 'OPTIONS' ? undefined : JSON.stringify(body),
    });
}

function getUrl(input: RequestInfo | URL): string {
    if (typeof input === 'string') return input;
    if (input instanceof URL) return input.toString();
    return input.url;
}

function hashNormalized(value: string): string {
    return createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

function buildLeadPayloadFixture() {
    return {
        firstName: 'Felipe',
        lastName: 'William',
        email: 'felipe@example.com',
        whatsapp: '+5511988314487',
        event_id: 'lead_test_123abc',
        bantSummary: 'Need: Praia | Authority: casal | Budget: 20k | Timeline: setembro',
        destination: 'Rio de Janeiro',
        utms: {
            utm_source: 'google',
            utm_medium: 'cpc',
            utm_campaign: 'rio',
            utm_term: 'rio viagem',
            utm_content: 'ad-1',
        },
        tracking: {
            utm_source: 'google',
            utm_medium: 'cpc',
            utm_campaign: 'rio',
            utm_term: 'rio viagem',
            utm_content: 'ad-1',
            cid: 'cid-1',
            sid: 'sid-1',
            gclid: 'gclid-1',
            fbclid: 'fbclid-1',
            fbc: 'fb.1.1736366050.fbclid-1',
            msclkid: 'msclkid-1',
            ttclid: 'ttclid-1',
            wbraid: null,
            gbraid: 'gbraid-1',
            fbp: 'fb.1.1736366050.1234567890',
        },
    };
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

test('validatePayload should preserve fbp as a top-level tracking field', () => {
    const result = validatePayload({
        firstName: 'Felipe',
        lastName: 'William',
        email: 'felipe@example.com',
        whatsapp: '+5511988314487',
        bantSummary: 'Need: Praia | Authority: casal | Budget: 20k | Timeline: setembro',
        destination: 'Rio de Janeiro',
        utms: {
            utm_source: 'google',
            utm_medium: 'cpc',
            utm_campaign: 'rio',
            utm_term: 'rio viagem',
            utm_content: 'ad-1',
        },
        tracking: {
            fbp: 'fb.1.1736366050.1234567890',
            custom_source: 'chatbot',
        },
    });

    assert.equal(result.valid, true);
    if (!result.valid) return;

    assert.equal(result.data.tracking?.fbp, 'fb.1.1736366050.1234567890');
    assert.deepEqual(result.data.tracking?.extras, {
        custom_source: 'chatbot',
    });
});

test('validatePayload should preserve sanitized event_id when provided', () => {
    const result = validatePayload({
        firstName: 'Felipe',
        lastName: 'William',
        email: 'felipe@example.com',
        whatsapp: '+5511988314487',
        event_id: ' lead_<meta>&capi ',
        bantSummary: 'Need: Praia | Authority: casal | Budget: 20k | Timeline: setembro',
        destination: 'Rio de Janeiro',
        utms: {},
        tracking: {},
    });

    assert.equal(result.valid, true);
    if (!result.valid) return;

    assert.equal(result.data.event_id, 'lead_&lt;meta&gt;&capi');
});

test('validatePayload should require whatsapp and normalize it to E.164 digits', () => {
    const result = validatePayload({
        firstName: 'Felipe',
        lastName: 'William',
        email: 'felipe@example.com',
        whatsapp: ' (11) 98831-4487 ',
        bantSummary: 'Need: Praia | Authority: casal | Budget: 20k | Timeline: setembro',
        destination: 'Rio de Janeiro',
        utms: {},
        tracking: {},
    });

    assert.equal(result.valid, true);
    if (!result.valid) return;

    assert.equal(result.data.whatsapp, '+5511988314487');
});

test('validatePayload should reject payloads without whatsapp', () => {
    const result = validatePayload({
        firstName: 'Felipe',
        lastName: 'William',
        email: 'felipe@example.com',
        bantSummary: 'Need: Praia | Authority: casal | Budget: 20k | Timeline: setembro',
        destination: 'Rio de Janeiro',
        utms: {},
        tracking: {},
    });

    assert.equal(result.valid, false);
    if (result.valid) return;

    assert.equal(result.error, 'Campos obrigatórios ausentes.');
});

test('buildN8nLeadPayload should build the outbound webhook contract', () => {
    const payload = buildN8nLeadPayload({
        firstName: 'Felipe',
        lastName: 'William',
        email: 'felipe@example.com',
        whatsapp: '+5511988314487',
        bantSummary: 'Need: Praia | Authority: casal | Budget: 20k | Timeline: setembro',
        destination: 'Rio de Janeiro',
        utms: {
            utm_source: 'google',
            utm_medium: 'cpc',
            utm_campaign: 'rio',
            utm_term: 'rio viagem',
            utm_content: 'ad-1',
        },
        tracking: {
            utm_source: 'google',
            utm_medium: 'cpc',
            utm_campaign: 'rio',
            utm_term: 'rio viagem',
            utm_content: 'ad-1',
            cid: 'cid-1',
            sid: 'sid-1',
            gclid: 'gclid-1',
            fbclid: 'fbclid-1',
            fbc: 'fb.1.1736366050.fbclid-1',
            msclkid: 'msclkid-1',
            ttclid: 'ttclid-1',
            wbraid: null,
            gbraid: 'gbraid-1',
            fbp: 'fb.1.1736366050.1234567890',
        },
    }, 'req-lead-123');

    assert.deepEqual(payload, {
        requestId: 'req-lead-123',
        source: 'submit-lead',
        lead: {
            firstName: 'Felipe',
            lastName: 'William',
            email: 'felipe@example.com',
            whatsapp: '+5511988314487',
            eventId: null,
            bantSummary: 'Need: Praia | Authority: casal | Budget: 20k | Timeline: setembro',
            destination: 'Rio de Janeiro',
        },
        utms: {
            utm_source: 'google',
            utm_medium: 'cpc',
            utm_campaign: 'rio',
            utm_term: 'rio viagem',
            utm_content: 'ad-1',
        },
        tracking: {
            utm_source: 'google',
            utm_medium: 'cpc',
            utm_campaign: 'rio',
            utm_term: 'rio viagem',
            utm_content: 'ad-1',
            cid: 'cid-1',
            sid: 'sid-1',
            gclid: 'gclid-1',
            fbclid: 'fbclid-1',
            fbc: 'fb.1.1736366050.fbclid-1',
            msclkid: 'msclkid-1',
            ttclid: 'ttclid-1',
            wbraid: null,
            gbraid: 'gbraid-1',
            fbp: 'fb.1.1736366050.1234567890',
            extras: {},
        },
        meta: {
            receivedAt: payload.meta.receivedAt,
        },
    });

    assert.match(payload.meta.receivedAt, /^\d{4}-\d{2}-\d{2}T/);
});

test('sendLeadToN8n should send request metadata and webhook auth headers', async (t) => {
    const originalTimeout = process.env.N8N_WEBHOOK_TIMEOUT_MS;

    t.after(() => {
        global.fetch = originalFetch;
        if (originalTimeout === undefined) {
            delete process.env.N8N_WEBHOOK_TIMEOUT_MS;
        } else {
            process.env.N8N_WEBHOOK_TIMEOUT_MS = originalTimeout;
        }
    });

    process.env.N8N_WEBHOOK_TIMEOUT_MS = '200';

    const calls: MockN8nRequest[] = [];
    global.fetch = createMockN8nFetch(calls, new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const body = buildLeadPayloadFixture();
    await sendLeadToN8n(
        'https://n8n.example/webhook/submit-lead',
        'secret-123',
        'req-lead-456',
        buildN8nLeadPayload(body, 'req-lead-456'),
    );

    assert.equal(calls.length, 1);
    const request = calls[0]!;
    assert.equal(request.url, 'https://n8n.example/webhook/submit-lead');
    assert.equal(request.method, 'POST');
    assert.equal(request.headers['content-type'], 'application/json');
    assert.equal(request.headers['x-webhook-secret'], 'secret-123');
    assert.equal(request.headers['x-request-id'], 'req-lead-456');

    assert.equal(request.body?.requestId, 'req-lead-456');
    assert.equal(request.body?.source, 'submit-lead');
    assert.deepEqual(request.body?.lead, {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        whatsapp: body.whatsapp,
        eventId: body.event_id,
        bantSummary: body.bantSummary,
        destination: body.destination,
    });
    assert.deepEqual(request.body?.utms, body.utms);
    assert.deepEqual(request.body?.tracking, {
        utm_source: body.tracking.utm_source,
        utm_medium: body.tracking.utm_medium,
        utm_campaign: body.tracking.utm_campaign,
        utm_term: body.tracking.utm_term,
        utm_content: body.tracking.utm_content,
        cid: body.tracking.cid,
        sid: body.tracking.sid,
        gclid: body.tracking.gclid,
        fbclid: body.tracking.fbclid,
        msclkid: body.tracking.msclkid,
        ttclid: body.tracking.ttclid,
        wbraid: body.tracking.wbraid,
        gbraid: body.tracking.gbraid,
        fbc: body.tracking.fbc,
        fbp: body.tracking.fbp,
        extras: {},
    });
    assert.match(String((request.body?.meta as Record<string, unknown> | undefined)?.receivedAt), /^\d{4}-\d{2}-\d{2}T/);
});

test('submit-lead should send sanitized validated values to n8n', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.N8N_SUBMIT_LEAD_WEBHOOK_URL = 'https://n8n.example/webhook/submit-lead';
    process.env.N8N_WEBHOOK_SECRET = 'secret-123';
    process.env.N8N_WEBHOOK_TIMEOUT_MS = '200';
    delete process.env.META_PIXEL_ID;
    delete process.env.META_ACCESS_TOKEN;
    delete process.env.GA4_MEASUREMENT_ID;
    delete process.env.GA4_API_SECRET;

    const calls: MockN8nRequest[] = [];
    global.fetch = createMockN8nFetch(calls, new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const response = await handler(buildRequest({
        firstName: "<script>alert('xss')</script>John",
        lastName: "Doe >",
        email: 'john@example.com',
        whatsapp: ' (11) 98831-4487 ',
        event_id: ' lead_<meta>&capi ',
        bantSummary: 'Need: <img src=x onerror=alert(1)>',
        destination: 'Mars <script>',
        utms: {
            utm_source: '<svg onload=alert(1)>',
            utm_medium: null,
            utm_campaign: null,
            utm_term: null,
            utm_content: null,
        },
        tracking: {
            utm_source: '<svg onload=alert(1)>',
            utm_medium: null,
            utm_campaign: null,
            utm_term: null,
            utm_content: null,
            extras: {
                '<p>custom</p>': '<b>value</b>',
            },
        },
    }));

    assert.equal(response.status, 201);

    const request = calls[0]!;
    assert.deepEqual(request.body?.lead, {
        firstName: '&lt;script&gt;alert(\'xss\')&lt;/script&gt;John',
        lastName: 'Doe &gt;',
        email: 'john@example.com',
        whatsapp: '+5511988314487',
        eventId: 'lead_&lt;meta&gt;&capi',
        bantSummary: 'Need: &lt;img src=x onerror=alert(1)&gt;',
        destination: 'Mars &lt;script&gt;',
    });
    assert.deepEqual(request.body?.tracking, {
        utm_source: '&lt;svg onload=alert(1)&gt;',
        utm_medium: null,
        utm_campaign: null,
        utm_term: null,
        utm_content: null,
        cid: null,
        sid: null,
        gclid: null,
        fbclid: null,
        msclkid: null,
        ttclid: null,
        wbraid: null,
        gbraid: null,
        fbc: null,
        fbp: null,
        extras: {
            '&lt;p&gt;custom&lt;/p&gt;': '&lt;b&gt;value&lt;/b&gt;',
        },
    });
});

test('sendLeadToN8n should reject timed out webhook deliveries with a sanitized error', async (t) => {
    const originalTimeout = process.env.N8N_WEBHOOK_TIMEOUT_MS;

    t.after(() => {
        global.fetch = originalFetch;
        if (originalTimeout === undefined) {
            delete process.env.N8N_WEBHOOK_TIMEOUT_MS;
        } else {
            process.env.N8N_WEBHOOK_TIMEOUT_MS = originalTimeout;
        }
    });

    process.env.N8N_WEBHOOK_TIMEOUT_MS = '20';
    global.fetch = (async () => new Promise<Response>(() => {})) as typeof fetch;

    await assert.rejects(
        () => sendLeadToN8n(
            'https://n8n.example/webhook/submit-lead',
            'secret-123',
            'req-timeout',
            buildN8nLeadPayload(buildLeadPayloadFixture(), 'req-timeout'),
        ),
        (error: unknown) => error instanceof Error && error.message.startsWith('N8N_WEBHOOK_ERROR:504:'),
    );
});

test('sendLeadToN8n should normalize raw network failures into N8N_WEBHOOK_ERROR', async (t) => {
    const originalTimeout = process.env.N8N_WEBHOOK_TIMEOUT_MS;

    t.after(() => {
        global.fetch = originalFetch;
        if (originalTimeout === undefined) {
            delete process.env.N8N_WEBHOOK_TIMEOUT_MS;
        } else {
            process.env.N8N_WEBHOOK_TIMEOUT_MS = originalTimeout;
        }
    });

    process.env.N8N_WEBHOOK_TIMEOUT_MS = '200';
    global.fetch = (async () => {
        throw new TypeError('fetch failed');
    }) as typeof fetch;

    await assert.rejects(
        () => sendLeadToN8n(
            'https://n8n.example/webhook/submit-lead',
            'secret-123',
            'req-network-failure',
            buildN8nLeadPayload(buildLeadPayloadFixture(), 'req-network-failure'),
        ),
        (error: unknown) => error instanceof Error
            && error.message === 'N8N_WEBHOOK_ERROR:502:Webhook request failed',
    );
});

test('sendLeadToN8n should include a sanitized webhook response detail in provider errors', async (t) => {
    const originalTimeout = process.env.N8N_WEBHOOK_TIMEOUT_MS;

    t.after(() => {
        global.fetch = originalFetch;
        if (originalTimeout === undefined) {
            delete process.env.N8N_WEBHOOK_TIMEOUT_MS;
        } else {
            process.env.N8N_WEBHOOK_TIMEOUT_MS = originalTimeout;
        }
    });

    process.env.N8N_WEBHOOK_TIMEOUT_MS = '200';
    global.fetch = (async () => new Response(' upstream failed\nwith extra detail ', { status: 503 })) as typeof fetch;

    await assert.rejects(
        () => sendLeadToN8n(
            'https://n8n.example/webhook/submit-lead',
            'secret-123',
            'req-upstream-error',
            buildN8nLeadPayload(buildLeadPayloadFixture(), 'req-upstream-error'),
        ),
        (error: unknown) => error instanceof Error
            && error.message === 'N8N_WEBHOOK_ERROR:503:upstream failed with extra detail',
    );
});

test('submit-lead should deliver the validated payload to n8n and return a neutral success response', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.N8N_SUBMIT_LEAD_WEBHOOK_URL = 'https://n8n.example/webhook/submit-lead';
    process.env.N8N_WEBHOOK_SECRET = 'secret-123';
    process.env.N8N_WEBHOOK_TIMEOUT_MS = '200';
    delete process.env.META_PIXEL_ID;
    delete process.env.META_ACCESS_TOKEN;
    delete process.env.GA4_MEASUREMENT_ID;
    delete process.env.GA4_API_SECRET;

    const calls: MockN8nRequest[] = [];
    global.fetch = createMockN8nFetch(calls, new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const requestBody = buildLeadPayloadFixture();
    const response = await handler(buildRequest(requestBody));

    assert.equal(response.status, 201);

    const payload = await response.json() as {
        ok: boolean;
        requestId: string;
        message: string;
        contactId?: string;
        dealId?: string;
        warning?: string;
    };

    assert.deepEqual(payload, {
        ok: true,
        requestId: payload.requestId,
        message: 'Enviado com sucesso',
    });
    assert.equal('contactId' in payload, false);
    assert.equal('dealId' in payload, false);
    assert.equal('warning' in payload, false);

    assert.equal(calls.length, 1);
    const request = calls[0]!;
    assert.equal(request.url, 'https://n8n.example/webhook/submit-lead');
    assert.equal(request.method, 'POST');
    assert.equal(request.headers['content-type'], 'application/json');
    assert.equal(request.headers['x-webhook-secret'], 'secret-123');
    assert.equal(request.headers['x-request-id'], payload.requestId);
    assert.equal(request.body?.requestId, payload.requestId);
    assert.equal(request.body?.source, 'submit-lead');
    assert.deepEqual(request.body?.lead, {
        firstName: requestBody.firstName,
        lastName: requestBody.lastName,
        email: requestBody.email,
        whatsapp: requestBody.whatsapp,
        eventId: requestBody.event_id,
        bantSummary: requestBody.bantSummary,
        destination: requestBody.destination,
    });
    assert.deepEqual(request.body?.utms, requestBody.utms);
    assert.deepEqual(request.body?.tracking, {
        ...requestBody.tracking,
        extras: {},
    });
    assert.match(String((request.body?.meta as Record<string, unknown> | undefined)?.receivedAt), /^\d{4}-\d{2}-\d{2}T/);
});

test('submit-lead should return N8N_WEBHOOK_ERROR when the webhook responds with a failure', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.N8N_SUBMIT_LEAD_WEBHOOK_URL = 'https://n8n.example/webhook/submit-lead';
    process.env.N8N_WEBHOOK_SECRET = 'secret-123';

    global.fetch = (async () => new Response(JSON.stringify({ error: 'upstream failed' }), { status: 503 })) as typeof fetch;

    const response = await handler(buildRequest(buildLeadPayloadFixture()));
    const payload = await response.json() as { ok: boolean; code?: string; error?: string };

    assert.equal(response.status, 503);
    assert.equal(payload.ok, false);
    assert.equal(payload.code, 'N8N_WEBHOOK_ERROR');
    assert.equal(payload.error, 'Erro ao enviar lead.');
});

test('submit-lead should return SERVER_CONFIG_ERROR when n8n config is missing', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    delete process.env.N8N_SUBMIT_LEAD_WEBHOOK_URL;
    delete process.env.N8N_WEBHOOK_SECRET;

    let fetchCalled = false;
    global.fetch = (async () => {
        fetchCalled = true;
        throw new Error('fetch should not be called when config is missing');
    }) as typeof fetch;

    const response = await handler(buildRequest(buildLeadPayloadFixture()));
    const payload = await response.json() as { ok: boolean; code?: string; error?: string };

    assert.equal(fetchCalled, false);
    assert.equal(response.status, 500);
    assert.equal(payload.ok, false);
    assert.equal(payload.code, 'SERVER_CONFIG_ERROR');
    assert.equal(payload.error, 'Integração de lead indisponível no momento.');
});

test('submit-lead should return SERVER_CONFIG_ERROR before parsing malformed JSON when n8n config is missing', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    delete process.env.N8N_SUBMIT_LEAD_WEBHOOK_URL;
    delete process.env.N8N_WEBHOOK_SECRET;

    let fetchCalled = false;
    global.fetch = (async () => {
        fetchCalled = true;
        throw new Error('fetch should not be called when config is missing');
    }) as typeof fetch;

    const response = await handler(new Request('http://localhost/api/submit-lead', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-real-ip': '127.0.0.201',
        },
        body: '{"firstName": "Felipe",',
    }));

    const payload = await response.json() as { ok: boolean; code?: string; error?: string };

    assert.equal(fetchCalled, false);
    assert.equal(response.status, 500);
    assert.equal(payload.ok, false);
    assert.equal(payload.code, 'SERVER_CONFIG_ERROR');
    assert.equal(payload.error, 'Integração de lead indisponível no momento.');
});

test('classifySubmitLeadError should preserve unexpected internal failures', () => {
    const classified = classifySubmitLeadError(new Error('unexpected database failure'));

    assert.equal(classified.code, 'INTERNAL_ERROR');
    assert.equal(classified.status, 500);
    assert.equal(classified.error, 'Erro interno ao processar envio do lead.');
});

test('classifySubmitLeadError should preserve sanitized webhook detail for internal logging', () => {
    const classified = classifySubmitLeadError(new Error('N8N_WEBHOOK_ERROR:503: upstream failed\nwith extra detail '));

    assert.equal(classified.code, 'N8N_WEBHOOK_ERROR');
    assert.equal(classified.status, 503);
    assert.equal(classified.error, 'Erro ao enviar lead.');
    assert.equal(classified.detail, 'upstream failed with extra detail');
});

test('submit-lead should enforce rate limiting', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.N8N_SUBMIT_LEAD_WEBHOOK_URL = 'https://n8n.example/webhook/submit-lead';
    process.env.N8N_WEBHOOK_SECRET = 'secret-123';

    global.fetch = (async () => new Response(JSON.stringify({ ok: true }), { status: 200 })) as typeof fetch;

    const sharedIP = '9.8.7.6';
    const buildRateLimitedRequest = () => new Request('http://localhost/api/submit-lead', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-real-ip': sharedIP,
        },
        body: JSON.stringify(buildLeadPayloadFixture()),
    });

    for (let i = 0; i < 5; i++) {
        const response = await handler(buildRateLimitedRequest());
        assert.equal(response.status, 201);
    }

    const response = await handler(buildRateLimitedRequest());
    assert.equal(response.status, 429);

    const payload = await response.json() as { ok: boolean; code?: string };
    assert.equal(payload.ok, false);
    assert.equal(payload.code, 'RATE_LIMIT_EXCEEDED');
    assert.ok(response.headers.get('Retry-After'));
    assert.ok(response.headers.get('X-RateLimit-Reset'));
});

test('submit-lead should enforce rate-limit even for invalid payloads (DoS protection)', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.N8N_SUBMIT_LEAD_WEBHOOK_URL = 'https://n8n.example/webhook/submit-lead';
    process.env.N8N_WEBHOOK_SECRET = 'secret-123';
    process.env.N8N_WEBHOOK_TIMEOUT_MS = '200';
    delete process.env.META_PIXEL_ID;
    delete process.env.META_ACCESS_TOKEN;
    delete process.env.GA4_MEASUREMENT_ID;
    delete process.env.GA4_API_SECRET;

    const calls: MockN8nRequest[] = [];
    global.fetch = createMockN8nFetch(calls, new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const sharedIP = '127.0.0.212';
    const buildSharedRequest = (body: Record<string, unknown>) => new Request('http://localhost/api/submit-lead', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-real-ip': sharedIP,
        },
        body: JSON.stringify(body),
    });

    const validBody = buildLeadPayloadFixture();
    const invalidBody = {
        ...validBody,
        email: 'not-an-email',
    };

    // 5 invalid requests should consume the bucket (limit is 5)
    for (let i = 0; i < 5; i++) {
        const response = await handler(buildSharedRequest(invalidBody));
        assert.equal(response.status, 400);
    }

    // 6th request should be rate limited, even if it would be valid
    const limitResponse = await handler(buildSharedRequest(validBody));
    assert.equal(limitResponse.status, 429, 'should be rate limited after 5 invalid attempts');
});
