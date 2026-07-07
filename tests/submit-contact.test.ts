import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/submit-contact.ts';
import { createOdooMock, setOdooEnv, clearOdooEnv } from './odoo-mock.ts';

const originalFetch = global.fetch;

test.afterEach(() => {
    global.fetch = originalFetch;
    clearOdooEnv();
});

function buildRequest(body: Record<string, unknown>, opts?: { method?: string; ip?: string }): Request {
    const ipSuffix = Math.floor(Math.random() * 200) + 1;
    const method = opts?.method ?? 'POST';
    return new Request('http://localhost/api/submit-contact', {
        method,
        headers: { 'Content-Type': 'application/json', 'x-real-ip': opts?.ip ?? `10.0.0.${ipSuffix}` },
        body: method === 'POST' ? JSON.stringify(body) : undefined,
    });
}

function validBody(overrides?: Record<string, unknown>) {
    return {
        firstName: 'Maria',
        whatsapp: '+5511987654321',
        emailOptIn: false,
        utms: { utm_source: 'google', utm_medium: 'cpc' },
        ...overrides,
    };
}

test('rejects non-POST requests with 405', async () => {
    const res = await handler(buildRequest({}, { method: 'GET' }));
    assert.equal(res.status, 405);
    assert.equal((await res.json()).error, 'Método não permitido.');
});

test('returns 503 when Odoo config is missing', async () => {
    clearOdooEnv();
    const res = await handler(buildRequest(validBody()));
    assert.equal(res.status, 503);
    assert.equal((await res.json()).code, 'SERVER_CONFIG_ERROR');
});

test('returns 400 when firstName is missing', async () => {
    setOdooEnv();
    const res = await handler(buildRequest(validBody({ firstName: '' })));
    assert.equal(res.status, 400);
    assert.equal((await res.json()).code, 'VALIDATION_ERROR');
});

test('returns 400 when whatsapp is missing', async () => {
    setOdooEnv();
    const res = await handler(buildRequest(validBody({ whatsapp: '' })));
    assert.equal(res.status, 400);
    assert.equal((await res.json()).code, 'VALIDATION_ERROR');
});

test('returns 200 and creates a partner + crm.lead on valid request', async () => {
    setOdooEnv();
    const mock = createOdooMock();
    global.fetch = mock.fetch;

    const res = await handler(buildRequest(validBody({ source: 'header', destination: 'Orlando', emailOptIn: true })));
    assert.equal(res.status, 200);

    assert.ok(mock.createdLead());
    const partner = mock.partnerFields()!;
    assert.equal(partner.name, 'Maria');
    assert.equal(partner.x_lgpd_consent, true);

    const lead = mock.leadFields()!;
    assert.equal(lead.contact_name, 'Maria');
    assert.match(String(lead.name), /Orlando/);
});

test('sets campaign_id on the crm.lead when utm_campaign is present', async () => {
    setOdooEnv();
    const mock = createOdooMock({ existingCampaignId: 9 });
    global.fetch = mock.fetch;

    const res = await handler(buildRequest(validBody({
        utms: { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'verao2026' },
    })));
    assert.equal(res.status, 200);

    const lead = mock.leadFields()!;
    assert.equal(lead.campaign_id, 9);
});

test('omits campaign_id when utm_campaign is absent', async () => {
    setOdooEnv();
    const mock = createOdooMock();
    global.fetch = mock.fetch;

    const res = await handler(buildRequest(validBody()));
    assert.equal(res.status, 200);

    const lead = mock.leadFields()!;
    assert.equal('campaign_id' in lead, false);
});

test('returns 502 when Odoo fails', async () => {
    setOdooEnv();
    global.fetch = createOdooMock({ failStatus: 500 }).fetch;
    const res = await handler(buildRequest(validBody()));
    assert.equal(res.status, 502);
    assert.equal((await res.json()).code, 'ODOO_ERROR');
});

test('returns 504 when Odoo times out upstream', async () => {
    setOdooEnv();
    global.fetch = createOdooMock({ failStatus: 504 }).fetch;
    const res = await handler(buildRequest(validBody()));
    assert.equal(res.status, 504);
    assert.equal((await res.json()).code, 'ODOO_ERROR');
});
