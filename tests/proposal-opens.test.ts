import test from 'node:test';
import assert from 'node:assert/strict';

import { scrubSensitiveUrl } from '../lib/error-tracking.ts';
import { isLinkPreviewRequest } from '../lib/link-preview-agents.ts';
import { handleProposalRequest } from '../lib/proposal-page.ts';
import { opensKey, PROPOSAL_OPENS_RETENTION_SECONDS, type ProposalOpensRedis } from '../lib/proposal-opens.ts';
import { createProposalPreviewSignature } from '../lib/proposal-preview.ts';
import { saveProposal } from '../lib/proposal-store.ts';
import { createFakeProposalRedis } from './helpers/fake-proposal-redis.ts';

// Issue #1897: each customer open of /proposta/<id> is recorded (UTC instant
// and count only); link previews and the signed internal preview are not.

const ORIGIN = 'https://www.anhanga.tur.br';
const DAY_MS = 24 * 60 * 60 * 1000;
const PREVIEW_SECRET = 'test-proposal-preview-secret';
const CUSTOMER_IP = '203.0.113.42';

const UA = {
    iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
    desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    cubot: 'Mozilla/5.0 (Linux; Android 12; CUBOT KINGKONG 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
    // In-app browsers carry the app name, but a person is reading the page.
    snapchatInApp: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Snapchat/13.12.0.36 (like Safari/8618.2.12.10.4, panda)',
    viberInApp: 'Mozilla/5.0 (Linux; Android 14; SM-A546B Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36 Viber/24.9.0.0',
    instagramInApp: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 354.0.0.30.98 (iPhone15,2; iOS 18_1; pt_BR; pt; scale=3.00; 1179x2556; 660893810)',
    // Google Read Aloud fetches on the customer's request (Codex review, #1919).
    readAloud: 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 Google-Read-Aloud',
    facebookInApp: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/487.0.0.41.109;FBBV/662847301;FBDV/iPhone15,2;FBMD/iPhone;FBSN/iOS;FBSV/18.1;FBSS/3;FBID/phone;FBLC/pt_BR;FBOP/5;FBRV/0]',
};

const PREVIEW_AGENTS = {
    whatsapp: 'WhatsApp/2.24.21.80 A',
    imessage: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/601.2.4 (KHTML, like Gecko) Version/9.0.1 Safari/601.2.4 facebookexternalhit/1.1 Facebot Twitterbot/1.0',
    facebook: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    slack: 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
    telegram: 'TelegramBot (like TwitterBot)',
    google: 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    snapchat: 'Mozilla/5.0 (compatible; Snap URL Preview Service; bot; snapchat; +https://developers.snap.com/robots)',
    mastodon: 'Mastodon/4.3.0 (http.rb/5.2.0; +https://mastodon.social/)',
    bluesky: 'Mozilla/5.0 (compatible; Bluesky Cardyb/1.1; +mailto:support@bsky.app)',
    lighthouse: 'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 Chrome-Lighthouse',
    curl: 'curl/8.5.0',
};

function setup() {
    const clock = { now: Date.UTC(2026, 9, 22, 15, 30) };
    const fake = createFakeProposalRedis(clock);
    return { clock, ...fake, deps: { redis: fake.redis, now: () => clock.now } };
}

function open(
    id: string,
    options: { userAgent?: string; ip?: string; method?: string; query?: string; cf?: Record<string, unknown> } = {},
): Request {
    const headers = new Headers();
    if (options.userAgent !== undefined) headers.set('user-agent', options.userAgent);
    headers.set('cf-connecting-ip', options.ip ?? CUSTOMER_IP);
    const request = new Request(`${ORIGIN}/proposta/${id}${options.query ?? ''}`, { method: options.method ?? 'GET', headers });
    if (options.cf) Object.defineProperty(request, 'cf', { value: options.cf });
    return request;
}

function prefetch(id: string, headers: Record<string, string>): Request {
    return new Request(`${ORIGIN}/proposta/${id}`, {
        headers: { 'user-agent': UA.desktop, 'cf-connecting-ip': CUSTOMER_IP, ...headers },
    });
}

function withPreviewSecret(t: { after: (fn: () => void) => void }) {
    process.env.PROPOSAL_PREVIEW_SECRET = PREVIEW_SECRET;
    t.after(() => {
        delete process.env.PROPOSAL_PREVIEW_SECRET;
    });
}

test('opening on a phone counts 1 and reopening increments', async () => {
    const { deps, listOf } = setup();
    const { id } = await saveProposal({}, deps);

    await handleProposalRequest(open(id, { userAgent: UA.iphone }), id, deps);
    assert.equal(listOf(opensKey(id)).length, 1);

    await handleProposalRequest(open(id, { userAgent: UA.iphone }), id, deps);
    assert.equal(listOf(opensKey(id)).length, 2);
});

test('an open records only its UTC instant: no place, device or IP', async () => {
    const { deps, listOf, strings } = setup();
    const { id } = await saveProposal({}, deps);

    await handleProposalRequest(
        open(id, { userAgent: UA.iphone, cf: { country: 'BR', city: 'São Paulo', latitude: '-23.5', postalCode: '01000' } }),
        id,
        deps,
    );

    const [event] = listOf(opensKey(id)) as Array<Record<string, unknown>>;
    assert.deepEqual(event, { at: '2026-10-22T15:30:00.000Z' });
    const stored = JSON.stringify([...strings.entries()]);
    assert.ok(!stored.includes(CUSTOMER_IP));
    assert.ok(!stored.includes('São Paulo'));
    assert.ok(![...strings.keys()].some((key) => key.startsWith('proposta:sal:')), 'no IP salt is created');
});

test('opens are kept at most 90 days from the first one; reopening does not extend it', async () => {
    const { clock, deps, listTtlMs } = setup();
    const { id } = await saveProposal({}, deps);

    await handleProposalRequest(open(id, { userAgent: UA.iphone }), id, deps);
    assert.equal(listTtlMs(opensKey(id)), PROPOSAL_OPENS_RETENTION_SECONDS * 1000);
    assert.equal(PROPOSAL_OPENS_RETENTION_SECONDS, 90 * 24 * 60 * 60);

    clock.now += 10 * DAY_MS;
    await handleProposalRequest(open(id, { userAgent: UA.iphone }), id, deps);
    assert.equal(listTtlMs(opensKey(id)), (PROPOSAL_OPENS_RETENTION_SECONDS - 10 * 24 * 60 * 60) * 1000);
});

test('pasting the link into a chat app does not count an open', async () => {
    const { deps, listOf } = setup();
    const { id } = await saveProposal({}, deps);

    for (const [name, userAgent] of Object.entries(PREVIEW_AGENTS)) {
        const response = await handleProposalRequest(open(id, { userAgent }), id, deps);
        assert.equal(response.status, 200, `${name} still gets the page`);
    }
    await handleProposalRequest(open(id, { userAgent: UA.iphone, method: 'HEAD' }), id, deps);
    await handleProposalRequest(open(id), id, deps);

    assert.equal(listOf(opensKey(id)).length, 0);
});

test('real browsers are not mistaken for previews, including phone brands containing "bot"', () => {
    for (const userAgent of Object.values(UA)) {
        assert.equal(isLinkPreviewRequest(open('x', { userAgent })), false, userAgent);
    }
});

test('the signed internal preview shows the page with a notice and never counts', async (t) => {
    withPreviewSecret(t);
    const { deps, listOf } = setup();
    const { id } = await saveProposal({}, deps);
    const signature = await createProposalPreviewSignature(id, PREVIEW_SECRET);

    const response = await handleProposalRequest(open(id, { userAgent: UA.desktop, query: `?previa=${signature}` }), id, deps);

    assert.equal(response.status, 200);
    assert.match(await response.text(), /Prévia interna/);
    assert.equal(listOf(opensKey(id)).length, 0);
});

test('a forged, foreign or unverifiable preview signature counts as a customer open', async (t) => {
    const { deps, listOf } = setup();
    const { id } = await saveProposal({}, deps);
    const { id: otherId } = await saveProposal({}, deps);
    const signature = await createProposalPreviewSignature(id, PREVIEW_SECRET);

    // No secret configured: nothing can be verified.
    await handleProposalRequest(open(id, { userAgent: UA.iphone, query: `?previa=${signature}` }), id, deps);

    withPreviewSecret(t);
    await handleProposalRequest(open(id, { userAgent: UA.iphone, query: '?previa=forged' }), id, deps);
    const foreign = await createProposalPreviewSignature(otherId, PREVIEW_SECRET);
    const response = await handleProposalRequest(open(id, { userAgent: UA.iphone, query: `?previa=${foreign}` }), id, deps);

    assert.doesNotMatch(await response.text(), /Prévia interna/);
    assert.equal(listOf(opensKey(id)).length, 3);
});

test('expired and unknown proposals record nothing', async () => {
    const { clock, deps, listOf } = setup();
    const { id, expiresAt } = await saveProposal({}, deps);
    clock.now = expiresAt;

    assert.equal((await handleProposalRequest(open(id, { userAgent: UA.iphone }), id, deps)).status, 410);
    assert.equal((await handleProposalRequest(open('Ab12Cd34Ef56Gh78', { userAgent: UA.iphone }), 'Ab12Cd34Ef56Gh78', deps)).status, 404);
    assert.equal(listOf(opensKey(id)).length, 0);
});

test('a recording failure still serves the page and never logs the id', async (t) => {
    const { deps, redis } = setup();
    const { id } = await saveProposal({}, deps);
    const logged: string[] = [];
    for (const method of ['log', 'info', 'warn', 'error'] as const) {
        t.mock.method(console, method, (...args: unknown[]) => {
            logged.push(args.map((arg) => JSON.stringify(arg) ?? String(arg)).join(' '));
        });
    }
    const failing: ProposalOpensRedis = {
        ...redis,
        multi: () => ({
            lindex: () => undefined,
            rpush: () => undefined,
            expire: () => undefined,
            exec: async () => {
                throw new Error(`ERR failed, command was: ${JSON.stringify([['rpush', opensKey(id)], ['expire', opensKey(id), 'NX']])}`);
            },
        }),
    };

    const response = await handleProposalRequest(open(id, { userAgent: UA.iphone }), id, { ...deps, redis: failing });

    assert.equal(response.status, 200);
    assert.ok(logged.length > 0, 'the failure should still be logged');
    assert.ok(!logged.join('\n').includes(id), logged.join('\n'));
});

test('the append and its 90-day TTL are one transaction, so a list never lives without a TTL', async () => {
    const { deps, listOf, listTtlMs, redis } = setup();
    const { id } = await saveProposal({}, deps);
    const calls: string[] = [];
    const tracing: ProposalOpensRedis = {
        ...redis,
        multi: () => {
            const transaction = redis.multi();
            return {
                lindex: (...args) => (calls.push('lindex'), transaction.lindex(...args)),
                rpush: (...args) => (calls.push('rpush'), transaction.rpush(...args)),
                expire: (...args) => (calls.push('expire'), transaction.expire(...args)),
                exec: () => (calls.push('exec'), transaction.exec()),
            };
        },
    };

    await handleProposalRequest(open(id, { userAgent: UA.iphone }), id, { ...deps, redis: tracing });

    assert.deepEqual(calls, ['lindex', 'rpush', 'expire', 'exec']);
    assert.equal(listOf(opensKey(id)).length, 1);
    assert.equal(listTtlMs(opensKey(id)), PROPOSAL_OPENS_RETENTION_SECONDS * 1000);
});

test('with waitUntil the open is recorded after the response, not before it', async () => {
    const { deps, listOf } = setup();
    const { id } = await saveProposal({}, deps);
    const pending: Promise<unknown>[] = [];

    const response = await handleProposalRequest(open(id, { userAgent: UA.iphone }), id, {
        ...deps,
        waitUntil: (promise) => pending.push(promise),
    });

    assert.equal(response.status, 200);
    assert.equal(pending.length, 1);
    await Promise.all(pending);
    assert.equal(listOf(opensKey(id)).length, 1);
});

test('a browser prefetch is refused, so the real navigation is the request that counts', async () => {
    const { deps, listOf } = setup();
    const { id } = await saveProposal({}, deps);

    const speculativeFetches: Record<string, string>[] = [
        { 'sec-purpose': 'prefetch' },
        { 'sec-purpose': 'prefetch;prerender' },
        { 'sec-purpose': 'prefetch;anonymous-client-ip' },
        { purpose: 'prefetch' },
        { 'x-moz': 'prefetch' },
    ];
    for (const headers of speculativeFetches) {
        const response = await handleProposalRequest(prefetch(id, headers), id, deps);
        // Non-2xx: the browser discards the speculative fetch instead of
        // showing it later from memory, which would never reach the server.
        assert.equal(response.status, 503, JSON.stringify(headers));
        assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
    }
    assert.equal(listOf(opensKey(id)).length, 0);

    await handleProposalRequest(open(id, { userAgent: UA.desktop }), id, deps);
    assert.equal(listOf(opensKey(id)).length, 1);
});

test('a Safari page preview gets the Anhangá page without counting', async () => {
    // X-Purpose: preview renders a preview the person may never open further,
    // so it is served (not refused like a prefetch) and still not counted.
    const { deps, listOf } = setup();
    const { id } = await saveProposal({}, deps);

    const response = await handleProposalRequest(prefetch(id, { 'x-purpose': 'preview' }), id, deps);

    assert.equal(response.status, 200);
    assert.equal(listOf(opensKey(id)).length, 0);
});

test('a prefetch of a redirect proposal never receives the operator link', async () => {
    const { deps } = setup();
    const token = Buffer.from(`RCA | 1234567 | ${'0'.repeat(32)}`).toString('base64');
    const { id } = await saveProposal(
        { redirectUrl: `https://premium.infotravel.com.br/orcamento-web/pt/link?token=${token}` },
        deps,
    );

    const response = await handleProposalRequest(prefetch(id, { 'sec-purpose': 'prefetch' }), id, deps);

    assert.equal(response.status, 503);
    assert.equal(response.headers.get('Location'), null);
});

test('the preview signature never reaches Sentry', () => {
    assert.equal(
        scrubSensitiveUrl('https://www.anhanga.tur.br/proposta/Ab12Cd34Ef56Gh78?previa=sig-value&utm_source=wa'),
        'https://www.anhanga.tur.br/proposta/[redacted]?previa=[redacted]&utm_source=wa',
    );
});
