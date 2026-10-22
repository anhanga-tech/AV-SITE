import test from 'node:test';
import assert from 'node:assert/strict';

import { handleProposalRequest, type ProposalPageDeps } from '../lib/proposal-page.ts';
import { opensKey } from '../lib/proposal-opens.ts';
import { createProposalPreviewSignature } from '../lib/proposal-preview.ts';
import { saveProposal } from '../lib/proposal-store.ts';
import {
    createProposalRef,
    notifyProposalOpen,
    PROPOSAL_REOPEN_NOTIFY_GAP_MS,
    verifyProposalWebhook,
    type ProposalOpenedPayload,
} from '../lib/proposal-webhook.ts';
import { createFakeProposalRedis } from './helpers/fake-proposal-redis.ts';

// Issue #1900: a signed webhook tells the sales bot (Clara) that a customer
// opened the proposal — on the first open and on reopens 30+ minutes apart.

const ORIGIN = 'https://www.anhanga.tur.br';
const WEBHOOK_URL = 'https://hooks.example.test/clara/proposta';
const WEBHOOK_SECRET = 'test-proposal-webhook-secret';
const PREVIEW_SECRET = 'test-proposal-preview-secret';
const LEAD_ID = 987654321;
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const FAKE_TOKEN = Buffer.from(`RCA | 7654321 | ${'0'.repeat(32)}`).toString('base64');
const OPERATOR_LINK = `https://premium.infotravel.com.br/orcamento-web/pt/link?token=${FAKE_TOKEN}`;

interface Delivery {
    url: string;
    body: string;
    headers: Record<string, string>;
}

function withEnv(t: { after: (fn: () => void) => void }, env: Record<string, string | undefined>) {
    const saved = Object.fromEntries(Object.keys(env).map((name) => [name, process.env[name]]));
    const apply = (values: Record<string, string | undefined>) => {
        for (const [name, value] of Object.entries(values)) {
            if (value === undefined) delete process.env[name];
            else process.env[name] = value;
        }
    };
    apply(env);
    t.after(() => apply(saved));
}

function withWebhook(t: { after: (fn: () => void) => void }, env: Record<string, string | undefined> = {}) {
    withEnv(t, {
        PROPOSAL_WEBHOOK_URL: WEBHOOK_URL,
        PROPOSAL_WEBHOOK_SECRET: WEBHOOK_SECRET,
        PROPOSAL_PREVIEW_SECRET: PREVIEW_SECRET,
        ...env,
    });
}

/** Receiver stub: answers each attempt with the next status (or throws), then 200. */
function setup(responses: Array<number | Error> = []) {
    const clock = { now: Date.UTC(2026, 9, 22, 15, 30) };
    const fake = createFakeProposalRedis(clock);
    const deliveries: Delivery[] = [];
    const sleeps: number[] = [];
    const pending: Promise<unknown>[] = [];
    const fetchStub = async (url: string | URL | Request, init?: RequestInit) => {
        deliveries.push({
            url: String(url),
            body: String(init?.body),
            headers: Object.fromEntries(new Headers(init?.headers).entries()),
        });
        const next = responses.shift() ?? 200;
        if (next instanceof Error) throw next;
        return new Response(null, { status: next });
    };
    const deps: ProposalPageDeps = {
        redis: fake.redis,
        now: () => clock.now,
        waitUntil: (promise) => pending.push(promise),
        webhook: { fetch: fetchStub as typeof fetch, sleep: async (ms) => void sleeps.push(ms) },
    };
    const settle = async () => {
        await Promise.all(pending.splice(0));
    };
    return { clock, ...fake, deps, deliveries, sleeps, settle };
}

function open(id: string, options: { userAgent?: string; query?: string; method?: string; headers?: Record<string, string> } = {}): Request {
    return new Request(`${ORIGIN}/proposta/${id}${options.query ?? ''}`, {
        method: options.method ?? 'GET',
        headers: { 'user-agent': options.userAgent ?? IPHONE, 'cf-connecting-ip': '203.0.113.42', ...options.headers },
    });
}

function payloadOf(delivery: Delivery): ProposalOpenedPayload {
    return JSON.parse(delivery.body);
}

test('the first open sends a signed webhook with the lead, the count and the time', async (t) => {
    withWebhook(t);
    const { deps, deliveries, settle, clock } = setup();
    const { id } = await saveProposal({ redirectUrl: OPERATOR_LINK, leadId: LEAD_ID }, deps);

    const response = await handleProposalRequest(open(id), id, deps);
    assert.equal(response.status, 302);
    await settle();

    assert.equal(deliveries.length, 1);
    const [delivery] = deliveries;
    assert.equal(delivery.url, WEBHOOK_URL);
    const payload = payloadOf(delivery);
    const proposalRef = await createProposalRef(id);
    assert.deepEqual(payload, {
        event: 'proposal.opened',
        eventId: `${proposalRef}:1`,
        proposalRef,
        leadId: LEAD_ID,
        openCount: 1,
        isFirstOpen: true,
        openedAt: new Date(clock.now).toISOString(),
        previousOpenAt: null,
    });
    assert.equal(delivery.headers['x-anhanga-event-id'], payload.eventId);
    assert.equal(
        await verifyProposalWebhook({
            body: delivery.body,
            timestamp: delivery.headers['x-anhanga-timestamp'],
            signature: delivery.headers['x-anhanga-signature'],
            secret: WEBHOOK_SECRET,
            now: clock.now,
        }),
        true,
    );
});

test('the webhook carries neither the proposal id nor the operator link', async (t) => {
    withWebhook(t);
    const { deps, deliveries, settle } = setup();
    const { id } = await saveProposal({ redirectUrl: OPERATOR_LINK, leadId: LEAD_ID }, deps);

    await handleProposalRequest(open(id), id, deps);
    await settle();

    const sent = JSON.stringify(deliveries);
    assert.ok(!sent.includes(id), 'the id opens the proposal');
    assert.ok(!sent.includes(FAKE_TOKEN) && !sent.includes('infotravel'), 'the operator link is a booking credential');
    assert.ok(!sent.includes('203.0.113.42'));
});

test('a reopen notifies only 30 minutes or more after the previous open', async (t) => {
    withWebhook(t);
    const { deps, deliveries, settle, clock } = setup();
    const { id } = await saveProposal({ leadId: LEAD_ID }, deps);

    await handleProposalRequest(open(id), id, deps);
    clock.now += PROPOSAL_REOPEN_NOTIFY_GAP_MS - 60_000;
    await handleProposalRequest(open(id), id, deps);
    // Measured from the previous open, not the previous notification.
    clock.now += PROPOSAL_REOPEN_NOTIFY_GAP_MS - 60_000;
    await handleProposalRequest(open(id), id, deps);
    const previous = clock.now;
    clock.now += PROPOSAL_REOPEN_NOTIFY_GAP_MS;
    await handleProposalRequest(open(id), id, deps);
    await settle();

    assert.deepEqual(deliveries.map((delivery) => payloadOf(delivery).openCount), [1, 4]);
    const reopen = payloadOf(deliveries[1]);
    assert.equal(reopen.isFirstOpen, false);
    assert.equal(reopen.previousOpenAt, new Date(previous).toISOString());
    assert.notEqual(reopen.eventId, payloadOf(deliveries[0]).eventId);
});

test('internal previews, link previews, prefetches and HEAD never send a webhook', async (t) => {
    withWebhook(t);
    const { deps, deliveries, settle, listOf } = setup();
    const { id } = await saveProposal({ redirectUrl: OPERATOR_LINK, leadId: LEAD_ID }, deps);
    const signature = await createProposalPreviewSignature(id, PREVIEW_SECRET);

    await handleProposalRequest(open(id, { query: `?previa=${signature}` }), id, deps);
    await handleProposalRequest(open(id, { userAgent: 'WhatsApp/2.24.21.80 A' }), id, deps);
    await handleProposalRequest(open(id, { headers: { 'sec-purpose': 'prefetch' } }), id, deps);
    await handleProposalRequest(open(id, { headers: { 'x-purpose': 'preview' } }), id, deps);
    await handleProposalRequest(open(id, { method: 'HEAD' }), id, deps);
    await settle();

    assert.equal(listOf(opensKey(id)).length, 0);
    assert.equal(deliveries.length, 0);
});

test('a failing receiver is retried with the same event id, after the page was served', async (t) => {
    withWebhook(t);
    const { deps, deliveries, sleeps, settle, listOf } = setup([503, new TypeError('fetch failed'), 200]);
    const { id } = await saveProposal({ redirectUrl: OPERATOR_LINK, leadId: LEAD_ID }, deps);

    const response = await handleProposalRequest(open(id), id, deps);
    assert.equal(response.status, 302);
    await settle();

    assert.equal(deliveries.length, 3);
    assert.equal(new Set(deliveries.map((delivery) => delivery.body)).size, 1);
    assert.equal(new Set(deliveries.map((delivery) => delivery.headers['x-anhanga-event-id'])).size, 1);
    assert.deepEqual(sleeps, [1_000, 3_000]);
    assert.equal(listOf(opensKey(id)).length, 1);
});

test('a receiver that keeps failing gives up after three attempts without breaking anything', async (t) => {
    withWebhook(t);
    const logged: string[] = [];
    for (const method of ['log', 'info', 'warn', 'error'] as const) {
        t.mock.method(console, method, (...args: unknown[]) => {
            logged.push(args.map((arg) => JSON.stringify(arg) ?? String(arg)).join(' '));
        });
    }
    const { deps, deliveries, settle, listOf } = setup([500, 500, 500, 500]);
    const { id } = await saveProposal({ leadId: LEAD_ID }, deps);

    const response = await handleProposalRequest(open(id), id, deps);
    assert.equal(response.status, 200);
    await assert.doesNotReject(settle());

    assert.equal(deliveries.length, 3);
    assert.equal(listOf(opensKey(id)).length, 1);
    const output = logged.join('\n');
    assert.match(output, /PROPOSAL_WEBHOOK/);
    for (const secret of [id, String(LEAD_ID), 'hooks.example.test', await createProposalRef(id)]) {
        assert.ok(!output.includes(secret), `logs must not contain ${secret}`);
    }
});

test('a client error from the receiver is not retried', async (t) => {
    withWebhook(t);
    const { deps, deliveries, settle } = setup([401]);
    const { id } = await saveProposal({ leadId: LEAD_ID }, deps);

    await handleProposalRequest(open(id), id, deps);
    await settle();

    assert.equal(deliveries.length, 1);
});

test('nothing is sent without a configured https webhook, or for a proposal without a lead', async (t) => {
    for (const env of [
        { PROPOSAL_WEBHOOK_URL: undefined },
        { PROPOSAL_WEBHOOK_SECRET: undefined },
        { PROPOSAL_WEBHOOK_URL: 'http://hooks.example.test/clara' },
        { PROPOSAL_WEBHOOK_URL: 'not a url' },
    ]) {
        await t.test(JSON.stringify(env), async (st) => {
            withWebhook(st, env);
            const { deps, deliveries, settle, listOf } = setup();
            const { id } = await saveProposal({ leadId: LEAD_ID }, deps);

            assert.equal((await handleProposalRequest(open(id), id, deps)).status, 200);
            await settle();

            assert.equal(deliveries.length, 0);
            assert.equal(listOf(opensKey(id)).length, 1);
        });
    }

    await t.test('no leadId', async (st) => {
        withWebhook(st);
        const { deps, deliveries, settle } = setup();
        const { id } = await saveProposal({}, deps);

        await handleProposalRequest(open(id), id, deps);
        await settle();

        assert.equal(deliveries.length, 0);
    });
});

test('the receiver rejects a tampered body, a stale timestamp or another secret', async (t) => {
    withWebhook(t);
    const { deps, deliveries, settle, clock } = setup();
    const { id } = await saveProposal({ leadId: LEAD_ID }, deps);
    await handleProposalRequest(open(id), id, deps);
    await settle();
    const [{ body, headers }] = deliveries;
    const valid = { body, timestamp: headers['x-anhanga-timestamp'], signature: headers['x-anhanga-signature'], secret: WEBHOOK_SECRET, now: clock.now };

    assert.equal(await verifyProposalWebhook(valid), true);
    assert.equal(await verifyProposalWebhook({ ...valid, body: body.replace(String(LEAD_ID), '1') }), false);
    assert.equal(await verifyProposalWebhook({ ...valid, secret: `${WEBHOOK_SECRET}x` }), false);
    assert.equal(await verifyProposalWebhook({ ...valid, now: clock.now + 6 * 60_000 }), false);
    assert.equal(await verifyProposalWebhook({ ...valid, now: clock.now - 6 * 60_000 }), false);
    assert.equal(await verifyProposalWebhook({ ...valid, timestamp: null }), false);
    assert.equal(await verifyProposalWebhook({ ...valid, signature: 'v1=' }), false);
    assert.equal(await verifyProposalWebhook({ ...valid, timestamp: '1e9' }), false);
});

test('the signature timestamp is the send time, so a late delivery still verifies', async (t) => {
    withWebhook(t);
    const deliveries: Delivery[] = [];
    const openedAt = Date.UTC(2026, 9, 22, 15, 30);
    const sentAt = openedAt + 20 * 60_000;

    await notifyProposalOpen(
        { id: 'Ab12Cd34Ef56Gh78', leadId: LEAD_ID, count: 1, previousOpenAt: null, openedAt },
        {
            now: () => sentAt,
            fetch: (async (url: string, init: RequestInit) => {
                deliveries.push({ url, body: String(init.body), headers: Object.fromEntries(new Headers(init.headers).entries()) });
                return new Response(null, { status: 200 });
            }) as typeof fetch,
        },
    );

    const [{ body, headers }] = deliveries;
    assert.equal(headers['x-anhanga-timestamp'], String(sentAt / 1000));
    assert.equal(payloadOf(deliveries[0]).openedAt, new Date(openedAt).toISOString());
    assert.equal(
        await verifyProposalWebhook({ body, timestamp: headers['x-anhanga-timestamp'], signature: headers['x-anhanga-signature'], secret: WEBHOOK_SECRET, now: sentAt }),
        true,
    );
});

test('the proposal reference is stable for whoever holds the id, and does not reveal it', async () => {
    const ref = await createProposalRef('Ab12Cd34Ef56Gh78');

    assert.equal(ref, await createProposalRef('Ab12Cd34Ef56Gh78'));
    assert.notEqual(ref, await createProposalRef('Ab12Cd34Ef56Gh79'));
    assert.match(ref, /^[0-9a-f]{32}$/);
});
