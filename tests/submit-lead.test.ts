import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { classifySubmitLeadError } from '../api/submit-lead.ts';
import { validatePayload } from '../lib/lead-logic.ts';
import { createOdooMock, setOdooEnv, clearOdooEnv } from './odoo-mock.ts';
import { HONEYPOT_FIELD, ELAPSED_TIME_FIELD } from '../lib/bot-detection.ts';

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

test('validatePayload should reject an oversized whatsapp before normalization', () => {
    // Guards the schema's whatsapp .max() bound: an unbounded phone string would
    // otherwise be regex-normalized in full before being rejected (DoS hardening).
    const result = validatePayload({
        firstName: 'Felipe', lastName: 'William', email: 'felipe@example.com',
        whatsapp: '+55' + '9'.repeat(4000),
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

test('validatePayload should reject tracking objects with an abusive number of keys', () => {
    const tracking: Record<string, string> = {};
    for (let i = 0; i < 200; i += 1) {
        tracking[`k_${i}`] = `v_${i}`;
    }

    const result = validatePayload({
        firstName: 'Felipe', lastName: 'William', email: 'felipe@example.com', whatsapp: '+5511988314487',
        bantSummary: 'Need: Praia', destination: 'Rio de Janeiro',
        utms: {}, tracking,
    });

    assert.equal(result.valid, false);
});

test('validatePayload should reject tracking whose nested extras has an abusive number of keys', () => {
    const extras: Record<string, string> = {};
    for (let i = 0; i < 200; i += 1) {
        extras[`k_${i}`] = `v_${i}`;
    }

    const result = validatePayload({
        firstName: 'Felipe', lastName: 'William', email: 'felipe@example.com', whatsapp: '+5511988314487',
        bantSummary: 'Need: Praia', destination: 'Rio de Janeiro',
        utms: {}, tracking: { extras },
    });

    assert.equal(result.valid, false);
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

test('validatePayload should accept optional referred as a structured referral field', () => {
    const result = validatePayload({
        firstName: 'Felipe', lastName: 'William', email: 'felipe@example.com', whatsapp: '+5511988314487',
        bantSummary: 'Lead indicado', destination: 'Orlando',
        referred: '  Maria <Silva>  ',
        utms: {}, tracking: {},
    });
    assert.equal(result.valid, true);
    if (!result.valid) return;
    assert.equal(result.data.referred, 'Maria &lt;Silva&gt;');
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

// --- Odoo round-trip concurrency --------------------------------------------

test('submit-lead resolves the utm.campaign concurrently with the partner upsert', async (t) => {
    t.after(restore);
    setOdooEnv();
    const mock = createOdooMock({ newPartnerId: 101, leadId: 555, newCampaignId: 900 });
    global.fetch = mock.fetch;

    const response = await handler(buildRequest(buildLeadPayloadFixture()));
    assert.equal(response.status, 201);

    const indexOfCall = (model: string, method: string) =>
        mock.calls.findIndex((c) => c.model === model && c.method === method);

    // The campaign lookup never reads partnerId, so it must already be in flight
    // by the time the partner dedup search resolves — i.e. it is dispatched
    // before the res.partner write lands, not queued behind it. Serializing the
    // two again would push this index after the partner create and fail here.
    const campaignSearch = indexOfCall('utm.campaign', 'search_read');
    const partnerCreate = indexOfCall('res.partner', 'create');
    assert.ok(campaignSearch >= 0, 'expected a utm.campaign lookup for utm_campaign=rio');
    assert.ok(partnerCreate >= 0, 'expected a res.partner create');
    assert.ok(
        campaignSearch < partnerCreate,
        'utm.campaign lookup must overlap the partner upsert, not queue behind it',
    );

    // Concurrency must not change the result the lead is built with.
    assert.equal(mock.leadFields()!.campaign_id, 900);
});

test('submit-lead still creates the lead when the utm.campaign resolve fails', async (t) => {
    t.after(restore);
    setOdooEnv();
    // Both the create and the two recovery searches miss → resolveCampaignId throws.
    const mock = createOdooMock({ newPartnerId: 101, leadId: 555, campaignCreateShouldFail: true });
    global.fetch = mock.fetch;

    const response = await handler(buildRequest(buildLeadPayloadFixture()));

    // Campaign resolution is enrichment: its failure must not cost the lead.
    assert.equal(response.status, 201);
    assert.equal(mock.createdLead(), true);
    assert.equal(mock.leadFields()!.campaign_id, undefined);
});

// --- idempotency (issue #1136) ----------------------------------------------

test('submit-lead — a retry with the same event_id does not create a second crm.lead opportunity', async (t) => {
    t.after(restore);
    setOdooEnv();
    const mock = createOdooMock({ newPartnerId: 101, leadId: 555 });
    global.fetch = mock.fetch;

    const payload = buildLeadPayloadFixture();
    const first = await handler(buildRequest(payload, { headers: { 'x-real-ip': '127.0.0.50' } }));
    assert.equal(first.status, 201);

    // Simulates the client retrying after never seeing the first response
    // (perceived timeout) — same event_id, same body.
    const second = await handler(buildRequest(payload, { headers: { 'x-real-ip': '127.0.0.50' } }));
    assert.equal(second.status, 201);

    const leadCreateCalls = mock.calls.filter((c) => c.model === 'crm.lead' && c.method === 'create');
    assert.equal(leadCreateCalls.length, 1, 'a retry with the same event_id must not create a duplicate opportunity');
});

// --- bot heuristics (honeypot + timing) -------------------------------------

test('submit-lead silently accepts a filled honeypot without touching Odoo', async (t) => {
    t.after(restore);
    setOdooEnv();
    const mock = createOdooMock({ newPartnerId: 101, leadId: 555 });
    global.fetch = mock.fetch;

    const response = await handler(buildRequest({
        ...buildLeadPayloadFixture(),
        [HONEYPOT_FIELD]: 'http://spam.example',
    }));

    // Mirrors the real success envelope so a bot cannot detect the drop...
    assert.equal(response.status, 201);
    const payload = await response.json() as { ok: boolean; message: string };
    assert.equal(payload.ok, true);
    assert.equal(payload.message, 'Enviado com sucesso');
    // ...but no partner/lead is ever written.
    assert.equal(mock.calls.length, 0);
});

test('submit-lead silently accepts an implausibly fast submit without touching Odoo', async (t) => {
    t.after(restore);
    setOdooEnv();
    const mock = createOdooMock({ newPartnerId: 101, leadId: 555 });
    global.fetch = mock.fetch;

    const response = await handler(buildRequest({
        ...buildLeadPayloadFixture(),
        [ELAPSED_TIME_FIELD]: 100, // 100ms → under the minimum window
    }));

    assert.equal(response.status, 201);
    const payload = await response.json() as { ok: boolean };
    assert.equal(payload.ok, true);
    assert.equal(mock.calls.length, 0);
});

test('submit-lead processes a normal, human-paced submit that carries anti-bot fields', async (t) => {
    t.after(restore);
    setOdooEnv();
    const mock = createOdooMock({ newPartnerId: 101, leadId: 555 });
    global.fetch = mock.fetch;

    const response = await handler(buildRequest({
        ...buildLeadPayloadFixture(),
        [HONEYPOT_FIELD]: '',
        [ELAPSED_TIME_FIELD]: 30_000, // 30s → clearly human
    }));

    assert.equal(response.status, 201);
    // The extra fields are stripped by the schema and the lead still persists.
    assert.equal(mock.partnerFields()!.email, 'felipe@example.com');
    assert.equal(mock.leadFields()!.partner_id, 101);
});

test('submit-lead maps referred leads to Indicação/indicacao in Odoo', async (t) => {
    t.after(restore);
    setOdooEnv();
    const mock = createOdooMock({ newPartnerId: 101, leadId: 555 });
    global.fetch = mock.fetch;

    const response = await handler(buildRequest({
        ...buildLeadPayloadFixture(),
        utms: {},
        tracking: {},
        referred: 'Maria Silva',
    }));
    assert.equal(response.status, 201);

    const lead = mock.leadFields()!;
    assert.equal(lead.source_id, 8);
    assert.equal(lead.medium_id, 6);
    assert.equal(lead.referred, 'Maria Silva');
    assert.match(String(lead.description), /<li>Indicado por: Maria Silva<\/li>/);
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
