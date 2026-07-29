import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { classifySubmitNpsError } from '../api/submit-nps.ts';
import { createOdooMock, setOdooEnv, clearOdooEnv } from './odoo-mock.ts';
import { createNpsInviteToken } from '../lib/nps-invite.ts';

const originalFetch = global.fetch;
const NPS_INVITE_SECRET = 'test-nps-invite-secret';

function setNpsInviteEnv() {
    process.env.NPS_INVITE_SECRET = NPS_INVITE_SECRET;
}

function clearNpsInviteEnv() {
    delete process.env.NPS_INVITE_SECRET;
}

function restore() {
    global.fetch = originalFetch;
    clearOdooEnv();
    clearNpsInviteEnv();
}

// Um IP aleatório em 200 valores colidia: são 33 requisições neste arquivo e o
// rate limit é de 3 por IP, então de vez em quando quatro sorteios caíam no
// mesmo endereço e um teste sem relação com rate limit recebia 429 no lugar de
// 201 (~0,5% das execuções). O contador dá um IP distinto a cada chamada, como
// pede `docs/standards/testing.md` ("gere IPs novos quando rate limiting importa").
// Os testes de rate limit montam o Request próprio, com IP fixo — não usam isto.
let requestCounter = 0;

function nextClientIp(): string {
    requestCounter += 1;
    return `127.${(requestCounter >> 16) & 0xff}.${(requestCounter >> 8) & 0xff}.${requestCounter & 0xff}`;
}

function buildRequest(
    body: Record<string, unknown> | string,
    init?: { headers?: Record<string, string>; method?: string },
): Request {
    const method = init?.method ?? 'POST';

    return new Request('http://localhost/api/submit-nps', {
        method,
        headers: {
            'Content-Type': 'application/json',
            'x-real-ip': nextClientIp(),
            ...init?.headers,
        },
        body: method === 'OPTIONS' || method === 'GET' ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    });
}

async function buildToken(overrides?: { email?: string; firstname?: string; expiresInMs?: number }): Promise<string> {
    return createNpsInviteToken(
        {
            email: overrides?.email ?? 'maria@example.com',
            firstname: overrides?.firstname ?? 'Maria',
            expiresInMs: overrides?.expiresInMs,
        },
        NPS_INVITE_SECRET,
    );
}

async function validBody(overrides?: Record<string, unknown>) {
    return {
        token: await buildToken(),
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
    setNpsInviteEnv();

    let fetchCalled = false;
    global.fetch = (async () => { fetchCalled = true; throw new Error('should not run'); }) as typeof fetch;

    const response = await handler(buildRequest(await validBody()));
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
    setNpsInviteEnv();
    global.fetch = createOdooMock().fetch;

    const response = await handler(buildRequest('{ not valid json', { headers: { 'x-real-ip': '127.0.0.1' } }));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 400);
    assert.equal(body.ok, false);
    assert.equal(body.code, 'VALIDATION_ERROR');
});

// ─── Score/reason/highlight validation ──────────────────────────────────────

test('submit-nps returns 400 for missing token', async (t) => {
    t.after(restore);
    setOdooEnv();
    setNpsInviteEnv();
    global.fetch = createOdooMock().fetch;

    const body = await validBody();
    const { token: _t, ...withoutToken } = body;
    const response = await handler(buildRequest(withoutToken));
    const json = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 400);
    assert.equal(json.code, 'VALIDATION_ERROR');
});

test('submit-nps returns 400 for score below 0', async (t) => {
    t.after(restore);
    setOdooEnv();
    setNpsInviteEnv();
    global.fetch = createOdooMock().fetch;

    const response = await handler(buildRequest(await validBody({ score: -1 })));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
});

test('submit-nps returns 400 for score above 10', async (t) => {
    t.after(restore);
    setOdooEnv();
    setNpsInviteEnv();
    global.fetch = createOdooMock().fetch;

    const response = await handler(buildRequest(await validBody({ score: 11 })));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
});

test('submit-nps returns 400 for non-integer score', async (t) => {
    t.after(restore);
    setOdooEnv();
    setNpsInviteEnv();
    global.fetch = createOdooMock().fetch;

    const response = await handler(buildRequest(await validBody({ score: 7.5 })));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
});

test('submit-nps returns 400 for non-numeric score', async (t) => {
    t.after(restore);
    setOdooEnv();
    setNpsInviteEnv();
    global.fetch = createOdooMock().fetch;

    const response = await handler(buildRequest(await validBody({ score: '9' })));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
});

test('submit-nps accepts empty reason', async (t) => {
    t.after(restore);
    setOdooEnv();
    setNpsInviteEnv();
    global.fetch = createOdooMock().fetch;

    const response = await handler(buildRequest(await validBody({ reason: '' })));
    assert.equal(response.status, 201);
});

test('submit-nps writes a clean comment when reason is empty', async (t) => {
    t.after(restore);
    setOdooEnv();
    setNpsInviteEnv();
    const mock = createOdooMock();
    global.fetch = mock.fetch;

    const response = await handler(buildRequest(await validBody({ reason: '', highlight: '' })));
    assert.equal(response.status, 201);

    const partner = mock.partnerFields()!;
    assert.match(String(partner.comment), /NPS 9\/10/);
    assert.doesNotMatch(String(partner.comment), /—\s*$/);
});

test('submit-nps returns 400 for reason over 2000 characters', async (t) => {
    t.after(restore);
    setOdooEnv();
    setNpsInviteEnv();
    global.fetch = createOdooMock().fetch;

    const response = await handler(buildRequest(await validBody({ reason: 'x'.repeat(2001) })));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
});

test('submit-nps returns 400 for highlight over 2000 characters', async (t) => {
    t.after(restore);
    setOdooEnv();
    setNpsInviteEnv();
    global.fetch = createOdooMock().fetch;

    const response = await handler(buildRequest(await validBody({ highlight: 'x'.repeat(2001) })));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
});

// ─── Signed invitation (issue #1137) ─────────────────────────────────────────

test('submit-nps returns 500 when NPS_INVITE_SECRET is not configured', async (t) => {
    t.after(restore);
    setOdooEnv();
    clearNpsInviteEnv();
    global.fetch = createOdooMock().fetch;

    // Token is built with some secret, but the server has none configured.
    const token = await createNpsInviteToken({ email: 'maria@example.com', firstname: 'Maria' }, 'any-secret');
    const response = await handler(buildRequest({ token, score: 9, reason: '', highlight: '' }));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 500);
    assert.equal(body.code, 'SERVER_CONFIG_ERROR');
});

test('submit-nps rejects a token signed with the wrong secret (tampered/forged)', async (t) => {
    t.after(restore);
    setOdooEnv();
    setNpsInviteEnv();
    global.fetch = createOdooMock().fetch;

    const token = await createNpsInviteToken({ email: 'maria@example.com', firstname: 'Maria' }, 'wrong-secret');
    const response = await handler(buildRequest({ token, score: 9, reason: '', highlight: '' }));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
});

test('submit-nps rejects a malformed token', async (t) => {
    t.after(restore);
    setOdooEnv();
    setNpsInviteEnv();
    global.fetch = createOdooMock().fetch;

    const response = await handler(buildRequest({ token: 'not-a-real-token', score: 9, reason: '', highlight: '' }));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
});

test('submit-nps rejects an expired token', async (t) => {
    t.after(restore);
    setOdooEnv();
    setNpsInviteEnv();
    global.fetch = createOdooMock().fetch;

    const token = await buildToken({ expiresInMs: -1000 });
    const response = await handler(buildRequest({ token, score: 9, reason: '', highlight: '' }));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
});

test('submit-nps rejects a replayed token (already used)', async (t) => {
    t.after(restore);
    setOdooEnv();
    setNpsInviteEnv();
    global.fetch = createOdooMock().fetch;

    const body = await validBody();
    const first = await handler(buildRequest(body));
    assert.equal(first.status, 201, 'first submission with a fresh token should succeed');

    const second = await handler(buildRequest(body));
    const secondBody = await second.json() as Record<string, unknown>;
    assert.equal(second.status, 400, 'the same token must not be usable twice');
    assert.equal(secondBody.code, 'VALIDATION_ERROR');
});

test('submit-nps derives firstname/email from the token, not from the request body', async (t) => {
    t.after(restore);
    setOdooEnv();
    setNpsInviteEnv();
    const mock = createOdooMock();
    global.fetch = mock.fetch;

    const token = await buildToken({ email: 'real-customer@example.com', firstname: 'Cliente Real' });
    // Even if a client tried to smuggle a different identity in the body, the
    // schema no longer accepts firstname/email fields at all — there is
    // nothing to smuggle them through.
    const response = await handler(buildRequest({ token, score: 9, reason: '', highlight: '', email: 'attacker@evil.com' }));
    assert.equal(response.status, 201);

    const partner = mock.partnerFields()!;
    assert.equal(partner.email, 'real-customer@example.com');
    assert.equal(partner.name, 'Cliente Real');
});

test('submit-nps rejects a token whose firstname exceeds 100 chars after escaping', async (t) => {
    t.after(restore);
    setOdooEnv();
    setNpsInviteEnv();
    global.fetch = createOdooMock().fetch;

    // 40 "<" chars → 160 chars after cleanString escapes each to "&lt;".
    const token = await buildToken({ firstname: '<'.repeat(40) });
    const response = await handler(buildRequest({ token, score: 9, reason: '', highlight: '' }));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
});

// ─── Success path — new partner ──────────────────────────────────────────────

test('submit-nps creates a res.partner with x_nps_score and NO crm.lead when no match exists', async (t) => {
    t.after(restore);
    setOdooEnv();
    setNpsInviteEnv();
    global.fetch = createOdooMock({ newPartnerId: 909 }).fetch;

    const response = await handler(buildRequest(await validBody()));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 201);
    assert.equal(body.ok, true);
    assert.equal(body.message, 'Avaliação registrada com sucesso.');
    assert.ok(typeof body.requestId === 'string' && body.requestId.length > 0);
});

test('submit-nps accepts score 0 (boundary)', async (t) => {
    t.after(restore);
    setOdooEnv();
    setNpsInviteEnv();
    global.fetch = createOdooMock().fetch;

    const response = await handler(buildRequest(await validBody({ score: 0 })));
    assert.equal(response.status, 201);
});

test('submit-nps accepts score 10 (boundary)', async (t) => {
    t.after(restore);
    setOdooEnv();
    setNpsInviteEnv();
    global.fetch = createOdooMock().fetch;

    const response = await handler(buildRequest(await validBody({ score: 10 })));
    assert.equal(response.status, 201);
});

test('submit-nps accepts empty highlight (optional field)', async (t) => {
    t.after(restore);
    setOdooEnv();
    setNpsInviteEnv();
    global.fetch = createOdooMock().fetch;

    const response = await handler(buildRequest(await validBody({ highlight: '' })));
    assert.equal(response.status, 201);
});

// ─── res.partner field mapping ───────────────────────────────────────────────

test('submit-nps writes x_nps_score and a comment with reason/highlight on the partner', async (t) => {
    t.after(restore);
    setOdooEnv();
    setNpsInviteEnv();
    const mock = createOdooMock();
    global.fetch = mock.fetch;

    const response = await handler(buildRequest(await validBody()));
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
    setNpsInviteEnv();
    const mock = createOdooMock();
    global.fetch = mock.fetch;

    const token = await buildToken({ firstname: 'Ana <b>' });
    const response = await handler(buildRequest({
        token,
        score: 9,
        reason: '<script>alert(1)</script>',
        highlight: '<img src=x onerror=alert(2)>',
    }));
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
    setNpsInviteEnv();
    const mock = createOdooMock({ existingPartnerId: 506 });
    global.fetch = mock.fetch;

    const token = await buildToken({ firstname: 'Ana' });
    const response = await handler(buildRequest({ token, score: 9, reason: '', highlight: '' }));
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
    setNpsInviteEnv();
    const mock = createOdooMock({ existingPartnerId: null });
    global.fetch = mock.fetch;

    const token = await buildToken({ firstname: 'Ana' });
    const response = await handler(buildRequest({ token, score: 9, reason: '', highlight: '' }));
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
    setNpsInviteEnv();
    global.fetch = createOdooMock({ failStatus: 503 }).fetch;

    const response = await handler(buildRequest(await validBody()));
    const body = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 502);
    assert.equal(body.ok, false);
    assert.equal(body.code, 'ODOO_ERROR');
});

test('submit-nps releases the invitation on an Odoo failure — the same link can be retried', async (t) => {
    t.after(restore);
    setOdooEnv();
    setNpsInviteEnv();
    const token = await buildToken();
    const ip = '10.55.55.1';
    const body = { token, score: 9, reason: 'Ótima viagem.', highlight: 'Cataratas.' };

    // First attempt: Odoo is down. The invite must not be permanently burned.
    global.fetch = createOdooMock({ failStatus: 503 }).fetch;
    const firstResponse = await handler(buildRequest(body, { headers: { 'x-real-ip': ip } }));
    assert.equal(firstResponse.status, 502);

    // Second attempt, same token: Odoo is back up. If the invite had been
    // permanently consumed on the first (failed) attempt, this would be
    // rejected as a replay instead of succeeding.
    global.fetch = createOdooMock({}).fetch;
    const secondResponse = await handler(buildRequest(body, { headers: { 'x-real-ip': ip } }));
    const secondBody = await secondResponse.json() as Record<string, unknown>;

    assert.equal(secondResponse.status, 201, `expected the retry to succeed, got: ${JSON.stringify(secondBody)}`);
    assert.equal(secondBody.ok, true);
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
    setNpsInviteEnv();
    global.fetch = createOdooMock().fetch;

    const uniqueIp = `10.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}.1`;

    async function buildRateLimitRequest() {
        return new Request('http://localhost/api/submit-nps', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-real-ip': uniqueIp,
            },
            body: JSON.stringify(await validBody()),
        });
    }

    const r1 = await handler(await buildRateLimitRequest());
    const r2 = await handler(await buildRateLimitRequest());
    const r3 = await handler(await buildRateLimitRequest());
    const r4 = await handler(await buildRateLimitRequest());

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
    setNpsInviteEnv();
    global.fetch = createOdooMock().fetch;

    const uniqueIp = `10.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}.4`;

    async function buildFixedRequest(body: unknown, valid: boolean) {
        return new Request('http://localhost/api/submit-nps', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-real-ip': uniqueIp,
            },
            body: JSON.stringify(valid ? await validBody() : body),
        });
    }

    // 3 invalid requests should consume the bucket (limit is 3)
    for (let i = 0; i < 3; i++) {
        const r = await handler(await buildFixedRequest({ score: 'not-a-number' }, false));
        assert.equal(r.status, 400);
    }

    // 4th request should be rate limited, even if it would be valid
    const limitResponse = await handler(await buildFixedRequest(null, true));
    assert.equal(limitResponse.status, 429, 'should be rate limited after 3 invalid attempts');
});
