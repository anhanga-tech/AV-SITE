import test from 'node:test';
import assert from 'node:assert/strict';

const originalEnv = {
    N8N_SUBMIT_CONTACT_WEBHOOK_URL: process.env.N8N_SUBMIT_CONTACT_WEBHOOK_URL,
    N8N_WEBHOOK_SECRET: process.env.N8N_WEBHOOK_SECRET,
};

type CapturedContactBody = {
    source?: string;
    contact?: {
        firstName?: string;
        ctaSource?: string | null;
        destination?: string | null;
    };
};

function restoreEnvValue(key: string, value: string | undefined) {
    if (value === undefined) {
        delete process.env[key];
        return;
    }

    process.env[key] = value;
}

function restoreEnv() {
    restoreEnvValue('N8N_SUBMIT_CONTACT_WEBHOOK_URL', originalEnv.N8N_SUBMIT_CONTACT_WEBHOOK_URL);
    restoreEnvValue('N8N_WEBHOOK_SECRET', originalEnv.N8N_WEBHOOK_SECRET);
}

function buildRequest(
    body: Record<string, unknown>,
    opts?: { method?: string; ip?: string },
): Request {
    const ipSuffix = Math.floor(Math.random() * 200) + 1;
    const method = opts?.method ?? 'POST';
    return new Request('http://localhost/api/submit-contact', {
        method,
        headers: {
            'Content-Type': 'application/json',
            'x-real-ip': opts?.ip ?? `10.0.0.${ipSuffix}`,
        },
        body: method === 'POST' ? JSON.stringify(body) : undefined,
    });
}

function validBody(overrides?: Record<string, unknown>) {
    return {
        firstName: 'Maria',
        whatsapp: '+5511987654321',
        emailOptIn: false,
        utms: {
            utm_source: 'google',
            utm_medium: 'cpc',
            utm_campaign: null,
            utm_term: null,
            utm_content: null,
        },
        ...overrides,
    };
}

const originalFetch = global.fetch;

test.afterEach(() => {
    global.fetch = originalFetch;
    restoreEnv();
});

test('rejects non-POST requests with 405', async () => {
    const { default: handler } = await import('../api/submit-contact.ts');
    const req = buildRequest({}, { method: 'GET' });
    const res = await handler(req);
    assert.equal(res.status, 405);
    const json = await res.json();
    assert.equal(json.error, 'Método não permitido.');
});

test('returns 503 when N8N_SUBMIT_CONTACT_WEBHOOK_URL is missing', async () => {
    delete process.env.N8N_SUBMIT_CONTACT_WEBHOOK_URL;
    delete process.env.N8N_WEBHOOK_SECRET;
    const { default: handler } = await import('../api/submit-contact.ts');
    const req = buildRequest(validBody());
    const res = await handler(req);
    assert.equal(res.status, 503);
    const json = await res.json();
    assert.equal(json.code, 'SERVER_CONFIG_ERROR');
});

test('returns 400 when firstName is missing', async () => {
    process.env.N8N_SUBMIT_CONTACT_WEBHOOK_URL = 'https://n8n.example.com/hook';
    process.env.N8N_WEBHOOK_SECRET = 'secret';
    const { default: handler } = await import('../api/submit-contact.ts');
    const req = buildRequest(validBody({ firstName: '' }));
    const res = await handler(req);
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.code, 'VALIDATION_ERROR');
});

test('returns 400 when whatsapp is missing', async () => {
    process.env.N8N_SUBMIT_CONTACT_WEBHOOK_URL = 'https://n8n.example.com/hook';
    process.env.N8N_WEBHOOK_SECRET = 'secret';
    const { default: handler } = await import('../api/submit-contact.ts');
    const req = buildRequest(validBody({ whatsapp: '' }));
    const res = await handler(req);
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.code, 'VALIDATION_ERROR');
});

test('returns 200 and calls n8n webhook on valid request', async () => {
    process.env.N8N_SUBMIT_CONTACT_WEBHOOK_URL = 'https://n8n.example.com/hook';
    process.env.N8N_WEBHOOK_SECRET = 'secret';

    let capturedUrl = '';
    let capturedBody: CapturedContactBody = {};

    global.fetch = (async (input, init) => {
        capturedUrl = typeof input === 'string' ? input : (input as Request).url;
        capturedBody = JSON.parse((init?.body as string) ?? '{}') as CapturedContactBody;
        return new Response('{}', { status: 200 });
    }) as typeof fetch;

    const { default: handler } = await import('../api/submit-contact.ts');
    const req = buildRequest(validBody({ source: 'header', destination: 'Orlando' }));
    const res = await handler(req);

    assert.equal(res.status, 200);
    assert.equal(capturedUrl, 'https://n8n.example.com/hook');
    assert.equal(capturedBody.source, 'submit-contact');
    assert.equal(capturedBody.contact?.firstName, 'Maria');
    assert.equal(capturedBody.contact?.ctaSource, 'header');
    assert.equal(capturedBody.contact?.destination, 'Orlando');
});

test('returns 502 when n8n webhook fails', async () => {
    process.env.N8N_SUBMIT_CONTACT_WEBHOOK_URL = 'https://n8n.example.com/hook';
    process.env.N8N_WEBHOOK_SECRET = 'secret';
    global.fetch = (async () => new Response('error', { status: 500 })) as typeof fetch;

    const { default: handler } = await import('../api/submit-contact.ts');
    const req = buildRequest(validBody());
    const res = await handler(req);

    assert.equal(res.status, 502);
    const json = await res.json();
    assert.equal(json.code, 'N8N_WEBHOOK_ERROR');
});

test('returns 504 when n8n webhook times out upstream', async () => {
    process.env.N8N_SUBMIT_CONTACT_WEBHOOK_URL = 'https://n8n.example.com/hook';
    process.env.N8N_WEBHOOK_SECRET = 'secret';
    global.fetch = (async () => new Response('timeout', { status: 504 })) as typeof fetch;

    const { default: handler } = await import('../api/submit-contact.ts');
    const req = buildRequest(validBody());
    const res = await handler(req);

    assert.equal(res.status, 504);
    const json = await res.json();
    assert.equal(json.code, 'N8N_WEBHOOK_ERROR');
});
