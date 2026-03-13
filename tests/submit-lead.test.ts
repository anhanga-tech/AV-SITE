import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import handler from '../api/submit-lead.ts';
import { mapTrackingToContactProperties } from '../services/hubspot.ts';
import { validatePayload } from '../lib/lead-logic.ts';

const originalFetch = global.fetch;
const originalEnv = {
    HUBSPOT_TOKEN: process.env.HUBSPOT_TOKEN,
    HUBSPOT_DEAL_PIPELINE_ID: process.env.HUBSPOT_DEAL_PIPELINE_ID,
    HUBSPOT_DEAL_STAGE_ID: process.env.HUBSPOT_DEAL_STAGE_ID,
    HUBSPOT_DEAL_BANT_PROPERTY: process.env.HUBSPOT_DEAL_BANT_PROPERTY,
    HUBSPOT_CONTACT_TRACKING_FALLBACK_PROPERTY: process.env.HUBSPOT_CONTACT_TRACKING_FALLBACK_PROPERTY,
    HUBSPOT_REQUEST_TIMEOUT_MS: process.env.HUBSPOT_REQUEST_TIMEOUT_MS,
    SUBMIT_LEAD_RATE_LIMIT_TIMEOUT_MS: process.env.SUBMIT_LEAD_RATE_LIMIT_TIMEOUT_MS,
    META_PIXEL_ID: process.env.META_PIXEL_ID,
    META_ACCESS_TOKEN: process.env.META_ACCESS_TOKEN,
};

function restoreEnvValue(key: string, value: string | undefined) {
    if (value === undefined) {
        delete process.env[key];
        return;
    }

    process.env[key] = value;
}

function restoreEnv() {
    restoreEnvValue('HUBSPOT_TOKEN', originalEnv.HUBSPOT_TOKEN);
    restoreEnvValue('HUBSPOT_DEAL_PIPELINE_ID', originalEnv.HUBSPOT_DEAL_PIPELINE_ID);
    restoreEnvValue('HUBSPOT_DEAL_STAGE_ID', originalEnv.HUBSPOT_DEAL_STAGE_ID);
    restoreEnvValue('HUBSPOT_DEAL_BANT_PROPERTY', originalEnv.HUBSPOT_DEAL_BANT_PROPERTY);
    restoreEnvValue('HUBSPOT_CONTACT_TRACKING_FALLBACK_PROPERTY', originalEnv.HUBSPOT_CONTACT_TRACKING_FALLBACK_PROPERTY);
    restoreEnvValue('HUBSPOT_REQUEST_TIMEOUT_MS', originalEnv.HUBSPOT_REQUEST_TIMEOUT_MS);
    restoreEnvValue('SUBMIT_LEAD_RATE_LIMIT_TIMEOUT_MS', originalEnv.SUBMIT_LEAD_RATE_LIMIT_TIMEOUT_MS);
    restoreEnvValue('META_PIXEL_ID', originalEnv.META_PIXEL_ID);
    restoreEnvValue('META_ACCESS_TOKEN', originalEnv.META_ACCESS_TOKEN);
}

function buildRequest(body: Record<string, unknown>): Request {
    const ipSuffix = Math.floor(Math.random() * 200) + 1;

    return new Request('http://localhost/api/submit-lead', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-real-ip': `127.0.0.${ipSuffix}`,
        },
        body: JSON.stringify(body),
    });
}

function getUrl(input: RequestInfo | URL): string {
    if (typeof input === 'string') return input;
    if (input instanceof URL) return input.toString();
    return input.url;
}

interface MockHubSpotRequestBody {
    data?: Array<Record<string, unknown>>;
    properties?: Record<string, unknown>;
    test_event_code?: string;
}

interface MockHubSpotRequest {
    url: string;
    method: string;
    body?: MockHubSpotRequestBody;
}

interface MockHubSpotRoute {
    matches: (request: MockHubSpotRequest) => boolean;
    respond: (request: MockHubSpotRequest) => Response | Promise<Response>;
}

function buildMockHubSpotRequest(input: RequestInfo | URL, init?: RequestInit): MockHubSpotRequest {
    return {
        url: getUrl(input),
        method: init?.method || 'GET',
        body: init?.body ? JSON.parse(String(init.body)) as MockHubSpotRequestBody : undefined,
    };
}

function createMockHubSpotFetch(calls: MockHubSpotRequest[], routes: MockHubSpotRoute[]): typeof fetch {
    return (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const request = buildMockHubSpotRequest(input, init);
        calls.push(request);

        for (const route of routes) {
            if (route.matches(request)) {
                return await route.respond(request);
            }
        }

        throw new Error(`Unexpected request: ${request.method} ${request.url}`);
    }) as typeof fetch;
}

function collectContactPatchProperties(calls: MockHubSpotRequest[], contactId: string): Record<string, unknown> {
    const patches = calls.filter((call) => call.url.endsWith(`/crm/v3/objects/contacts/${contactId}`) && call.method === 'PATCH');
    return Object.assign({}, ...patches.map((call) => call.body?.properties || {}));
}

function hashNormalized(value: string): string {
    return createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

async function waitForCall(
    predicate: (call: MockHubSpotRequest) => boolean,
    calls: MockHubSpotRequest[],
    timeoutMs = 50,
): Promise<MockHubSpotRequest | undefined> {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
        const match = calls.find(predicate);
        if (match) return match;
        await new Promise((resolve) => setTimeout(resolve, 1));
    }

    return calls.find(predicate);
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
        wbraid: 'w-123',
    });

    assert.equal(mapped.properties.ga_client_id, 'ga.123');
    assert.equal(mapped.properties.hs_linkedin_click_id, 'ms-abc');
    assert.equal(mapped.properties.hs_google_click_id, 'g-xyz');
    assert.equal(mapped.properties.wbraid, 'w-123');
});

test('mapTrackingToContactProperties should map HubSpot tracking fields used by FEL-45', () => {
    const mapped = mapTrackingToContactProperties({
        utm_source: null,
        utm_medium: null,
        utm_campaign: null,
        utm_term: null,
        utm_content: null,
        cid: 'ga.321',
        sid: 'sid-456',
        fbclid: 'fbclid-123',
        fbc: 'fb.1.1736366050123.fbclid-123',
    });

    assert.deepEqual(mapped.properties, {
        ga_client_id: 'ga.321',
        ga_session_id: 'sid-456',
        hs_facebook_click_id: 'fbclid-123',
    });
    assert.deepEqual(mapped.unmapped, {
        fbc: 'fb.1.1736366050123.fbclid-123',
    });
});

test('validatePayload should preserve fbp as a top-level tracking field', () => {
    const result = validatePayload({
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

test('submit-lead should create contact and deal on first attempt', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.HUBSPOT_TOKEN = 'test-token';
    process.env.HUBSPOT_DEAL_PIPELINE_ID = 'pipeline-1';
    process.env.HUBSPOT_DEAL_STAGE_ID = 'stage-1';
    process.env.HUBSPOT_DEAL_BANT_PROPERTY = 'bant_summary';
    process.env.META_PIXEL_ID = 'pixel-1';
    process.env.META_ACCESS_TOKEN = 'token-1';

    const calls: MockHubSpotRequest[] = [];

    global.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = getUrl(input);
        const method = init?.method || 'GET';
        const body = init?.body ? JSON.parse(String(init.body)) as MockHubSpotRequestBody : undefined;
        calls.push({ url, method, body });

        if (url.endsWith('/crm/v3/objects/contacts') && method === 'POST') {
            return new Response(JSON.stringify({ id: 'contact-1' }), { status: 201 });
        }

        if (url.endsWith('/crm/v3/objects/contacts/contact-1') && method === 'PATCH') {
            return new Response(JSON.stringify({ id: 'contact-1' }), { status: 200 });
        }

        if (url.endsWith('/crm/v3/objects/deals') && method === 'POST') {
            return new Response(JSON.stringify({ id: 'deal-1' }), { status: 201 });
        }

        if (url.endsWith('/crm/v4/objects/deals/deal-1/associations/default/contacts/contact-1') && method === 'PUT') {
            return new Response(null, { status: 204 });
        }

        if (url.startsWith('https://graph.facebook.com/v19.0/pixel-1/events') && method === 'POST') {
            return new Response(JSON.stringify({ events_received: 1 }), { status: 200 });
        }

        throw new Error(`Unexpected request: ${method} ${url}`);
    }) as typeof fetch;

    const response = await handler(buildRequest({
        firstName: 'Felipe',
        lastName: 'William',
        email: 'felipe@example.com',
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
            cid: 'cid-1',
            sid: 'sid-1',
            gclid: 'gclid-1',
            fbclid: 'fbclid-1',
            msclkid: 'msclkid-1',
            ttclid: 'ttclid-1',
            gbraid: 'gbraid-1',
            fbp: 'fb.1.1736366050.1234567890',
        },
    }));

    assert.equal(response.status, 201);
    const payload = await response.json();

    assert.equal(payload.ok, true);
    assert.equal(typeof payload.requestId, 'string');
    assert.ok(payload.requestId.length > 0);
    assert.equal(payload.contactId, 'contact-1');
    assert.equal(payload.dealId, 'deal-1');

    const contactRequest = calls.find((call) => call.url.endsWith('/crm/v3/objects/contacts'));
    assert.ok(contactRequest, 'contact creation request should exist');

    const contactProps = contactRequest!.body?.properties || {};
    assert.equal(contactProps.firstname, 'Felipe');
    assert.equal(contactProps.lastname, 'William');
    assert.equal(contactProps.email, 'felipe@example.com');

    const enrichedContactProps = collectContactPatchProperties(calls, 'contact-1');
    assert.equal(enrichedContactProps.ga_client_id, 'cid-1');
    assert.equal(enrichedContactProps.ga_session_id, 'sid-1');
    assert.equal(enrichedContactProps.hs_google_click_id, 'gclid-1');
    assert.equal(enrichedContactProps.hs_facebook_click_id, 'fbclid-1');
    assert.equal(enrichedContactProps.hs_linkedin_click_id, 'msclkid-1');
    assert.equal(
        calls.filter((call) => call.url.endsWith('/crm/v3/objects/contacts/contact-1') && call.method === 'PATCH').length,
        1,
    );

    const metaRequest = await waitForCall(
        (call) => call.url.startsWith('https://graph.facebook.com/v19.0/pixel-1/events'),
        calls,
    );
    assert.ok(metaRequest, 'meta request should exist');
    assert.match(metaRequest!.url, /access_token=token-1$/);

    const metaEvent = metaRequest!.body?.data?.[0];
    assert.ok(metaEvent, 'meta event payload should exist');
    assert.equal(metaEvent?.event_id, 'lead_test_123abc');
    assert.equal(metaEvent?.event_name, 'Lead');
    assert.equal(
        (metaEvent?.custom_data as Record<string, unknown>)?.content_name,
        'Rio de Janeiro',
    );
    assert.equal(
        (metaEvent?.user_data as Record<string, unknown>)?.fbp,
        'fb.1.1736366050.1234567890',
    );
    assert.deepEqual(
        (metaEvent?.user_data as Record<string, unknown>)?.em,
        [hashNormalized('felipe@example.com')],
    );

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

    const calls: MockHubSpotRequest[] = [];

    global.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = getUrl(input);
        const method = init?.method || 'GET';
        const body = init?.body ? JSON.parse(String(init.body)) as MockHubSpotRequestBody : undefined;
        calls.push({ url, method, body });

        if (url.endsWith('/crm/v3/objects/contacts') && method === 'POST') {
            return new Response(JSON.stringify({ id: 'contact-1' }), { status: 201 });
        }
        if (url.endsWith('/crm/v3/objects/contacts/contact-1') && method === 'PATCH') {
            return new Response(JSON.stringify({ id: 'contact-1' }), { status: 200 });
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

    const enrichedContactProps = collectContactPatchProperties(calls, 'contact-1');
    assert.equal(enrichedContactProps.ultimo_utm_source, "&lt;svg onload=alert(1)&gt;");

    const dealRequest = calls.find((call) => call.url.endsWith('/crm/v3/objects/deals'));
    const dealProps = dealRequest!.body.properties;
    const dealName = typeof dealProps.dealname === 'string' ? dealProps.dealname : '';
    assert.ok(dealName.includes("&lt;script&gt;"));
    const bantProperty = process.env.HUBSPOT_DEAL_BANT_PROPERTY || 'bant_summary';
    assert.equal(dealProps[bantProperty], "Need: &lt;img src=x onerror=alert(1)&gt;");

    // Check extras sanitization
    const trackingFallback = typeof enrichedContactProps.contact_tracking_fallback === 'string'
        ? enrichedContactProps.contact_tracking_fallback
        : '{}';
    const extras = JSON.parse(trackingFallback) as Record<string, string>;
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
    assert.equal(typeof payload.requestId, 'string');
    assert.ok(payload.requestId.length > 0);
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

        if (url.endsWith('/crm/v3/objects/contacts/contact-3') && method === 'PATCH') {
            return new Response(JSON.stringify({ id: 'contact-3' }), { status: 200 });
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
    assert.equal(typeof payload.requestId, 'string');
    assert.ok(payload.requestId.length > 0);
    assert.equal(payload.contactId, 'contact-3');
    assert.equal(payload.dealId, undefined);
    assert.match(payload.warning, /nota foi registrada/i);
});

test('submit-lead should keep the contact when optional HubSpot properties fail', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.HUBSPOT_TOKEN = 'test-token';
    process.env.HUBSPOT_DEAL_PIPELINE_ID = 'pipeline-1';
    process.env.HUBSPOT_DEAL_STAGE_ID = 'stage-1';

    const calls: MockHubSpotRequest[] = [];

    global.fetch = createMockHubSpotFetch(calls, [
        {
            matches: ({ url, method }) => url.endsWith('/crm/v3/objects/contacts') && method === 'POST',
            respond: () => new Response(JSON.stringify({ id: 'contact-4' }), { status: 201 }),
        },
        {
            matches: ({ url, method }) => url.endsWith('/crm/v3/objects/contacts/contact-4') && method === 'PATCH',
            respond: ({ body }) => {
                const propertyName = Object.keys(body?.properties || {})[0];
                if (propertyName === 'ultimo_utm_source') {
                    return new Response(JSON.stringify({
                        status: 'error',
                        message: 'Property values were not valid',
                    }), { status: 400 });
                }

                return new Response(JSON.stringify({ id: 'contact-4' }), { status: 200 });
            },
        },
        {
            matches: ({ url, method }) => url.endsWith('/crm/v3/objects/deals') && method === 'POST',
            respond: () => new Response(JSON.stringify({ id: 'deal-4' }), { status: 201 }),
        },
        {
            matches: ({ url, method }) => url.endsWith('/crm/v4/objects/deals/deal-4/associations/default/contacts/contact-4') && method === 'PUT',
            respond: () => new Response(null, { status: 204 }),
        },
        {
            matches: ({ url, method }) => url.endsWith('/crm/v3/objects/notes') && method === 'POST',
            respond: () => new Response(JSON.stringify({ id: 'note-contact-warning' }), { status: 201 }),
        },
        {
            matches: ({ url, method }) => url.endsWith('/crm/v4/objects/notes/note-contact-warning/associations/default/contacts/contact-4') && method === 'PUT',
            respond: () => new Response(null, { status: 204 }),
        },
    ]);

    const response = await handler(buildRequest({
        firstName: 'Felipe',
        lastName: 'William',
        email: 'felipe@example.com',
        bantSummary: 'Need: Disney | Authority: casal | Budget: 20k | Timeline: junho',
        destination: 'Orlando',
        utms: {
            utm_source: 'google',
            utm_medium: null,
            utm_campaign: null,
            utm_term: null,
            utm_content: null,
        },
        tracking: {
            utm_source: 'google',
            utm_medium: null,
            utm_campaign: null,
            utm_term: null,
            utm_content: null,
            cid: 'cid-4',
        },
    }));

    assert.equal(response.status, 201);
    const payload = await response.json();

    assert.equal(payload.ok, true);
    assert.equal(payload.contactId, 'contact-4');
    assert.equal(payload.dealId, 'deal-4');
    assert.match(payload.warning, /dados de rastreamento\/UTM/i);
    assert.match(payload.warning, /nota foi registrada/i);

    const contactCreateRequest = calls.find((call) => call.url.endsWith('/crm/v3/objects/contacts') && call.method === 'POST');
    assert.deepEqual(contactCreateRequest?.body?.properties, {
        firstname: 'Felipe',
        lastname: 'William',
        email: 'felipe@example.com',
    });

    const enrichedContactProps = collectContactPatchProperties(calls, 'contact-4');
    assert.equal(enrichedContactProps.ga_client_id, 'cid-4');
    assert.equal(enrichedContactProps.ultimo_utm_source, 'google');
    assert.equal(
        calls.filter((call) => call.url.endsWith('/crm/v3/objects/contacts/contact-4') && call.method === 'PATCH').length,
        1,
    );

    const noteRequest = calls.find((call) => call.url.endsWith('/crm/v3/objects/notes') && call.method === 'POST');
    assert.ok(noteRequest, 'fallback note should be created for rejected optional properties');
    assert.match(String(noteRequest?.body?.properties?.hs_note_body || ''), /ultimo_utm_source/);
});

test('submit-lead should return requestId and property-specific code when HubSpot rejects contact properties', async (t) => {
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
            return new Response(JSON.stringify({
                status: 'error',
                message: 'Property values were not valid',
            }), { status: 400 });
        }

        throw new Error(`Unexpected request: ${method} ${url}`);
    }) as typeof fetch;

    const response = await handler(buildRequest({
        firstName: 'Felipe',
        lastName: 'William',
        email: 'felipe@example.com',
        bantSummary: 'Need: Praia | Authority: casal | Budget: 20k | Timeline: setembro',
        destination: 'Lisboa',
        utms: {},
        tracking: {
            utm_source: null,
            utm_medium: null,
            utm_campaign: null,
            utm_term: null,
            utm_content: null,
        },
    }));

    assert.equal(response.status, 502);
    const payload = await response.json();

    assert.equal(payload.ok, false);
    assert.equal(payload.code, 'HUBSPOT_PROPERTY_ERROR');
    assert.equal(typeof payload.requestId, 'string');
    assert.ok(payload.requestId.length > 0);
});

test('submit-lead should not hang when HubSpot enrichment times out', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.HUBSPOT_TOKEN = 'test-token';
    process.env.HUBSPOT_DEAL_PIPELINE_ID = 'pipeline-1';
    process.env.HUBSPOT_DEAL_STAGE_ID = 'stage-1';
    process.env.HUBSPOT_REQUEST_TIMEOUT_MS = '100';

    const calls: MockHubSpotRequest[] = [];

    global.fetch = createMockHubSpotFetch(calls, [
        {
            matches: ({ url, method }) => url.endsWith('/crm/v3/objects/contacts') && method === 'POST',
            respond: () => new Response(JSON.stringify({ id: 'contact-timeout' }), { status: 201 }),
        },
        {
            matches: ({ url, method }) => url.endsWith('/crm/v3/objects/contacts/contact-timeout') && method === 'PATCH',
            respond: () => new Promise<Response>(() => {}),
        },
        {
            matches: ({ url, method }) => url.endsWith('/crm/v3/objects/deals') && method === 'POST',
            respond: () => new Response(JSON.stringify({ id: 'deal-timeout' }), { status: 201 }),
        },
        {
            matches: ({ url, method }) => url.endsWith('/crm/v4/objects/deals/deal-timeout/associations/default/contacts/contact-timeout') && method === 'PUT',
            respond: () => new Response(null, { status: 204 }),
        },
    ]);

    const response = await handler(buildRequest({
        firstName: 'Felipe',
        lastName: 'William',
        email: 'felipe@example.com',
        bantSummary: 'Need: Disney | Authority: casal | Budget: 20k | Timeline: junho',
        destination: 'Orlando',
        utms: {
            utm_source: 'google',
            utm_medium: null,
            utm_campaign: null,
            utm_term: null,
            utm_content: null,
        },
        tracking: {
            cid: 'cid-timeout',
            utm_source: 'google',
            utm_medium: null,
            utm_campaign: null,
            utm_term: null,
            utm_content: null,
        },
    }));

    assert.equal(response.status, 201);
    const payload = await response.json();

    assert.equal(payload.ok, true);
    assert.equal(payload.contactId, 'contact-timeout');
    assert.equal(payload.dealId, 'deal-timeout');
    assert.match(payload.warning, /dados de rastreamento\/UTM/i);
    assert.doesNotMatch(payload.warning, /nota foi registrada/i);
    assert.equal(calls.some((call) => call.url.endsWith('/crm/v3/objects/notes')), false);
});
