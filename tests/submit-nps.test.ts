import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { classifySubmitNpsError } from '../api/submit-nps.ts';
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
    const method = init?.method ?? 'POST';

    return new Request('http://localhost/api/submit-nps', {
        method,
        headers: {
            'Content-Type': 'application/json',
            'x-real-ip': `127.0.0.${ipSuffix}`,
            ...init?.headers,
        },
        body: method === 'OPTIONS' || method === 'GET' ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    });
}

function validBody(overrides?: Record<string, unknown>) {
    return {
        firstname: 'Maria',
        email: 'maria@example.com',
        score: 9,
        reason: 'Atendimento excelente e viagem perfeita.',
        highlight: 'A visita às Cataratas do Iguaçu.',
        ...overrides,
    };
}

// ─── Config errors ──────────────────────────────────────────────────────────

test('submit-nps returns 500 SERVER_CONFIG_ERROR when Odoo config is missing', async (t) => {
    t.after(restore);
    clearOdooEnv();

    let fetchCalled = false;
    global.fetch = (async () => { fetchCalled = true; throw new Error('should not run'); }) as typeof fetch;

    const response = await handler(buildRequest(validBody()));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(fetchCalled, false);
    assert.equal(response.status, 500);
    assert.equal(body.ok, false);
    assert.equal(body.code, 'SERVER_CONFIG_ERROR');
});

// ─── Method gate ─────────────────────────────────────────────────────────────

test('submit-nps returns 405 METHOD_NOT_ALLOWED for GET requests', async (t) => {
    t.after(restore);
    setOdooEnv();

    const response = await handler(buildRequest({}, { method: 'GET' }));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 405);
    assert.equal(body.ok, false);
    assert.equal(body.code, 'METHOD_NOT_ALLOWED');
});

test('submit-nps returns 204 for OPTIONS preflight', async (t) => {
    t.after(restore);
    setOdooEnv();

    const response = await handler(buildRequest({}, { method: 'OPTIONS' }));

    assert.equal(response.status, 204);
});

// ─── JSON parse error ────────────────────────────────────────────────────────

test('submit-nps returns 400 VALIDATION_ERROR for malformed JSON body', async (t) => {
    t.after(restore);
    setOdooEnv();
    global.fetch = createOdooMock().fetch;

    const response = await handler(buildRequest('{ not valid json', { headers: { 'x-real-ip': '127.0.0.1' } }));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 400);
    assert.equal(body.ok, false);
    assert.equal(body.code, 'VALIDATION_ERROR');
});

// ─── Validation errors ───────────────────────────────────────────────────────

test('submit-nps returns 400 for missing firstname', async (t) => {
    t.after(restore);
    setOdooEnv();
    global.fetch = createOdooMock().fetch;

    const response = await handler(buildRequest(validBody({ firstname: '' })));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 400);
    assert.equal(body.ok, false);
    assert.equal(body.code, 'VALIDATION_ERROR');
});

test('submit-nps returns 400 for firstname over 100 characters', async (t) => {
    t.after(restore);
    setOdooEnv();
    global.fetch = createOdooMock().fetch;

    const response = await handler(buildRequest(validBody({ firstname: 'A'.repeat(101) })));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
});

test('submit-nps returns 400 for invalid email', async (t) => {
    t.after(restore);
    setOdooEnv();
    global.fetch = createOdooMock().fetch;

    const response = await handler(buildRequest(validBody({ email: 'not-an-email' })));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
});

test('submit-nps returns 400 for score below 0', async (t) => {
    t.after(restore);
    setOdooEnv();
    global.fetch = createOdooMock().fetch;

    const response = await handler(buildRequest(validBody({ score: -1 })));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
});

test('submit-nps returns 400 for score above 10', async (t) => {
    t.after(restore);
    setOdooEnv();
    global.fetch = createOdooMock().fetch;

    const response = await handler(buildRequest(validBody({ score: 11 })));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
});

test('submit-nps returns 400 for non-integer score', async (t) => {
    t.after(restore);
    setOdooEnv();
    global.fetch = createOdooMock().fetch;

    const response = await handler(buildRequest(validBody({ score: 7.5 })));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
});

test('submit-nps returns 400 for non-numeric score', async (t) => {
    t.after(restore);
    setOdooEnv();
    global.fetch = createOdooMock().fetch;

    const response = await handler(buildRequest(validBody({ score: '9' })));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
});

test('submit-nps accepts empty reason', async (t) => {
    t.after(restore);
    setOdooEnv();
    global.fetch = createOdooMock().fetch;

    const response = await handler(buildRequest(validBody({ reason: '' })));
    assert.equal(response.status, 201);
});

test('submit-nps writes a clean comment when reason is empty', async (t) => {
    t.after(restore);
    setOdooEnv();
    const mock = createOdooMock();
    global.fetch = mock.fetch;

    const response = await handler(buildRequest(validBody({ reason: '', highlight: '' })));
    assert.equal(response.status, 201);

    const partner = mock.partnerFields()!;
    assert.match(String(partner.comment), /NPS 9\/10/);
    assert.doesNotMatch(String(partner.comment), /—\s*$/);
});

test('submit-nps returns 400 for reason over 2000 characters', async (t) => {
    t.after(restore);
    setOdooEnv();
    global.fetch = createOdooMock().fetch;

    const response = await handler(buildRequest(validBody({ reason: 'x'.repeat(2001) })));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
});

test('submit-nps returns 400 for highlight over 2000 characters', async (t) => {
    t.after(restore);
    setOdooEnv();
    global.fetch = createOdooMock().fetch;

    const response = await handler(buildRequest(validBody({ highlight: 'x'.repeat(2001) })));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
});

// ─── Success path — new partner ──────────────────────────────────────────────

test('submit-nps creates a res.partner with x_nps_score and NO crm.lead when no match exists', async (t) => {
    t.after(restore);
    setOdooEnv();
    global.fetch = createOdooMock({ newPartnerId: 909 }).fetch;

    const response = await handler(buildRequest(validBody()));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 201);
    assert.equal(body.ok, true);
    assert.equal(body.message, 'Avaliação registrada com sucesso.');
    assert.ok(typeof body.requestId === 'string' && body.requestId.length > 0);
});

test('submit-nps accepts score 0 (boundary)', async (t) => {
    t.after(restore);
    setOdooEnv();
    global.fetch = createOdooMock().fetch;

    const response = await handler(buildRequest(validBody({ score: 0 })));
    assert.equal(response.status, 201);
});

test('submit-nps accepts score 10 (boundary)', async (t) => {
    t.after(restore);
    setOdooEnv();
    global.fetch = createOdooMock().fetch;

    const response = await handler(buildRequest(validBody({ score: 10 })));
    assert.equal(response.status, 201);
});

test('submit-nps accepts empty highlight (optional field)', async (t) => {
    t.after(restore);
    setOdooEnv();
    global.fetch = createOdooMock().fetch;

    const response = await handler(buildRequest(validBody({ highlight: '' })));
    assert.equal(response.status, 201);
});

// ─── res.partner field mapping ───────────────────────────────────────────────

test('submit-nps writes x_nps_score and a comment with reason/highlight on the partner', async (t) => {
    t.after(restore);
    setOdooEnv();
    const mock = createOdooMock();
    global.fetch = mock.fetch;

    const response = await handler(buildRequest(validBody()));
    assert.equal(response.status, 201);

    assert.equal(mock.createdLead(), false, 'NPS is post-sale — no opportunity is created');
    const partner = mock.partnerFields()!;
    assert.equal(partner.email, 'maria@example.com');
    assert.equal(partner.x_nps_score, 9);
    assert.match(String(partner.comment), /NPS 9\/10 — Atendimento excelente e viagem perfeita\./);
    assert.match(String(partner.comment), /Momento marcante: A visita às Cataratas do Iguaçu\./);
});

test('submit-nps escapes angle brackets from free text before writing the partner comment', async (t) => {
    t.after(restore);
    setOdooEnv();
    const mock = createOdooMock();
    global.fetch = mock.fetch;

    const response = await handler(buildRequest(validBody({
        firstname: 'Ana <b>',
        reason: '<script>alert(1)</script>',
        highlight: '<img src=x onerror=alert(2)>',
    })));
    assert.equal(response.status, 201);

    const partner = mock.partnerFields()!;
    const comment = String(partner.comment);
    assert.equal(comment.includes('<'), false, 'comment must not contain raw angle brackets');
    assert.equal(comment.includes('>'), false, 'comment must not contain raw angle brackets');
    assert.match(comment, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
    assert.match(comment, /&lt;img src=x onerror=alert\(2\)&gt;/);
    assert.equal(String(partner.name).includes('<'), false, 'partner name must be escaped too');
});

test('submit-nps does NOT overwrite the full name of an existing partner (firstname-only form)', async (t) => {
    t.after(restore);
    setOdooEnv();
    const mock = createOdooMock({ existingPartnerId: 506 });
    global.fetch = mock.fetch;

    const response = await handler(buildRequest(validBody({ firstname: 'Ana' })));
    assert.equal(response.status, 201);

    const writeCall = mock.calls.find((c) => c.model === 'res.partner' && c.method === 'write');
    assert.ok(writeCall, 'expected a res.partner write for the existing match');
    const updateFields = writeCall!.args[1] as Record<string, unknown>;
    assert.equal('name' in updateFields, false, 'name must be omitted so it is not clobbered to the bare firstname');
    assert.equal(updateFields.x_nps_score, 9);
});

test('submit-nps sets name on create when no existing partner matches', async (t) => {
    t.after(restore);
    setOdooEnv();
    const mock = createOdooMock({ existingPartnerId: null });
    global.fetch = mock.fetch;

    const response = await handler(buildRequest(validBody({ firstname: 'Ana' })));
    assert.equal(response.status, 201);

    const createCall = mock.calls.find((c) => c.model === 'res.partner' && c.method === 'create');
    assert.ok(createCall, 'expected a res.partner create when no match exists');
    const fields = createCall!.args[0] as Record<string, unknown>;
    assert.equal(fields.name, 'Ana');
});

// ─── Upstream failure ─────────────────────────────────────────────────────────

test('submit-nps returns 502 ODOO_ERROR when upstream returns non-2xx', async (t) => {
    t.after(restore);
    setOdooEnv();
    global.fetch = createOdooMock({ failStatus: 503 }).fetch;

    const response = await handler(buildRequest(validBody()));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 502);
    assert.equal(body.ok, false);
    assert.equal(body.code, 'ODOO_ERROR');
});

test('classifySubmitNpsError preserves unexpected internal failures', () => {
    const classified = classifySubmitNpsError(new Error('unexpected database failure'));
    assert.equal(classified.code, 'INTERNAL_ERROR');
    assert.equal(classified.status, 500);
    assert.equal(classified.error, 'Erro interno. Tente novamente.');
});

// ─── Rate limiting ────────────────────────────────────────────────────────────

test('submit-nps enforces rate limit after 3 requests from the same IP', async (t) => {
    t.after(restore);
    setOdooEnv();
    global.fetch = createOdooMock().fetch;

    const uniqueIp = `10.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}.1`;

    function buildRateLimitRequest() {
        return new Request('http://localhost/api/submit-nps', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-real-ip': uniqueIp,
            },
            body: JSON.stringify(validBody()),
        });
    }

    const r1 = await handler(buildRateLimitRequest());
    const r2 = await handler(buildRateLimitRequest());
    const r3 = await handler(buildRateLimitRequest());
    const r4 = await handler(buildRateLimitRequest());

    assert.equal(r1.status, 201, 'first request should succeed');
    assert.equal(r2.status, 201, 'second request should succeed');
    assert.equal(r3.status, 201, 'third request should succeed');
    assert.equal(r4.status, 429, 'fourth request should be rate limited');

    const body4 = await r4.json() as Record<string, unknown>;
    assert.equal(body4.ok, false);
    assert.equal(body4.code, 'RATE_LIMIT_EXCEEDED');
    assert.ok(r4.headers.get('Retry-After'), 'Retry-After header should be set');
    assert.ok(r4.headers.get('X-RateLimit-Remaining'), 'X-RateLimit-Remaining header should be set');
});

test('submit-nps enforces rate-limit even for invalid payloads (DoS protection)', async (t) => {
    t.after(restore);
    setOdooEnv();
    global.fetch = createOdooMock().fetch;

    const uniqueIp = `10.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}.4`;

    function buildFixedRequest(body: unknown, valid: boolean) {
        return new Request('http://localhost/api/submit-nps', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-real-ip': uniqueIp,
            },
            body: JSON.stringify(valid ? validBody() : body),
        });
    }

    // 3 invalid requests should consume the bucket (limit is 3)
    for (let i = 0; i < 3; i++) {
        const r = await handler(buildFixedRequest({ score: 'not-a-number' }, false));
        assert.equal(r.status, 400);
    }

    // 4th request should be rate limited, even if it would be valid
    const limitResponse = await handler(buildFixedRequest(null, true));
    assert.equal(limitResponse.status, 429, 'should be rate limited after 3 invalid attempts');
});
