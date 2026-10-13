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

const ADS_SUBJECT = 'anon:33333333-3333-4333-8333-333333333333';
const ADS_EVENT = 'ads_submit_contact_fixture';

async function withAdsReceipt<T extends Record<string, unknown>>(body: T) {
    const { getConsentStore } = await import('../lib/consent-store.ts');
    const { ADS_NOTICE_VERSION } = await import('../lib/consent-notices.ts');
    await getConsentStore().append({
        id: ADS_EVENT,
        subjectKey: ADS_SUBJECT,
        purpose: 'ads_measurement',
        action: 'grant',
        noticeVersion: ADS_NOTICE_VERSION,
        origin: 'cookie_banner',
        occurredAt: '2026-10-13T12:00:00.000Z',
    });
    return { ...body, attributionConsent: { eventId: ADS_EVENT, subjectKey: ADS_SUBJECT } };
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

    const res = await handler(buildRequest(validBody({
        source: 'header',
        destination: 'Orlando',
        email: 'maria-contato@example.com',
        emailOptIn: true,
    })));
    assert.equal(res.status, 200);

    assert.ok(mock.createdLead());
    const partner = mock.partnerFields()!;
    assert.equal(partner.name, 'Maria');
    assert.equal(partner.x_lgpd_consent, true);

    const lead = mock.leadFields()!;
    assert.equal(lead.contact_name, 'Maria');
    assert.match(String(lead.name), /Orlando/);
});

test('writes children ages and trip days to the crm.lead description, sanitized and capped', async () => {
    setOdooEnv();
    const mock = createOdooMock();
    global.fetch = mock.fetch;

    const res = await handler(buildRequest(validBody({
        destination: 'Parques do Brasil · Beach Park',
        childrenAges: '<b>4</b> e 9',
        tripDays: 'x'.repeat(200),
    })));
    assert.equal(res.status, 200);

    const lead = mock.leadFields()!;
    assert.equal(lead.x_destino, 'Parques do Brasil · Beach Park');
    const description = String(lead.description);
    assert.match(description, /<li>Idade das crianças: &lt;b&gt;4&lt;\/b&gt; e 9<\/li>/);
    assert.match(description, new RegExp(`<li>Dias disponíveis: x{60}</li>`));
});

test('omits trip detail lines when they are blank', async () => {
    setOdooEnv();
    const mock = createOdooMock();
    global.fetch = mock.fetch;

    const res = await handler(buildRequest(validBody({ childrenAges: '   ', tripDays: 42 })));
    assert.equal(res.status, 200);

    const description = String(mock.leadFields()!.description ?? '');
    assert.doesNotMatch(description, /Idade das crianças|Dias disponíveis/);
});

test('sets campaign_id on the crm.lead when utm_campaign is present', async () => {
    setOdooEnv();
    const mock = createOdooMock({ existingCampaignId: 9 });
    global.fetch = mock.fetch;

    const res = await handler(buildRequest(await withAdsReceipt(validBody({
        utms: { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'verao2026' },
    }))));
    assert.equal(res.status, 200);

    const lead = mock.leadFields()!;
    assert.equal(lead.campaign_id, 9);
});

test('still creates the lead when campaign resolution fails (non-essential enrichment)', async () => {
    setOdooEnv();
    const mock = createOdooMock({ existingCampaignId: null, campaignCreateShouldFail: true });
    global.fetch = mock.fetch;

    const res = await handler(buildRequest(await withAdsReceipt(validBody({
        utms: { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'verao2026' },
    }))));
    assert.equal(res.status, 200);

    assert.ok(mock.createdLead(), 'the lead must still be created despite the campaign_id failure');
    const lead = mock.leadFields()!;
    assert.equal('campaign_id' in lead, false);
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
