import test from 'node:test';
import assert from 'node:assert/strict';

import { handleCreateProposal } from '../api/create-proposal.ts';
import { handleProposalRequest } from '../lib/proposal-page.ts';
import { opensKey } from '../lib/proposal-opens.ts';
import { isProposalPreviewRequest } from '../lib/proposal-preview.ts';
import { loadProposal, type ProposalRedis } from '../lib/proposal-store.ts';
import { createFakeProposalRedis } from './helpers/fake-proposal-redis.ts';

// Issue #1899: the sales bot creates a proposal and gets back the customer
// link and the signed internal preview link.

const API_SECRET = 'test-proposal-api-secret';
const PREVIEW_SECRET = 'test-proposal-preview-secret';
const ENDPOINT = 'https://www.anhanga.tur.br/api/create-proposal';
// Built at runtime so no token-looking literal sits in the repo (GitGuardian).
const FAKE_TOKEN = Buffer.from(`RCA | 7654321 | ${'0'.repeat(32)}`).toString('base64');
const OPERATOR_LINK = `https://premium.infotravel.com.br/orcamento-web/pt/link?token=${FAKE_TOKEN}&shouldShowPay=true`;
const SENT_LINK = `https://premium.infotravel.com.br/orcamento-web/pt/link?token=${FAKE_TOKEN}&shouldShowPay=false`;
const LEAD_ID = 987654321;
const DAY_MS = 24 * 60 * 60 * 1000;

let ipCounter = 0;

function withSecrets(t: { after: (fn: () => void) => void }, secrets: { api?: string; preview?: string } = {}) {
    const saved = { api: process.env.PROPOSAL_API_SECRET, preview: process.env.PROPOSAL_PREVIEW_SECRET };
    const apply = (name: string, value: string | undefined) => {
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
    };
    apply('PROPOSAL_API_SECRET', 'api' in secrets ? secrets.api : API_SECRET);
    apply('PROPOSAL_PREVIEW_SECRET', 'preview' in secrets ? secrets.preview : PREVIEW_SECRET);
    t.after(() => {
        apply('PROPOSAL_API_SECRET', saved.api);
        apply('PROPOSAL_PREVIEW_SECRET', saved.preview);
    });
}

function setup() {
    const clock = { now: Date.UTC(2026, 9, 22, 15, 30) };
    const fake = createFakeProposalRedis(clock);
    return { clock, ...fake, deps: { redis: fake.redis, now: () => clock.now } };
}

function create(
    body: unknown,
    options: { auth?: string | null; method?: string; ip?: string } = {},
): Request {
    const headers = new Headers({ 'content-type': 'application/json' });
    // A fresh IP per request keeps the rate limiter out of unrelated tests.
    headers.set('cf-connecting-ip', options.ip ?? `198.51.100.${(ipCounter += 1) % 250}`);
    const auth = options.auth === undefined ? `Bearer ${API_SECRET}` : options.auth;
    if (auth !== null) headers.set('authorization', auth);
    const method = options.method ?? 'POST';
    return new Request(ENDPOINT, {
        method,
        headers,
        body: method === 'GET' || method === 'HEAD' ? undefined : JSON.stringify(body),
    });
}

const VALID_BODY = { type: 'redirect', redirectUrl: OPERATOR_LINK, leadId: LEAD_ID };

function writesNothing(): { redis: ProposalRedis; writes: () => number } {
    let count = 0;
    return {
        redis: {
            set: async () => {
                count += 1;
                return 'OK';
            },
            mget: async () => [],
        },
        writes: () => count,
    };
}

test('a valid request creates a redirect proposal and returns the customer and preview links', async (t) => {
    withSecrets(t);
    const { deps, clock } = setup();

    const response = await handleCreateProposal(create(VALID_BODY), deps);

    assert.equal(response.status, 201);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
    const body = await response.json();
    assert.equal(body.ok, true);
    const { id, url, previewUrl, expiresAt } = body.data;
    assert.equal(url, `https://www.anhanga.tur.br/proposta/${id}`);
    assert.match(previewUrl, new RegExp(`^${url.replace(/[.?]/g, '\\$&')}\\?previa=[\\w-]+$`));
    assert.equal(expiresAt, new Date(clock.now + 15 * DAY_MS).toISOString());

    const stored = await loadProposal(id, deps);
    assert.equal(stored.status, 'active');
    assert.equal(stored.status === 'active' && stored.proposal.leadId, LEAD_ID);
});

test('the returned link redirects the customer, and the preview link is recognized and not counted', async (t) => {
    withSecrets(t);
    const { deps, listOf } = setup();
    const { data } = await (await handleCreateProposal(create(VALID_BODY), deps)).json();

    const customer = await handleProposalRequest(
        new Request(data.url, { headers: { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1' } }),
        data.id,
        deps,
    );
    assert.equal(customer.status, 302);
    // D7: the operator's payment button is turned off.
    assert.equal(customer.headers.get('Location'), SENT_LINK);
    assert.equal(listOf(opensKey(data.id)).length, 1);

    assert.equal(await isProposalPreviewRequest(new Request(data.previewUrl), data.id), true);
    await handleProposalRequest(new Request(data.previewUrl, { headers: { 'user-agent': 'Mozilla/5.0' } }), data.id, deps);
    assert.equal(listOf(opensKey(data.id)).length, 1);
});

test('the links always point at production, whatever host received the request', async (t) => {
    withSecrets(t);
    const { deps } = setup();
    const request = new Request('https://abc123.anhanga-site.pages.dev/api/create-proposal', {
        method: 'POST',
        headers: { authorization: `Bearer ${API_SECRET}`, 'cf-connecting-ip': '198.51.100.251' },
        body: JSON.stringify(VALID_BODY),
    });

    const { data } = await (await handleCreateProposal(request, deps)).json();

    assert.ok(data.url.startsWith('https://www.anhanga.tur.br/proposta/'));
    assert.ok(data.previewUrl.startsWith('https://www.anhanga.tur.br/proposta/'));
});

test('a shorter validity is honored; a longer one than 15 days (D5) is refused', async (t) => {
    withSecrets(t);
    const { deps, clock } = setup();

    const short = await (await handleCreateProposal(create({ ...VALID_BODY, validityDays: 3 }), deps)).json();
    assert.equal(short.data.expiresAt, new Date(clock.now + 3 * DAY_MS).toISOString());

    for (const validityDays of [16, 0, 1.5, '3']) {
        const response = await handleCreateProposal(create({ ...VALID_BODY, validityDays }), deps);
        assert.equal(response.status, 400, String(validityDays));
        assert.equal((await response.json()).code, 'VALIDATION_ERROR');
    }
});

test('a request without the bot secret, or with a wrong one, is refused with 401', async (t) => {
    withSecrets(t);
    const store = writesNothing();

    for (const auth of [null, '', `Bearer ${API_SECRET}x`, API_SECRET, `Basic ${API_SECRET}`, 'Bearer ']) {
        const response = await handleCreateProposal(create(VALID_BODY, { auth }), { redis: store.redis });
        assert.equal(response.status, 401, String(auth));
        assert.equal((await response.json()).code, 'UNAUTHORIZED');
    }
    assert.equal(store.writes(), 0);
});

test('the endpoint refuses to run without either secret configured, before any write', async (t) => {
    for (const secrets of [{ api: undefined }, { preview: undefined }, { api: '  ' }]) {
        await t.test(JSON.stringify(secrets), async (st) => {
            withSecrets(st, secrets);
            const store = writesNothing();

            const response = await handleCreateProposal(create(VALID_BODY), { redis: store.redis });

            assert.equal(response.status, 500);
            assert.equal((await response.json()).code, 'CONFIG_ERROR');
            assert.equal(store.writes(), 0);
        });
    }
});

test('only POST is accepted', async (t) => {
    withSecrets(t);
    for (const method of ['GET', 'PUT', 'DELETE', 'OPTIONS']) {
        const response = await handleCreateProposal(create(VALID_BODY, { method }));
        assert.equal(response.status, 405, method);
        assert.equal(response.headers.get('Allow'), 'POST');
    }
});

test('an operator link outside the allowlist is refused and nothing is stored', async (t) => {
    withSecrets(t);
    const store = writesNothing();

    for (const redirectUrl of ['https://evil.example/x', 'http://premium.infotravel.com.br/orcamento-web/pt/link', 'javascript:alert(1)']) {
        const response = await handleCreateProposal(create({ ...VALID_BODY, redirectUrl }), { redis: store.redis });
        assert.equal(response.status, 400, redirectUrl);
        assert.equal((await response.json()).code, 'REDIRECT_NOT_ALLOWED');
    }
    assert.equal(store.writes(), 0);
});

test('malformed bodies and types not yet supported are refused', async (t) => {
    withSecrets(t);
    const store = writesNothing();

    for (const body of [
        { ...VALID_BODY, type: 'aerea' },
        { ...VALID_BODY, type: undefined },
        { ...VALID_BODY, leadId: undefined },
        { ...VALID_BODY, leadId: -1 },
        { ...VALID_BODY, leadId: '987654321' },
        { ...VALID_BODY, extra: 'x' },
        [],
        'x',
    ]) {
        const response = await handleCreateProposal(create(body), { redis: store.redis });
        assert.equal(response.status, 400, JSON.stringify(body));
        assert.equal((await response.json()).code, 'VALIDATION_ERROR');
    }

    const invalidJson = new Request(ENDPOINT, {
        method: 'POST',
        headers: { authorization: `Bearer ${API_SECRET}`, 'cf-connecting-ip': '198.51.100.252' },
        body: '{not json',
    });
    assert.equal((await handleCreateProposal(invalidJson, { redis: store.redis })).status, 400);
    assert.equal(store.writes(), 0);
});

test('the endpoint is rate limited per client', async (t) => {
    withSecrets(t);
    // Keep the limiter in memory: never send test traffic to a real Upstash.
    const upstash = { url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN };
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    t.after(() => {
        if (upstash.url !== undefined) process.env.UPSTASH_REDIS_REST_URL = upstash.url;
        if (upstash.token !== undefined) process.env.UPSTASH_REDIS_REST_TOKEN = upstash.token;
    });
    const { deps } = setup();
    const ip = '203.0.113.77';

    const statuses: number[] = [];
    for (let attempt = 0; attempt < 31; attempt += 1) {
        statuses.push((await handleCreateProposal(create(VALID_BODY, { ip }), deps)).status);
    }

    assert.deepEqual(statuses.slice(0, 30), Array(30).fill(201));
    assert.equal(statuses[30], 429);
    const limited = await handleCreateProposal(create(VALID_BODY, { ip }), deps);
    assert.equal((await limited.json()).code, 'RATE_LIMIT_EXCEEDED');
    assert.ok(Number(limited.headers.get('Retry-After')) > 0);
});

test('a storage failure answers 503 without leaking the id or the operator link to the logs', async (t) => {
    withSecrets(t);
    const logged: string[] = [];
    for (const method of ['log', 'info', 'warn', 'error'] as const) {
        t.mock.method(console, method, (...args: unknown[]) => {
            logged.push(args.map((arg) => JSON.stringify(arg) ?? String(arg)).join(' '));
        });
    }
    const failing: ProposalRedis = {
        set: async (key: string) => {
            throw new Error(`command was: ["set","${key}"]`);
        },
        mget: async () => [],
    };

    const response = await handleCreateProposal(create(VALID_BODY), { redis: failing });

    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, 'STORE_UNAVAILABLE');
    const output = logged.join('\n');
    assert.ok(!output.includes('proposta:'), 'the Redis key (and so the id) must not be logged');
    assert.ok(!output.includes(FAKE_TOKEN));
});

test('logs of a created or refused proposal carry no id, token, lead id or operator host', async (t) => {
    withSecrets(t);
    const logged: string[] = [];
    for (const method of ['log', 'info', 'warn', 'error'] as const) {
        t.mock.method(console, method, (...args: unknown[]) => {
            logged.push(args.map((arg) => JSON.stringify(arg) ?? String(arg)).join(' '));
        });
    }
    const { deps } = setup();

    const { data } = await (await handleCreateProposal(create(VALID_BODY), deps)).json();
    await handleCreateProposal(create({ ...VALID_BODY, leadId: 'x' }), deps);
    await handleCreateProposal(create({ ...VALID_BODY, redirectUrl: `https://evil.example/?token=${FAKE_TOKEN}` }), deps);

    const output = logged.join('\n');
    assert.ok(output.includes('CREATE_PROPOSAL'), 'the stages are logged');
    for (const secret of [data.id, FAKE_TOKEN, String(LEAD_ID), 'infotravel', 'evil.example']) {
        assert.ok(!output.includes(secret), `logs must not contain ${secret}`);
    }
});
