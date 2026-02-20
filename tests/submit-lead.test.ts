import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { mapTrackingToContactProperties } from '../api/submit-lead.ts';

const originalFetch = global.fetch;
const originalEnv = {
    HUBSPOT_TOKEN: process.env.HUBSPOT_TOKEN,
    HUBSPOT_DEAL_PIPELINE_ID: process.env.HUBSPOT_DEAL_PIPELINE_ID,
    HUBSPOT_DEAL_STAGE_ID: process.env.HUBSPOT_DEAL_STAGE_ID,
    HUBSPOT_DEAL_BANT_PROPERTY: process.env.HUBSPOT_DEAL_BANT_PROPERTY,
    HUBSPOT_CONTACT_TRACKING_FALLBACK_PROPERTY: process.env.HUBSPOT_CONTACT_TRACKING_FALLBACK_PROPERTY,
};

function restoreEnv() {
    process.env.HUBSPOT_TOKEN = originalEnv.HUBSPOT_TOKEN;
    process.env.HUBSPOT_DEAL_PIPELINE_ID = originalEnv.HUBSPOT_DEAL_PIPELINE_ID;
    process.env.HUBSPOT_DEAL_STAGE_ID = originalEnv.HUBSPOT_DEAL_STAGE_ID;
    process.env.HUBSPOT_DEAL_BANT_PROPERTY = originalEnv.HUBSPOT_DEAL_BANT_PROPERTY;
    process.env.HUBSPOT_CONTACT_TRACKING_FALLBACK_PROPERTY = originalEnv.HUBSPOT_CONTACT_TRACKING_FALLBACK_PROPERTY;
}

function buildRequest(body: Record<string, unknown>): Request {
    return new Request('http://localhost/api/submit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

function getUrl(input: RequestInfo | URL): string {
    if (typeof input === 'string') return input;
    if (input instanceof URL) return input.toString();
    return input.url;
}

test('mapTrackingToContactProperties should map msclkid to hs_linkedin_click_id', () => {
    const mapped = mapTrackingToContactProperties({
        utm_source: null,
        utm_medium: null,
        utm_campaign: null,
        utm_term: null,
        utm_content: null,
        cid: 'ga.123',
        msclkid: 'ms-abc',
        gclid: 'g-xyz',
    });

    assert.equal(mapped.properties.ga_client_id, 'ga.123');
    assert.equal(mapped.properties.hs_linkedin_click_id, 'ms-abc');
    assert.equal(mapped.properties.hs_google_click_id, 'g-xyz');
});

test('submit-lead should create contact and deal on first attempt', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.HUBSPOT_TOKEN = 'test-token';
    process.env.HUBSPOT_DEAL_PIPELINE_ID = 'pipeline-1';
    process.env.HUBSPOT_DEAL_STAGE_ID = 'stage-1';
    process.env.HUBSPOT_DEAL_BANT_PROPERTY = 'bant_summary';

    const calls: Array<{ url: string; method: string; body: any }> = [];

    global.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = getUrl(input);
        const method = init?.method || 'GET';
        const body = init?.body ? JSON.parse(String(init.body)) : undefined;
        calls.push({ url, method, body });

        if (url.endsWith('/crm/v3/objects/contacts') && method === 'POST') {
            return new Response(JSON.stringify({ id: 'contact-1' }), { status: 201 });
        }

        if (url.endsWith('/crm/v3/objects/deals') && method === 'POST') {
            return new Response(JSON.stringify({ id: 'deal-1' }), { status: 201 });
        }

        if (url.endsWith('/crm/v4/objects/deals/deal-1/associations/default/contacts/contact-1') && method === 'PUT') {
            return new Response(null, { status: 204 });
        }

        throw new Error(`Unexpected request: ${method} ${url}`);
    }) as typeof fetch;

    const response = await handler(buildRequest({
        firstName: 'Felipe',
        lastName: 'William',
        email: 'felipe@example.com',
        bantSummary: 'Need: Praia | Authority: casal | Budget: 20k | Timeline: setembro',
        utms: {
            utm_source: 'google',
            utm_medium: 'cpc',
            utm_campaign: 'rio',
            utm_term: 'rio viagem',
            utm_content: 'ad-1',
        },
        tracking: {
            cid: 'cid-1',
            sid: 'sid-1',
            gclid: 'gclid-1',
            fbclid: 'fbclid-1',
            msclkid: 'msclkid-1',
            ttclid: 'ttclid-1',
            gbraid: 'gbraid-1',
        },
    }));

    assert.equal(response.status, 201);
    const payload = await response.json();

    assert.equal(payload.ok, true);
    assert.equal(payload.contactId, 'contact-1');
    assert.equal(payload.dealId, 'deal-1');

    const contactRequest = calls.find((call) => call.url.endsWith('/crm/v3/objects/contacts'));
    assert.ok(contactRequest, 'contact creation request should exist');

    const contactProps = contactRequest!.body?.properties || {};
    assert.equal(contactProps.ga_client_id, 'cid-1');
    assert.equal(contactProps.ga_session_id, 'sid-1');
    assert.equal(contactProps.hs_google_click_id, 'gclid-1');
    assert.equal(contactProps.hs_facebook_click_id, 'fbclid-1');
    assert.equal(contactProps.hs_linkedin_click_id, 'msclkid-1');
});

test('submit-lead should recover on duplicate contact and still create deal', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.HUBSPOT_TOKEN = 'test-token';
    process.env.HUBSPOT_DEAL_PIPELINE_ID = 'pipeline-1';
    process.env.HUBSPOT_DEAL_STAGE_ID = 'stage-1';

    global.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = getUrl(input);
        const method = init?.method || 'GET';

        if (url.endsWith('/crm/v3/objects/contacts') && method === 'POST') {
            return new Response(JSON.stringify({ status: 'error' }), { status: 409 });
        }

        if (url.endsWith('/crm/v3/objects/contacts/search') && method === 'POST') {
            return new Response(JSON.stringify({ results: [{ id: 'contact-existing' }] }), { status: 200 });
        }

        if (url.endsWith('/crm/v3/objects/contacts/contact-existing') && method === 'PATCH') {
            return new Response(JSON.stringify({ id: 'contact-existing' }), { status: 200 });
        }

        if (url.endsWith('/crm/v3/objects/deals') && method === 'POST') {
            return new Response(JSON.stringify({ id: 'deal-2' }), { status: 201 });
        }

        if (url.endsWith('/crm/v4/objects/deals/deal-2/associations/default/contacts/contact-existing') && method === 'PUT') {
            return new Response(null, { status: 204 });
        }

        throw new Error(`Unexpected request: ${method} ${url}`);
    }) as typeof fetch;

    const response = await handler(buildRequest({
        firstName: 'Felipe',
        lastName: 'William',
        email: 'felipe@example.com',
        bantSummary: 'Need: Praia | Authority: casal | Budget: 20k | Timeline: setembro',
        utms: {},
        tracking: {
            cid: 'cid-2',
            utm_source: null,
            utm_medium: null,
            utm_campaign: null,
            utm_term: null,
            utm_content: null,
        },
    }));

    assert.equal(response.status, 201);
    const payload = await response.json();

    assert.equal(payload.ok, true);
    assert.equal(payload.contactId, 'contact-existing');
    assert.equal(payload.dealId, 'deal-2');
});

test('submit-lead should create fallback note and return warning when deal fails', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.HUBSPOT_TOKEN = 'test-token';
    process.env.HUBSPOT_DEAL_PIPELINE_ID = 'pipeline-1';
    process.env.HUBSPOT_DEAL_STAGE_ID = 'stage-1';

    global.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = getUrl(input);
        const method = init?.method || 'GET';

        if (url.endsWith('/crm/v3/objects/contacts') && method === 'POST') {
            return new Response(JSON.stringify({ id: 'contact-3' }), { status: 201 });
        }

        if (url.endsWith('/crm/v3/objects/deals') && method === 'POST') {
            return new Response(JSON.stringify({ status: 'error' }), { status: 500 });
        }

        if (url.endsWith('/crm/v3/objects/notes') && method === 'POST') {
            return new Response(JSON.stringify({ id: 'note-1' }), { status: 201 });
        }

        if (url.endsWith('/crm/v4/objects/notes/note-1/associations/default/contacts/contact-3') && method === 'PUT') {
            return new Response(null, { status: 204 });
        }

        throw new Error(`Unexpected request: ${method} ${url}`);
    }) as typeof fetch;

    const response = await handler(buildRequest({
        firstName: 'Felipe',
        lastName: 'William',
        email: 'felipe@example.com',
        bantSummary: 'Need: Praia | Authority: casal | Budget: 20k | Timeline: setembro',
        utms: {},
        tracking: {
            utm_source: null,
            utm_medium: null,
            utm_campaign: null,
            utm_term: null,
            utm_content: null,
        },
    }));

    assert.equal(response.status, 201);
    const payload = await response.json();

    assert.equal(payload.ok, true);
    assert.equal(payload.contactId, 'contact-3');
    assert.equal(payload.dealId, undefined);
    assert.match(payload.warning, /nota foi registrada/i);
});
