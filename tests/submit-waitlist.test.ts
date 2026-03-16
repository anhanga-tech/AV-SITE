import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/submit-waitlist.ts';

const originalFetch = global.fetch;
const originalEnv = {
    HUBSPOT_TOKEN: process.env.HUBSPOT_TOKEN,
    HUBSPOT_CONTACT_TRACKING_FALLBACK_PROPERTY: process.env.HUBSPOT_CONTACT_TRACKING_FALLBACK_PROPERTY,
    HUBSPOT_REQUEST_TIMEOUT_MS: process.env.HUBSPOT_REQUEST_TIMEOUT_MS,
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
    restoreEnvValue('HUBSPOT_CONTACT_TRACKING_FALLBACK_PROPERTY', originalEnv.HUBSPOT_CONTACT_TRACKING_FALLBACK_PROPERTY);
    restoreEnvValue('HUBSPOT_REQUEST_TIMEOUT_MS', originalEnv.HUBSPOT_REQUEST_TIMEOUT_MS);
}

function buildRequest(body: Record<string, unknown>): Request {
    const ipSuffix = Math.floor(Math.random() * 200) + 1;

    return new Request('http://localhost/api/submit-waitlist', {
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

function requestTargetsHost(rawUrl: string, host: string): boolean {
    try {
        return new URL(rawUrl).hostname === host;
    } catch {
        return false;
    }
}

interface MockHubSpotRequestBody {
    properties?: Record<string, unknown>;
    filterGroups?: Array<Record<string, unknown>>;
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

test('submit-waitlist should reject invalid payloads', async () => {
    restoreEnv();
    delete process.env.HUBSPOT_TOKEN;

    const response = await handler(buildRequest({
        name: '',
        email: 'felipe@example.com',
        sourcePage: '/lollapalooza',
        utms: {},
        tracking: {},
    }));

    assert.equal(response.status, 400);

    const payload = await response.json() as { ok: boolean; code?: string };
    assert.equal(payload.ok, false);
    assert.equal(payload.code, 'VALIDATION_ERROR');
});

test('submit-waitlist should create contact, sync tracking, create note, and avoid deals', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.HUBSPOT_TOKEN = 'hubspot-token';
    process.env.HUBSPOT_CONTACT_TRACKING_FALLBACK_PROPERTY = 'tracking_payload';

    const calls: MockHubSpotRequest[] = [];
    global.fetch = createMockHubSpotFetch(calls, [
        {
            matches: (request) => request.method === 'POST' && request.url.endsWith('/crm/v3/objects/contacts'),
            respond: async () => new Response(JSON.stringify({ id: 'contact_waitlist_123' }), { status: 201 }),
        },
        {
            matches: (request) => request.method === 'PATCH' && request.url.endsWith('/crm/v3/objects/contacts/contact_waitlist_123'),
            respond: async () => new Response(JSON.stringify({ id: 'contact_waitlist_123' }), { status: 200 }),
        },
        {
            matches: (request) => request.method === 'POST' && request.url.endsWith('/crm/v3/objects/notes'),
            respond: async () => new Response(JSON.stringify({ id: 'note_waitlist_123' }), { status: 201 }),
        },
        {
            matches: (request) => request.method === 'PUT' && request.url.endsWith('/crm/v4/objects/notes/note_waitlist_123/associations/default/contacts/contact_waitlist_123'),
            respond: async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
        },
    ]);

    const response = await handler(buildRequest({
        name: 'Felipe William',
        email: 'felipe@example.com',
        sourcePage: '/lollapalooza',
        utms: {
            utm_source: 'google',
            utm_medium: 'cpc',
            utm_campaign: 'lolla_waitlist',
            utm_term: null,
            utm_content: null,
        },
        tracking: {
            utm_source: 'google',
            utm_medium: 'cpc',
            utm_campaign: 'lolla_waitlist',
            utm_term: null,
            utm_content: null,
            gclid: 'test-gclid',
            extras: {
                ref: 'hero_cta',
            },
        },
    }));

    assert.equal(response.status, 201);

    const payload = await response.json() as { ok: boolean; contactId?: string; message?: string };
    assert.equal(payload.ok, true);
    assert.equal(payload.contactId, 'contact_waitlist_123');
    assert.match(payload.message || '', /lista de espera/i);

    const createContactCall = calls.find((call) => call.url.endsWith('/crm/v3/objects/contacts') && call.method === 'POST');
    assert.deepEqual(createContactCall?.body?.properties, {
        firstname: 'Felipe',
        lastname: 'William',
        email: 'felipe@example.com',
    });

    const contactProperties = collectContactPatchProperties(calls, 'contact_waitlist_123');
    assert.equal(contactProperties.ultimo_utm_source, 'google');
    assert.equal(contactProperties.ultimo_utm_medium, 'cpc');
    assert.equal(contactProperties.ultimo_utm_campaign, 'lolla_waitlist');
    assert.equal(contactProperties.hs_google_click_id, 'test-gclid');
    assert.equal(contactProperties.tracking_payload, JSON.stringify({ ref: 'hero_cta' }));

    const noteCall = calls.find((call) => call.url.endsWith('/crm/v3/objects/notes') && call.method === 'POST');
    assert.match(String(noteCall?.body?.properties?.hs_note_body || ''), /Lista de Espera Lollapalooza 2027/);
    assert.match(String(noteCall?.body?.properties?.hs_note_body || ''), /\/lollapalooza/);

    assert.equal(calls.some((call) => call.url.includes('/crm/v3/objects/deals')), false);
    assert.equal(calls.some((call) => requestTargetsHost(call.url, 'www.google-analytics.com')), false);
    assert.equal(calls.some((call) => requestTargetsHost(call.url, 'graph.facebook.com')), false);
});

test('submit-waitlist should update an existing contact when HubSpot returns duplicate email', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnv();
    });

    process.env.HUBSPOT_TOKEN = 'hubspot-token';

    const calls: MockHubSpotRequest[] = [];
    global.fetch = createMockHubSpotFetch(calls, [
        {
            matches: (request) => request.method === 'POST' && request.url.endsWith('/crm/v3/objects/contacts'),
            respond: async () => new Response(JSON.stringify({ message: 'duplicate' }), { status: 409 }),
        },
        {
            matches: (request) => request.method === 'POST' && request.url.endsWith('/crm/v3/objects/contacts/search'),
            respond: async () => new Response(JSON.stringify({ results: [{ id: 'contact_existing_456' }] }), { status: 200 }),
        },
        {
            matches: (request) => request.method === 'PATCH' && request.url.endsWith('/crm/v3/objects/contacts/contact_existing_456'),
            respond: async () => new Response(JSON.stringify({ id: 'contact_existing_456' }), { status: 200 }),
        },
        {
            matches: (request) => request.method === 'POST' && request.url.endsWith('/crm/v3/objects/notes'),
            respond: async () => new Response(JSON.stringify({ id: 'note_waitlist_456' }), { status: 201 }),
        },
        {
            matches: (request) => request.method === 'PUT' && request.url.endsWith('/crm/v4/objects/notes/note_waitlist_456/associations/default/contacts/contact_existing_456'),
            respond: async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
        },
    ]);

    const response = await handler(buildRequest({
        name: 'Felipe',
        email: 'felipe@example.com',
        sourcePage: '/lollapalooza',
        utms: {},
        tracking: {},
    }));

    assert.equal(response.status, 201);

    const payload = await response.json() as { ok: boolean; contactId?: string };
    assert.equal(payload.ok, true);
    assert.equal(payload.contactId, 'contact_existing_456');

    const patchCalls = calls.filter((call) => call.url.endsWith('/crm/v3/objects/contacts/contact_existing_456') && call.method === 'PATCH');
    assert.equal(patchCalls.length >= 1, true);
    assert.equal(calls.some((call) => call.url.endsWith('/crm/v3/objects/contacts/search')), true);
});
