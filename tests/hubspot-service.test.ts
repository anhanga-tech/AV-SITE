import test from 'node:test';
import assert from 'node:assert/strict';
import { getDeal, getContact, getAssociatedContactId } from '../services/hubspot.ts';

const originalFetch = global.fetch;
const originalEnv = {
    HUBSPOT_REQUEST_TIMEOUT_MS: process.env.HUBSPOT_REQUEST_TIMEOUT_MS,
};

function restoreEnvValue(key: string, value: string | undefined) {
    if (value === undefined) {
        delete process.env[key];
        return;
    }
    process.env[key] = value;
}

const TOKEN = 'test-hubspot-token';

function getUrl(input: RequestInfo | URL): string {
    if (typeof input === 'string') return input;
    if (input instanceof URL) return input.toString();
    return (input as Request).url;
}

test('getDeal sends GET request with Authorization header and correct URL', async (t) => {
    const requests: Array<{ url: string; method: string; authHeader: string }> = [];

    t.after(() => {
        global.fetch = originalFetch;
        restoreEnvValue('HUBSPOT_REQUEST_TIMEOUT_MS', originalEnv.HUBSPOT_REQUEST_TIMEOUT_MS);
    });

    const mockDeal = { id: 'deal-1', properties: { dealname: 'Viagem Orlando', amount: '5000', dealstage: 'closedwon' } };

    global.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const headers = new Headers(init?.headers);
        requests.push({
            url: getUrl(input),
            method: init?.method || 'GET',
            authHeader: headers.get('Authorization') ?? '',
        });
        return new Response(JSON.stringify(mockDeal), { status: 200 });
    }) as typeof fetch;

    const deal = await getDeal(TOKEN, 'deal-1');

    assert.equal(requests.length, 1);
    assert.ok(requests[0]!.url.includes('/crm/v3/objects/deals/deal-1'));
    assert.equal(requests[0]!.authHeader, `Bearer ${TOKEN}`);
    assert.deepEqual(deal, mockDeal);
});

test('getDeal includes requested properties in URL', async (t) => {
    const urls: string[] = [];

    t.after(() => {
        global.fetch = originalFetch;
        restoreEnvValue('HUBSPOT_REQUEST_TIMEOUT_MS', originalEnv.HUBSPOT_REQUEST_TIMEOUT_MS);
    });

    global.fetch = (async (input: RequestInfo | URL): Promise<Response> => {
        urls.push(getUrl(input));
        return new Response(JSON.stringify({ id: 'deal-1', properties: {} }), { status: 200 });
    }) as typeof fetch;

    await getDeal(TOKEN, 'deal-1', ['amount', 'closedate']);
    assert.ok(urls[0]!.includes('amount'));
    assert.ok(urls[0]!.includes('closedate'));
});

test('getDeal throws UNAUTHORIZED on 401 response', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnvValue('HUBSPOT_REQUEST_TIMEOUT_MS', originalEnv.HUBSPOT_REQUEST_TIMEOUT_MS);
    });

    global.fetch = (async (): Promise<Response> => new Response('Unauthorized', { status: 401 })) as typeof fetch;

    await assert.rejects(
        () => getDeal(TOKEN, 'deal-1'),
        (err: Error) => {
            assert.equal(err.message, 'UNAUTHORIZED');
            return true;
        },
    );
});

test('getDeal throws UNAUTHORIZED on 403 response', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnvValue('HUBSPOT_REQUEST_TIMEOUT_MS', originalEnv.HUBSPOT_REQUEST_TIMEOUT_MS);
    });

    global.fetch = (async (): Promise<Response> => new Response('Forbidden', { status: 403 })) as typeof fetch;

    await assert.rejects(
        () => getDeal(TOKEN, 'deal-1'),
        (err: Error) => {
            assert.equal(err.message, 'UNAUTHORIZED');
            return true;
        },
    );
});

test('getDeal throws with error code and status on non-ok response', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnvValue('HUBSPOT_REQUEST_TIMEOUT_MS', originalEnv.HUBSPOT_REQUEST_TIMEOUT_MS);
    });

    global.fetch = (async (): Promise<Response> => new Response('Not found', { status: 404 })) as typeof fetch;

    await assert.rejects(
        () => getDeal(TOKEN, 'deal-1'),
        (err: Error) => {
            assert.ok(err.message.includes('DEAL_FETCH_FAILED'));
            assert.ok(err.message.includes('404'));
            return true;
        },
    );
});

test('getDeal throws HUBSPOT_TIMEOUT when request exceeds configured timeout', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnvValue('HUBSPOT_REQUEST_TIMEOUT_MS', originalEnv.HUBSPOT_REQUEST_TIMEOUT_MS);
    });

    process.env.HUBSPOT_REQUEST_TIMEOUT_MS = '50';

    global.fetch = (async (_: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        return new Promise<Response>((resolve, reject) => {
            const timer = setTimeout(() => resolve(new Response('{}', { status: 200 })), 300);
            init?.signal?.addEventListener('abort', () => {
                clearTimeout(timer);
                const err = new Error('The user aborted a request.');
                err.name = 'AbortError';
                reject(err);
            });
        });
    }) as typeof fetch;

    await assert.rejects(
        () => getDeal(TOKEN, 'deal-1'),
        (err: Error) => {
            assert.ok(err.message.includes('HUBSPOT_TIMEOUT'));
            assert.ok(err.message.includes('504'));
            return true;
        },
    );
});

test('getContact fetches contact with correct URL', async (t) => {
    const urls: string[] = [];

    t.after(() => {
        global.fetch = originalFetch;
        restoreEnvValue('HUBSPOT_REQUEST_TIMEOUT_MS', originalEnv.HUBSPOT_REQUEST_TIMEOUT_MS);
    });

    const mockContact = { id: 'ct-1', properties: { email: 'ana@example.com', firstname: 'Ana', lastname: 'Silva', phone: null } };

    global.fetch = (async (input: RequestInfo | URL): Promise<Response> => {
        urls.push(getUrl(input));
        return new Response(JSON.stringify(mockContact), { status: 200 });
    }) as typeof fetch;

    const contact = await getContact(TOKEN, 'ct-1');
    assert.ok(urls[0]!.includes('/crm/v3/objects/contacts/ct-1'));
    assert.deepEqual(contact, mockContact);
});

test('getContact throws UNAUTHORIZED on 401', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnvValue('HUBSPOT_REQUEST_TIMEOUT_MS', originalEnv.HUBSPOT_REQUEST_TIMEOUT_MS);
    });

    global.fetch = (async (): Promise<Response> => new Response('Unauthorized', { status: 401 })) as typeof fetch;

    await assert.rejects(
        () => getContact(TOKEN, 'ct-1'),
        (err: Error) => {
            assert.equal(err.message, 'UNAUTHORIZED');
            return true;
        },
    );
});

test('getAssociatedContactId returns first contact id from results', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnvValue('HUBSPOT_REQUEST_TIMEOUT_MS', originalEnv.HUBSPOT_REQUEST_TIMEOUT_MS);
    });

    global.fetch = (async (): Promise<Response> => {
        return new Response(
            JSON.stringify({ results: [{ toObjectId: 'ct-42' }, { toObjectId: 'ct-99' }] }),
            { status: 200 },
        );
    }) as typeof fetch;

    const contactId = await getAssociatedContactId(TOKEN, 'deal-1');
    assert.equal(contactId, 'ct-42');
});

test('getAssociatedContactId returns null when results array is empty', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnvValue('HUBSPOT_REQUEST_TIMEOUT_MS', originalEnv.HUBSPOT_REQUEST_TIMEOUT_MS);
    });

    global.fetch = (async (): Promise<Response> => {
        return new Response(JSON.stringify({ results: [] }), { status: 200 });
    }) as typeof fetch;

    const contactId = await getAssociatedContactId(TOKEN, 'deal-1');
    assert.equal(contactId, null);
});

test('getAssociatedContactId returns null when results field is absent', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
        restoreEnvValue('HUBSPOT_REQUEST_TIMEOUT_MS', originalEnv.HUBSPOT_REQUEST_TIMEOUT_MS);
    });

    global.fetch = (async (): Promise<Response> => {
        return new Response(JSON.stringify({}), { status: 200 });
    }) as typeof fetch;

    const contactId = await getAssociatedContactId(TOKEN, 'deal-1');
    assert.equal(contactId, null);
});

test('getAssociatedContactId uses associations/contacts endpoint', async (t) => {
    const urls: string[] = [];

    t.after(() => {
        global.fetch = originalFetch;
        restoreEnvValue('HUBSPOT_REQUEST_TIMEOUT_MS', originalEnv.HUBSPOT_REQUEST_TIMEOUT_MS);
    });

    global.fetch = (async (input: RequestInfo | URL): Promise<Response> => {
        urls.push(getUrl(input));
        return new Response(JSON.stringify({ results: [] }), { status: 200 });
    }) as typeof fetch;

    await getAssociatedContactId(TOKEN, 'deal-99');
    assert.ok(urls[0]!.includes('/crm/v4/objects/deals/deal-99/associations/contacts'));
});
