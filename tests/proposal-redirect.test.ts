import test from 'node:test';
import assert from 'node:assert/strict';

import { handleProposalRequest } from '../lib/proposal-page.ts';
import { opensKey, type ProposalOpensRedis } from '../lib/proposal-opens.ts';
import { createProposalPreviewSignature } from '../lib/proposal-preview.ts';
import { parseAllowedRedirectUrl } from '../lib/proposal-redirect.ts';
import { createProposalId, saveProposal } from '../lib/proposal-store.ts';
import { createFakeProposalRedis } from './helpers/fake-proposal-redis.ts';

// Issue #1896: a `redirect` proposal records the open and answers 302 to the
// operator's page, only for allowlisted hosts (no open redirect).

const ORIGIN = 'https://www.anhanga.tur.br';
// Shape of a real Infotravel (RCA) proposal link. The token is base64 of
// "RCA | <booking> | <hash>"; built at runtime from a fake booking so no
// token-looking literal sits in the repo (secret scanners flag those).
const FAKE_TOKEN = Buffer.from(`RCA | 1234567 | ${'0'.repeat(32)}`).toString('base64');
const OPERATOR_LINK = `https://premium.infotravel.com.br/orcamento-web/pt/link?token=${FAKE_TOKEN}&shouldShowPay=true`;
// What the customer is sent to: same link, operator payment button off (D7).
const INFOTRAVEL_URL = `https://premium.infotravel.com.br/orcamento-web/pt/link?token=${FAKE_TOKEN}&shouldShowPay=false`;
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const WHATSAPP = 'WhatsApp/2.24.21.80 A';
const PREVIEW_SECRET = 'test-proposal-preview-secret';

function setup() {
    const clock = { now: Date.UTC(2026, 9, 22, 15, 30) };
    const fake = createFakeProposalRedis(clock);
    return { clock, ...fake, deps: { redis: fake.redis, now: () => clock.now } };
}

function open(id: string, userAgent = IPHONE, query = ''): Request {
    return new Request(`${ORIGIN}/proposta/${id}${query}`, {
        headers: { 'user-agent': userAgent, 'cf-connecting-ip': '203.0.113.42' },
    });
}

test('an Infotravel link is accepted with the operator payment button turned off (D7)', () => {
    assert.equal(parseAllowedRedirectUrl(OPERATOR_LINK), INFOTRAVEL_URL);
    // A link generated without the flag gets it too; normalizing is idempotent.
    assert.equal(
        parseAllowedRedirectUrl(`https://premium.infotravel.com.br/orcamento-web/pt/link?token=${FAKE_TOKEN}`),
        INFOTRAVEL_URL,
    );
    assert.equal(parseAllowedRedirectUrl(INFOTRAVEL_URL), INFOTRAVEL_URL);
    // Every spelling of the flag is replaced, never left alongside the forced one.
    assert.equal(
        parseAllowedRedirectUrl(`https://premium.infotravel.com.br/orcamento-web/pt/link?shouldShowPay=true&token=${FAKE_TOKEN}&should%53howPay=1`),
        INFOTRAVEL_URL,
    );
});

test('the booking token is kept byte-for-byte, padding and slashes included', () => {
    const token = 'ab/c+d==';
    const normalized = parseAllowedRedirectUrl(`https://premium.infotravel.com.br/orcamento-web/pt/link?token=${token}&shouldShowPay=true`);
    assert.equal(normalized, `https://premium.infotravel.com.br/orcamento-web/pt/link?token=${token}&shouldShowPay=false`);
});

test('only https links on an allowlisted operator host and path are accepted', () => {

    for (const rejected of [
        'https://premium.infotravel.com.br/reserva/1',
        'https://premium.infotravel.com.br/',
        'https://premium.infotravel.com.br/orcamento-webx/pt/link',
        'http://premium.infotravel.com.br/orcamento-web/pt/link',
        'https://evil.example/reserva/1',
        'https://premium.infotravel.com.br.evil.example/reserva/1',
        'https://infotravel.com.br/reserva/1',
        'https://premium.infotravel.com.br@evil.example/orcamento-web/pt/link',
        'https://user:pass@premium.infotravel.com.br/orcamento-web/pt/link',
        'https://premium.infotravel.com.br:8443/orcamento-web/pt/link',
        'javascript:alert(1)',
        '//premium.infotravel.com.br/reserva/1',
        '/proposta/outra',
        `https://premium.infotravel.com.br/orcamento-web/${'a'.repeat(2048)}`,
        '',
        42,
        null,
    ]) {
        assert.equal(parseAllowedRedirectUrl(rejected), null, String(rejected));
    }
});

test('a proposal can only be saved with an allowed redirect URL', async () => {
    const { deps } = setup();
    await assert.rejects(saveProposal({ redirectUrl: 'https://evil.example/x' }, deps), /not an allowed operator link/);
    const { id } = await saveProposal({ redirectUrl: OPERATOR_LINK }, deps);
    assert.ok(id);
});

test('opening an Infotravel redirect proposal answers 302 to the operator and records the open', async () => {
    const { deps, listOf } = setup();
    // Saved as the operator generated it; sent with the payment button off.
    const { id } = await saveProposal({ redirectUrl: OPERATOR_LINK }, deps);
    const deferred: Promise<unknown>[] = [];

    const response = await handleProposalRequest(open(id), id, { ...deps, waitUntil: (promise) => deferred.push(promise) });

    assert.equal(response.status, 302);
    assert.equal(response.headers.get('Location'), INFOTRAVEL_URL);
    // Recorded after the response (Felipe's call): the 302 doesn't wait on Redis,
    // and waitUntil keeps the write alive until it lands.
    assert.equal(deferred.length, 1);
    await Promise.all(deferred);
    assert.equal(listOf(opensKey(id)).length, 1);
});

test('the redirect keeps the proposal URL out of the operator\'s logs and out of caches', async () => {
    const { deps } = setup();
    const { id } = await saveProposal({ redirectUrl: INFOTRAVEL_URL }, deps);

    const response = await handleProposalRequest(open(id), id, deps);

    assert.equal(response.headers.get('Referrer-Policy'), 'no-referrer');
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
    assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow');
    assert.equal(response.headers.get('Content-Type'), null);
    assert.equal(await response.text(), '');
});

test('a chat link preview gets the Anhangá page, never the operator link, and counts nothing', async () => {
    const { deps, listOf } = setup();
    const { id } = await saveProposal({ redirectUrl: INFOTRAVEL_URL }, deps);

    const response = await handleProposalRequest(open(id, WHATSAPP), id, deps);

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Location'), null);
    assert.ok(!(await response.text()).includes('infotravel'));
    assert.equal(listOf(opensKey(id)).length, 0);
});

test('the internal preview follows the redirect without counting', async (t) => {
    process.env.PROPOSAL_PREVIEW_SECRET = PREVIEW_SECRET;
    t.after(() => {
        delete process.env.PROPOSAL_PREVIEW_SECRET;
    });
    const { deps, listOf } = setup();
    const { id } = await saveProposal({ redirectUrl: INFOTRAVEL_URL }, deps);
    const signature = await createProposalPreviewSignature(id, PREVIEW_SECRET);

    const response = await handleProposalRequest(open(id, IPHONE, `?previa=${signature}`), id, deps);

    assert.equal(response.status, 302);
    assert.equal(response.headers.get('Location'), INFOTRAVEL_URL);
    assert.equal(listOf(opensKey(id)).length, 0);
});

test('a stored URL outside the allowlist is never followed', async (t) => {
    const logged: string[] = [];
    for (const method of ['log', 'info', 'warn', 'error'] as const) {
        t.mock.method(console, method, (...args: unknown[]) => {
            logged.push(args.map((arg) => JSON.stringify(arg) ?? String(arg)).join(' '));
        });
    }
    const id = createProposalId();
    const now = Date.UTC(2026, 9, 22, 15, 30);
    // A record written around saveProposal (or before a host left the allowlist).
    const tampered = { v: 1, createdAt: now, expiresAt: now + 86_400_000, redirectUrl: 'https://evil.example/phish?token=x' };
    const redis: ProposalOpensRedis = {
        set: async () => 'OK',
        mget: async () => [tampered, tampered.expiresAt],
        multi: () => {
            throw new Error('unexpected open recorded');
        },
    };

    const response = await handleProposalRequest(open(id), id, { redis, now: () => now });

    assert.equal(response.status, 503);
    assert.equal(response.headers.get('Location'), null);
    assert.ok(!logged.join('\n').includes('evil.example'), 'the stored URL must not be logged');
});

test('an expired redirect proposal shows the expired page instead of redirecting', async () => {
    const { clock, deps } = setup();
    const { id, expiresAt } = await saveProposal({ redirectUrl: INFOTRAVEL_URL }, deps);
    clock.now = expiresAt;

    const response = await handleProposalRequest(open(id), id, deps);

    assert.equal(response.status, 410);
    assert.equal(response.headers.get('Location'), null);
});

test('a failure to record the open still sends the customer to the operator', async () => {
    const { deps, redis } = setup();
    const { id } = await saveProposal({ redirectUrl: INFOTRAVEL_URL }, deps);
    const failing: ProposalOpensRedis = {
        ...redis,
        multi: () => {
            throw new Error('upstash down');
        },
    };

    const response = await handleProposalRequest(open(id), id, { ...deps, redis: failing });

    assert.equal(response.status, 302);
    assert.equal(response.headers.get('Location'), INFOTRAVEL_URL);
});
