import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { classifySubmitWaitlistError } from '../api/submit-waitlist.ts';
import { createOdooMock, setOdooEnv, clearOdooEnv } from './odoo-mock.ts';

const originalFetch = global.fetch;

function restore() {
    global.fetch = originalFetch;
    clearOdooEnv();
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
        body: method === 'OPTIONS' ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    });
}

function buildDirtyWaitlistPayload() {
    return {
        name: '  Ana <Maria>  ',
        email: '  ANA@example.com  ',
        sourcePage: ' /lollapalooza?slot=<hero> ',
        emailOptIn: true,
        utms: { utm_source: ' google ', utm_medium: ' organic ' },
        tracking: { fbclid: ' fbclid-123 ' },
    };
}

test('submit-waitlist returns SERVER_CONFIG_ERROR before parsing when Odoo config is missing', async (t) => {
    t.after(restore);
    clearOdooEnv();

    let fetchCalled = false;
    global.fetch = (async () => { fetchCalled = true; throw new Error('should not run'); }) as typeof fetch;

    const response = await handler(buildRequest('{"name":"broken"', { method: 'POST' }));
    const payload = await response.json() as { ok: boolean; code?: string; error?: string };

    assert.equal(fetchCalled, false);
    assert.equal(response.status, 500);
    assert.equal(payload.code, 'SERVER_CONFIG_ERROR');
    assert.equal(payload.error, 'Integração de waitlist indisponível no momento.');
});

test('submit-waitlist upserts a sanitized res.partner and creates NO crm.lead', async (t) => {
    t.after(restore);
    setOdooEnv();
    const mock = createOdooMock();
    global.fetch = mock.fetch;

    const response = await handler(buildRequest(buildDirtyWaitlistPayload(), { headers: { 'x-real-ip': '127.0.0.41' } }));
    assert.equal(response.status, 201);

    const payload = await response.json() as { ok: boolean; message?: string };
    assert.equal(payload.ok, true);
    assert.equal(payload.message, 'Enviado com sucesso');

    assert.equal(mock.createdLead(), false, 'waitlist is ToFu — no opportunity');
    const partner = mock.partnerFields()!;
    assert.equal(partner.name, 'Ana &lt;Maria&gt;');
    assert.equal(partner.email, 'ana@example.com');
    // The checkbox copy is a marketing opt-in → x_lgpd_consent.
    assert.equal(partner.x_lgpd_consent, true);
});

test('submit-waitlist enforces rate-limit even for invalid payloads', async (t) => {
    t.after(restore);
    setOdooEnv();
    global.fetch = createOdooMock().fetch;

    const sharedIP = '127.0.0.145';
    const req = (body: Record<string, unknown>) => buildRequest(body, { headers: { 'x-real-ip': sharedIP } });

    for (let i = 0; i < 5; i++) {
        const response = await handler(req({ name: 'Ana Maria', email: 'not-an-email', sourcePage: '/lollapalooza', utms: {}, tracking: {} }));
        assert.equal(response.status, 400);
    }

    const limited = await handler(req(buildDirtyWaitlistPayload()));
    assert.equal(limited.status, 429);
});

test('submit-waitlist maps Odoo failures to ODOO_ERROR', async (t) => {
    t.after(restore);
    setOdooEnv();
    global.fetch = createOdooMock({ failStatus: 503 }).fetch;

    const response = await handler(buildRequest(buildDirtyWaitlistPayload(), { headers: { 'x-real-ip': '127.0.0.43' } }));
    const payload = await response.json() as { ok: boolean; code?: string; error?: string };

    assert.equal(response.status, 503);
    assert.equal(payload.code, 'ODOO_ERROR');
    assert.equal(payload.error, 'Erro ao enviar inscrição na lista de espera.');
});

test('classifySubmitWaitlistError preserves unexpected internal failures', () => {
    const classified = classifySubmitWaitlistError(new Error('unexpected database failure'));
    assert.equal(classified.code, 'INTERNAL_ERROR');
    assert.equal(classified.status, 500);
    assert.equal(classified.error, 'Erro interno ao processar envio da lista de espera.');
});

test('classifySubmitWaitlistError preserves sanitized Odoo detail', () => {
    const classified = classifySubmitWaitlistError(new Error('ODOO_ERROR:503: upstream failed\nwith extra detail '));
    assert.equal(classified.code, 'ODOO_ERROR');
    assert.equal(classified.status, 503);
    assert.equal(classified.error, 'Erro ao enviar inscrição na lista de espera.');
    assert.equal(classified.detail, 'upstream failed with extra detail');
});
