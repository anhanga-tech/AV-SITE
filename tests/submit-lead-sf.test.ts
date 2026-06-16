import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/submit-lead-sf.ts';
import { postWebToLead } from '../services/salesforce.ts';

const originalFetch = global.fetch;

function buildRequest(body: Record<string, unknown>, init?: { method?: string }): Request {
    const ipSuffix = Math.floor(Math.random() * 200) + 1;
    const method = init?.method || 'POST';

    return new Request('http://localhost/api/submit-lead-sf', {
        method,
        headers: {
            'Content-Type': 'application/json',
            'x-real-ip': `127.0.0.${ipSuffix}`,
        },
        body: method === 'OPTIONS' ? undefined : JSON.stringify(body),
    });
}

function corporativoPayload() {
    return {
        firstName: 'João',
        lastName: 'Silva',
        email: 'joao@empresa.com.br',
        whatsapp: '11999998888',
        empresa: 'Acme Corp',
        cargo: 'Diretor',
        leadSource: 'Corporativo',
    };
}

function minimalPayload() {
    return {
        firstName: 'Maria',
        lastName: 'Santos',
        email: 'maria@teste.com.br',
    };
}

test('submit-lead-sf: OPTIONS returns 204', async () => {
    const res = await handler(new Request('http://localhost/api/submit-lead-sf', { method: 'OPTIONS' }));
    assert.equal(res.status, 204);
});

test('submit-lead-sf: GET returns 405', async () => {
    const res = await handler(new Request('http://localhost/api/submit-lead-sf', { method: 'GET' }));
    assert.equal(res.status, 405);
});

test('submit-lead-sf: invalid JSON returns 400', async () => {
    const ipSuffix = Math.floor(Math.random() * 200) + 1;
    const req = new Request('http://localhost/api/submit-lead-sf', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-real-ip': `127.0.0.${ipSuffix}`,
        },
        body: 'not json',
    });
    const res = await handler(req);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.ok, false);
});

test('submit-lead-sf: missing required fields returns 400', async () => {
    const res = await handler(buildRequest({ firstName: 'João' }));
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.ok, false);
});

test('submit-lead-sf: invalid email returns 400', async () => {
    const payload = corporativoPayload();
    payload.email = 'not-an-email';
    const res = await handler(buildRequest(payload));
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /email/i);
});

test('submit-lead-sf: invalid phone returns 400 when provided', async () => {
    const payload = { ...minimalPayload(), whatsapp: '123' };
    const res = await handler(buildRequest(payload));
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /telefone/i);
});

test('submit-lead-sf: full corporativo payload sends all fields', async () => {
    let capturedUrl = '';
    let capturedBody = '';

    global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        capturedUrl = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        capturedBody = typeof init?.body === 'string' ? init.body : '';
        return new Response('', { status: 200 });
    };

    try {
        const res = await handler(buildRequest(corporativoPayload()));
        assert.equal(res.status, 201);

        const parsedUrl = new URL(capturedUrl);
        assert.equal(parsedUrl.hostname, 'webto.salesforce.com');
        assert.ok(capturedBody.includes('first_name=Jo%C3%A3o'), 'first_name');
        assert.ok(capturedBody.includes('last_name=Silva'), 'last_name');
        assert.ok(capturedBody.includes('company=Acme+Corp'), 'company');
        assert.ok(capturedBody.includes('title=Diretor'), 'title');
        assert.ok(capturedBody.includes('phone='), 'phone');
        assert.ok(capturedBody.includes('lead_source=Corporativo'), 'lead_source');
        assert.ok(capturedBody.includes('oid=00Das00000EnTnB'), 'oid');
    } finally {
        global.fetch = originalFetch;
    }
});

test('submit-lead-sf: minimal payload (only required fields) defaults leadSource to Web', async () => {
    let capturedBody = '';

    global.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
        capturedBody = typeof init?.body === 'string' ? init.body : '';
        return new Response('', { status: 200 });
    };

    try {
        const res = await handler(buildRequest(minimalPayload()));
        assert.equal(res.status, 201);

        assert.ok(capturedBody.includes('first_name=Maria'), 'first_name');
        assert.ok(capturedBody.includes('lead_source=Web'), 'default lead_source');
        assert.ok(!capturedBody.includes('phone='), 'no phone when absent');
        assert.ok(capturedBody.includes('company=N%C3%A3o+informado'), 'company defaults to Não informado');
        assert.ok(!capturedBody.includes('title='), 'no title when absent');
        assert.ok(!capturedBody.includes('description='), 'no description when absent');
    } finally {
        global.fetch = originalFetch;
    }
});

test('submit-lead-sf: description field is forwarded', async () => {
    let capturedBody = '';

    global.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
        capturedBody = typeof init?.body === 'string' ? init.body : '';
        return new Response('', { status: 200 });
    };

    try {
        const payload = { ...minimalPayload(), description: 'Destino: Paris. Datas: julho.' };
        const res = await handler(buildRequest(payload));
        assert.equal(res.status, 201);
        assert.ok(capturedBody.includes('description='), 'should include description');
        assert.ok(capturedBody.includes('Paris'), 'should contain description content');
    } finally {
        global.fetch = originalFetch;
    }
});

test('submit-lead-sf: invalid leadSource defaults to Web', async () => {
    let capturedBody = '';

    global.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
        capturedBody = typeof init?.body === 'string' ? init.body : '';
        return new Response('', { status: 200 });
    };

    try {
        const payload = { ...minimalPayload(), leadSource: 'INVALID_SOURCE' };
        const res = await handler(buildRequest(payload));
        assert.equal(res.status, 201);
        assert.ok(capturedBody.includes('lead_source=Web'), 'invalid source should fallback to Web');
    } finally {
        global.fetch = originalFetch;
    }
});

test('submit-lead-sf: missing email is accepted (lead without email)', async () => {
    let capturedBody = '';

    global.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
        capturedBody = typeof init?.body === 'string' ? init.body : '';
        return new Response('', { status: 200 });
    };

    try {
        const res = await handler(buildRequest({ firstName: 'Ana', lastName: 'Costa', whatsapp: '11988887777' }));
        assert.equal(res.status, 201);
        assert.ok(!capturedBody.includes('email='), 'no email param when absent');
        assert.ok(capturedBody.includes('last_name=Costa'), 'last_name');
        assert.ok(capturedBody.includes('phone='), 'phone forwarded');
    } finally {
        global.fetch = originalFetch;
    }
});

test('submit-lead-sf: utms are appended to description while custom field IDs are not configured', async () => {
    let capturedBody = '';

    global.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
        capturedBody = typeof init?.body === 'string' ? init.body : '';
        return new Response('', { status: 200 });
    };

    try {
        const payload = {
            ...minimalPayload(),
            description: 'Lead via chatbot.',
            utms: {
                utm_source: 'google',
                utm_medium: 'cpc',
                utm_campaign: 'verao-2026',
                utm_term: null,
                utm_content: '',
            },
        };
        const res = await handler(buildRequest(payload));
        assert.equal(res.status, 201);

        const decoded = decodeURIComponent(capturedBody.replace(/\+/g, ' '));
        assert.ok(decoded.includes('Lead via chatbot.'), 'original description preserved');
        assert.ok(decoded.includes('utm_source=google'), 'utm_source in description');
        assert.ok(decoded.includes('utm_medium=cpc'), 'utm_medium in description');
        assert.ok(decoded.includes('utm_campaign=verao-2026'), 'utm_campaign in description');
        assert.ok(!decoded.includes('utm_term'), 'null utm ignored');
    } finally {
        global.fetch = originalFetch;
    }
});

test('submit-lead-sf: malformed utms object is ignored', async () => {
    let capturedBody = '';

    global.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
        capturedBody = typeof init?.body === 'string' ? init.body : '';
        return new Response('', { status: 200 });
    };

    try {
        const payload = { ...minimalPayload(), utms: { utm_source: { nested: true }, bogus: 'x' } };
        const res = await handler(buildRequest(payload));
        assert.equal(res.status, 201);
        assert.ok(!capturedBody.includes('utm_source'), 'non-string utm dropped');
        assert.ok(!capturedBody.includes('bogus'), 'unknown keys dropped');
    } finally {
        global.fetch = originalFetch;
    }
});

test('salesforce service: utms map to custom field IDs when configured', async () => {
    let capturedBody = '';

    global.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
        capturedBody = typeof init?.body === 'string' ? init.body : '';
        return new Response('', { status: 200 });
    };

    try {
        const result = await postWebToLead(
            {
                firstName: 'Maria',
                lastName: 'Santos',
                email: 'maria@teste.com.br',
                leadSource: 'Web',
                description: 'Lead via chatbot.',
                utms: { utm_source: 'google', utm_medium: 'cpc' },
            },
            {
                utm_source: '00N000000000001',
                utm_medium: '00N000000000002',
                utm_campaign: '00N000000000003',
                utm_term: '00N000000000004',
                utm_content: '00N000000000005',
            },
        );

        assert.equal(result.ok, true);
        assert.ok(capturedBody.includes('00N000000000001=google'), 'utm_source mapped to field ID');
        assert.ok(capturedBody.includes('00N000000000002=cpc'), 'utm_medium mapped to field ID');
        assert.ok(!capturedBody.includes('00N000000000003'), 'unset utm field omitted');

        const decoded = decodeURIComponent(capturedBody.replace(/\+/g, ' '));
        assert.ok(!decoded.includes('UTMs:'), 'no description fallback when fields are mapped');
        assert.ok(decoded.includes('Lead via chatbot.'), 'description untouched');
    } finally {
        global.fetch = originalFetch;
    }
});

test('submit-lead-sf: Salesforce error returns 502', async () => {
    global.fetch = async () => new Response('error', { status: 500 });

    try {
        const res = await handler(buildRequest(minimalPayload()));
        assert.equal(res.status, 502);
        const data = await res.json();
        assert.equal(data.ok, false);
    } finally {
        global.fetch = originalFetch;
    }
});

test('submit-lead-sf: network error returns 500', async () => {
    global.fetch = async () => { throw new Error('Network failure'); };

    try {
        const res = await handler(buildRequest(minimalPayload()));
        assert.equal(res.status, 500);
        const data = await res.json();
        assert.equal(data.ok, false);
    } finally {
        global.fetch = originalFetch;
    }
});
