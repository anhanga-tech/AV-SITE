import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/submit-lead.ts';
import { mapTrackingToContactProperties } from '../services/hubspot.ts';

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

test('mapTrackingToContactProperties should map msclkid to hs_microsoft_click_id', () => {
    const mapped = mapTrackingToContactProperties({
        utm_source: null,
        utm_medium: null,
        utm_campaign: null,
        utm_term: null,
        utm_content: null,
        cid: 'ga.123',
        msclkid: 'ms-abc',
        gclid: 'g-xyz',
        wbraid: 'w-123',
    });

    assert.equal(mapped.properties.ga_client_id, 'ga.123');
    assert.equal(mapped.properties.hs_microsoft_click_id, 'ms-abc');
    assert.equal(mapped.properties.hs_google_click_id, 'g-xyz');
    assert.equal(mapped.properties.wbraid, 'w-123');
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
        destination: 'Rio de Janeiro',
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
    assert.equal(contactProps.hs_microsoft_click_id, 'msclkid-1');

    const dealRequest = calls.find((call) => call.url.endsWith('/crm/v3/objects/deals'));
    assert.ok(dealRequest, 'deal creation request should exist');
    assert.equal(dealRequest!.body?.properties?.dealname, 'Lead chatbot - Felipe William - Rio de Janeiro');
});

test('submit-lead should sanitize XSS payloads in inputs', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.HUBSPOT_TOKEN = 'test-token';
    process.env.HUBSPOT_DEAL_PIPELINE_ID = 'pipeline-1';
    process.env.HUBSPOT_DEAL_STAGE_ID = 'stage-1';
    process.env.HUBSPOT_CONTACT_TRACKING_FALLBACK_PROPERTY = 'contact_tracking_fallback';

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
        if (url.includes('/associations/')) {
            return new Response(null, { status: 204 });
        }

        return new Response(JSON.stringify({}), { status: 200 });
    }) as typeof fetch;

    const response = await handler(buildRequest({
        firstName: "<script>alert('xss')</script>John",
        lastName: "Doe >",
        email: "john@example.com",
        bantSummary: "Need: <img src=x onerror=alert(1)>",
        destination: "Mars <script>",
        utms: {
            utm_source: "<svg onload=alert(1)>",
        },
        tracking: {
            extras: {
                "<p>custom</p>": "<b>value</b>"
            }
        }
    }));

    assert.equal(response.status, 201);

    const contactRequest = calls.find((call) => call.url.endsWith('/crm/v3/objects/contacts'));
    const contactProps = contactRequest!.body.properties;

    assert.equal(contactProps.firstname, "&lt;script&gt;alert('xss')&lt;/script&gt;John");
    assert.equal(contactProps.lastname, "Doe &gt;");
    assert.equal(contactProps.ultimo_utm_source, "&lt;svg onload=alert(1)&gt;");

    const dealRequest = calls.find((call) => call.url.endsWith('/crm/v3/objects/deals'));
    const dealProps = dealRequest!.body.properties;
    assert.ok(dealProps.dealname.includes("&lt;script&gt;"));
    const bantProperty = process.env.HUBSPOT_DEAL_BANT_PROPERTY || 'bant_summary';
    assert.equal(dealProps[bantProperty], "Need: &lt;img src=x onerror=alert(1)&gt;");

    // Check extras sanitization
    const extras = JSON.parse(contactProps.contact_tracking_fallback || "{}");
    assert.ok(extras["&lt;p&gt;custom&lt;/p&gt;"], "Key should be sanitized");
    assert.equal(extras["&lt;p&gt;custom&lt;/p&gt;"], "&lt;b&gt;value&lt;/b&gt;");
});

test('submit-lead should recover on duplicate contact and still create deal', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.HUBSPOT_TOKEN = 'test-token';
    process.env.HUBSPOT_DEAL_PIPELINE_ID = 'pipeline-1';
    process.env.HUBSPOT_DEAL_STAGE_ID = 'stage-1';
    process.env.HUBSPOT_DEAL_BANT_PROPERTY = 'bant_summary';

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
        destination: 'Paris',
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
        destination: 'Orlando',
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
