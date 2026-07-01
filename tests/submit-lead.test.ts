import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { classifySubmitLeadError } from '../api/submit-lead.ts';
import { validatePayload } from '../lib/lead-logic.ts';
import { createOdooMock, setOdooEnv, clearOdooEnv } from './odoo-mock.ts';

const originalFetch = global.fetch;

function restore() {
    global.fetch = originalFetch;
    clearOdooEnv();
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

function buildLeadPayloadFixture() {
    return {
        firstName: 'Felipe',
        lastName: 'William',
        email: 'felipe@example.com',
        whatsapp: '+5511988314487',
        event_id: 'lead_test_123abc',
        bantSummary: 'Need: Praia | Authority: casal | Budget: 20k | Timeline: setembro',
        destination: 'Rio de Janeiro',
        marketingOptIn: true,
        utms: { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'rio', utm_term: 'rio viagem', utm_content: 'ad-1' },
        tracking: { gclid: 'gclid-1', fbp: 'fb.1.1736366050.1234567890' },
    };
}

// --- validatePayload (lib/lead-logic) — unchanged by the Odoo cut-over --------

test('validatePayload should reject payloads with an invalid email format', () => {
    const result = validatePayload({
        firstName: 'Felipe', lastName: 'William', email: 'not-an-email', whatsapp: '+5511988314487',
        bantSummary: 'Need: Praia', destination: 'Rio de Janeiro', utms: {}, tracking: {},
    });
    assert.equal(result.valid, false);
    if (result.valid) return;
    assert.equal(result.error, 'Email inválido.');
});

test('validatePayload should reject payloads with fields that exceed maximum length', () => {
    const result = validatePayload({
        firstName: 'F'.repeat(101), lastName: 'William', email: 'felipe@example.com', whatsapp: '+5511988314487',
        bantSummary: 'Need: Praia', destination: 'Rio de Janeiro', utms: {}, tracking: {},
    });
    assert.equal(result.valid, false);
    if (result.valid) return;
    assert.equal(result.error, 'Entrada muito longa.');
});

test('validatePayload should reject payloads missing required text fields', () => {
    const result = validatePayload({
        firstName: 'Felipe', lastName: 'William', email: 'felipe@example.com', whatsapp: '+5511988314487',
        destination: 'Rio de Janeiro', utms: {}, tracking: {},
    });
    assert.equal(result.valid, false);
    if (result.valid) return;
    assert.equal(result.error, 'Campos obrigatórios ausentes.');
});

test('validatePayload should preserve fbp and extras as tracking fields', () => {
    const result = validatePayload({
        firstName: 'Felipe', lastName: 'William', email: 'felipe@example.com', whatsapp: '+5511988314487',
        bantSummary: 'Need: Praia', destination: 'Rio de Janeiro',
        utms: { utm_source: 'google' },
        tracking: { fbp: 'fb.1.1736366050.1234567890', custom_source: 'chatbot' },
    });
    assert.equal(result.valid, true);
    if (!result.valid) return;
    assert.equal(result.data.tracking?.fbp, 'fb.1.1736366050.1234567890');
    assert.deepEqual(result.data.tracking?.extras, { custom_source: 'chatbot' });
});

test('validatePayload should require whatsapp and normalize it to E.164 digits', () => {
    const result = validatePayload({
        firstName: 'Felipe', lastName: 'William', email: 'felipe@example.com', whatsapp: ' (11) 98831-4487 ',
        bantSummary: 'Need: Praia', destination: 'Rio de Janeiro', utms: {}, tracking: {},
    });
    assert.equal(result.valid, true);
    if (!result.valid) return;
    assert.equal(result.data.whatsapp, '+5511988314487');
});

test('validatePayload should map marketingOptIn from the request body', () => {
    const result = validatePayload({
        firstName: 'Felipe', lastName: 'William', email: 'felipe@example.com', whatsapp: '+5511988314487',
        bantSummary: 'Need: Praia', destination: 'Rio de Janeiro', marketingOptIn: true, utms: {}, tracking: {},
    });
    assert.equal(result.valid, true);
    if (!result.valid) return;
    assert.equal(result.data.marketingOptIn, true);
});

test('validatePayload should accept optional empresa/cargo as structured lead fields', () => {
    const result = validatePayload({
        firstName: 'Felipe', lastName: 'William', email: 'felipe@example.com', whatsapp: '+5511988314487',
        bantSummary: 'Lead corporativo', destination: 'Corporativo',
        empresa: '  Acme Viagens  ', cargo: '  Diretora de Pessoas  ',
        utms: {}, tracking: {},
    });
    assert.equal(result.valid, true);
    if (!result.valid) return;
    assert.equal(result.data.empresa, 'Acme Viagens');
    assert.equal(result.data.cargo, 'Diretora de Pessoas');
});

// --- handler integration (Odoo) ---------------------------------------------

test('submit-lead upserts a partner and creates a linked crm.lead opportunity', async (t) => {
    t.after(restore);
    setOdooEnv();
    const mock = createOdooMock({ newPartnerId: 101, leadId: 555 });
    global.fetch = mock.fetch;

    const response = await handler(buildRequest(buildLeadPayloadFixture()));
    assert.equal(response.status, 201);

    const payload = await response.json() as { ok: boolean; requestId: string; message: string };
    assert.deepEqual(payload, { ok: true, requestId: payload.requestId, message: 'Enviado com sucesso' });

    const partner = mock.partnerFields()!;
    assert.equal(partner.email, 'felipe@example.com');
    assert.equal(partner.x_lgpd_consent, true);

    const lead = mock.leadFields()!;
    assert.equal(lead.partner_id, 101);
    assert.equal(lead.type, 'opportunity');
    assert.equal(lead.email_from, 'felipe@example.com');
    assert.equal(lead.source_id, 17); // google + cpc → Google Ads
    assert.equal(lead.medium_id, 7);
    assert.match(String(lead.name), /^Lead Site — Felipe William \(Rio de Janeiro\)$/);
});

test('submit-lead maps corporate empresa/cargo to crm.lead partner_name/function', async (t) => {
    t.after(restore);
    setOdooEnv();
    const mock = createOdooMock({ newPartnerId: 101, leadId: 555 });
    global.fetch = mock.fetch;

    const response = await handler(buildRequest({
        ...buildLeadPayloadFixture(),
        destination: 'Corporativo',
        empresa: 'Acme Viagens',
        cargo: 'Diretora de Pessoas',
    }));
    assert.equal(response.status, 201);

    const lead = mock.leadFields()!;
    assert.equal(lead.partner_name, 'Acme Viagens');
    assert.equal(lead.function, 'Diretora de Pessoas');
});

test('submit-lead sends sanitized values into the Odoo records', async (t) => {
    t.after(restore);
    setOdooEnv();
    const mock = createOdooMock();
    global.fetch = mock.fetch;

    const response = await handler(buildRequest({
        firstName: "<script>alert('xss')</script>John",
        lastName: 'Doe >',
        email: 'john@example.com',
        whatsapp: ' (11) 98831-4487 ',
        bantSummary: 'Need: <img src=x onerror=alert(1)>',
        destination: 'Mars <script>',
        utms: { utm_source: 'google', utm_medium: 'cpc' },
        tracking: {},
    }));

    assert.equal(response.status, 201);
    const lead = mock.leadFields()!;
    assert.match(String(lead.contact_name), /&lt;script&gt;/);
    assert.match(String(lead.description), /&lt;img src=x onerror=alert\(1\)&gt;/);
    assert.doesNotMatch(String(lead.description), /<img src=x/);
});

test('submit-lead returns ODOO_ERROR when Odoo responds with a failure', async (t) => {
    t.after(restore);
    setOdooEnv();
    global.fetch = createOdooMock({ failStatus: 503 }).fetch;

    const response = await handler(buildRequest(buildLeadPayloadFixture()));
    const payload = await response.json() as { ok: boolean; code?: string; error?: string };

    assert.equal(response.status, 503);
    assert.equal(payload.code, 'ODOO_ERROR');
    assert.equal(payload.error, 'Erro ao enviar lead.');
});

test('submit-lead returns SERVER_CONFIG_ERROR when Odoo config is missing', async (t) => {
    t.after(restore);
    clearOdooEnv();

    let fetchCalled = false;
    global.fetch = (async () => { fetchCalled = true; throw new Error('should not be called'); }) as typeof fetch;

    const response = await handler(buildRequest(buildLeadPayloadFixture()));
    const payload = await response.json() as { ok: boolean; code?: string; error?: string };

    assert.equal(fetchCalled, false);
    assert.equal(response.status, 500);
    assert.equal(payload.code, 'SERVER_CONFIG_ERROR');
    assert.equal(payload.error, 'Integração de lead indisponível no momento.');
});

test('classifySubmitLeadError preserves unexpected internal failures', () => {
    const classified = classifySubmitLeadError(new Error('unexpected database failure'));
    assert.equal(classified.code, 'INTERNAL_ERROR');
    assert.equal(classified.status, 500);
    assert.equal(classified.error, 'Erro interno ao processar envio do lead.');
});

test('classifySubmitLeadError preserves sanitized Odoo detail', () => {
    const classified = classifySubmitLeadError(new Error('ODOO_ERROR:503: upstream failed\nwith extra detail '));
    assert.equal(classified.code, 'ODOO_ERROR');
    assert.equal(classified.status, 503);
    assert.equal(classified.error, 'Erro ao enviar lead.');
    assert.equal(classified.detail, 'upstream failed with extra detail');
});

test('submit-lead enforces rate limiting', async (t) => {
    t.after(restore);
    setOdooEnv();
    global.fetch = createOdooMock().fetch;

    const sharedIP = '9.8.7.6';
    const req = () => new Request('http://localhost/api/submit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-real-ip': sharedIP },
        body: JSON.stringify(buildLeadPayloadFixture()),
    });

    for (let i = 0; i < 5; i++) {
        const response = await handler(req());
        assert.equal(response.status, 201);
    }

    const response = await handler(req());
    assert.equal(response.status, 429);
    const payload = await response.json() as { code?: string };
    assert.equal(payload.code, 'RATE_LIMIT_EXCEEDED');
});
