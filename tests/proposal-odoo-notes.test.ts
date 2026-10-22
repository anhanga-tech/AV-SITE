import test from 'node:test';
import assert from 'node:assert/strict';

import { handleCreateProposal } from '../api/create-proposal.ts';
import { formatSaoPauloDateTime } from '../lib/proposal-odoo-notes.ts';
import { handleProposalRequest, type ProposalPageDeps } from '../lib/proposal-page.ts';
import { createProposalPreviewSignature } from '../lib/proposal-preview.ts';
import { saveProposal } from '../lib/proposal-store.ts';
import { PROPOSAL_REOPEN_NOTIFY_GAP_MS } from '../lib/proposal-webhook.ts';
import { createFakeProposalRedis } from './helpers/fake-proposal-redis.ts';
import { clearOdooEnv, createOdooMock, setOdooEnv, type OdooMockOptions } from './odoo-mock.ts';

// Issue #1904: internal notes on the Odoo lead when a proposal is sent and
// when the customer opens it (the same opens that notify the sales bot).

const ORIGIN = 'https://www.anhanga.tur.br';
const API_SECRET = 'test-proposal-api-secret';
const PREVIEW_SECRET = 'test-proposal-preview-secret';
const LEAD_ID = 987654321;
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const FAKE_TOKEN = Buffer.from(`RCA | 7654321 | ${'0'.repeat(32)}`).toString('base64');
const OPERATOR_LINK = `https://premium.infotravel.com.br/orcamento-web/pt/link?token=${FAKE_TOKEN}`;
// 15:30 UTC is 12:30 in São Paulo (UTC−3, no daylight saving since 2019).
const OPENED_AT = Date.UTC(2026, 9, 22, 15, 30);

const originalFetch = global.fetch;
let ipCounter = 0;

function withOdoo(t: { after: (fn: () => void) => void }, options: OdooMockOptions = {}) {
    const mock = createOdooMock(options);
    setOdooEnv();
    process.env.PROPOSAL_API_SECRET = API_SECRET;
    process.env.PROPOSAL_PREVIEW_SECRET = PREVIEW_SECRET;
    global.fetch = mock.fetch;
    t.after(() => {
        global.fetch = originalFetch;
        clearOdooEnv();
        delete process.env.PROPOSAL_API_SECRET;
        delete process.env.PROPOSAL_PREVIEW_SECRET;
    });
    const notes = () => mock.calls.filter((call) => call.model === 'crm.lead' && call.method === 'message_post');
    return { mock, notes };
}

function setup() {
    const clock = { now: OPENED_AT };
    const fake = createFakeProposalRedis(clock);
    const pending: Promise<unknown>[] = [];
    const deps: ProposalPageDeps = { redis: fake.redis, now: () => clock.now, waitUntil: (promise) => pending.push(promise) };
    const settle = async () => {
        await Promise.all(pending.splice(0));
    };
    return { clock, ...fake, deps, settle };
}

function create(body: unknown): Request {
    return new Request(`${ORIGIN}/api/create-proposal`, {
        method: 'POST',
        headers: { authorization: `Bearer ${API_SECRET}`, 'cf-connecting-ip': `198.51.100.${(ipCounter += 1)}` },
        body: JSON.stringify(body),
    });
}

function open(id: string, options: { userAgent?: string; query?: string } = {}): Request {
    return new Request(`${ORIGIN}/proposta/${id}${options.query ?? ''}`, {
        headers: { 'user-agent': options.userAgent ?? IPHONE, 'cf-connecting-ip': '203.0.113.42' },
    });
}

test('creating a proposal notes the customer link on the Odoo lead, as an internal note', async (t) => {
    const { notes } = withOdoo(t);
    const { deps } = setup();

    const response = await handleCreateProposal(create({ type: 'redirect', redirectUrl: OPERATOR_LINK, leadId: LEAD_ID }), deps);
    const { data } = await response.json();

    assert.equal(response.status, 201);
    assert.equal(data.crmNote, 'recorded');
    assert.equal(notes().length, 1);
    const [note] = notes();
    assert.deepEqual(note.args, [[LEAD_ID]]);
    assert.equal(note.kwargs.body, `Proposta enviada: ${data.url} (válida até 06/11/2026)`);
    // A note, never a message: followers (the customer among them) get no e-mail.
    assert.equal(note.kwargs.subtype_xmlid, 'mail.mt_note');
    assert.equal(note.kwargs.message_type, 'comment');
    // Only the customer link: not the preview link, not the operator's.
    assert.ok(!String(note.kwargs.body).includes('previa'));
    assert.ok(!String(note.kwargs.body).includes('infotravel'));
});

test('a CRM failure still creates the proposal, reports it and keeps the link out of the logs', async (t) => {
    const logged: string[] = [];
    for (const method of ['log', 'info', 'warn', 'error'] as const) {
        t.mock.method(console, method, (...args: unknown[]) => {
            logged.push(args.map((arg) => JSON.stringify(arg) ?? String(arg)).join(' '));
        });
    }
    withOdoo(t, { failStatus: 500, failDetail: 'Proposta enviada: https://www.anhanga.tur.br/proposta/x' });
    const { deps } = setup();

    const response = await handleCreateProposal(create({ type: 'redirect', redirectUrl: OPERATOR_LINK, leadId: LEAD_ID }), deps);
    const { data } = await response.json();

    assert.equal(response.status, 201);
    assert.equal(data.crmNote, 'failed');
    const output = logged.join('\n');
    assert.match(output, /PROPOSAL_ODOO_NOTE/);
    for (const secret of [data.id, String(LEAD_ID), '/proposta/']) {
        assert.ok(!output.includes(secret), `logs must not contain ${secret}`);
    }
});

test('without Odoo configured the proposal is created and the note skipped', async (t) => {
    process.env.PROPOSAL_API_SECRET = API_SECRET;
    process.env.PROPOSAL_PREVIEW_SECRET = PREVIEW_SECRET;
    t.after(() => {
        delete process.env.PROPOSAL_API_SECRET;
        delete process.env.PROPOSAL_PREVIEW_SECRET;
    });
    const { deps } = setup();

    const response = await handleCreateProposal(create({ type: 'redirect', redirectUrl: OPERATOR_LINK, leadId: LEAD_ID }), deps);

    assert.equal(response.status, 201);
    assert.equal((await response.json()).data.crmNote, 'skipped');
});

test('the first open and each reopen 30+ minutes later are noted on the lead, in São Paulo time', async (t) => {
    const { notes } = withOdoo(t);
    const { deps, settle, clock } = setup();
    const { id } = await saveProposal({ leadId: LEAD_ID }, deps);

    await handleProposalRequest(open(id), id, deps);
    clock.now += PROPOSAL_REOPEN_NOTIFY_GAP_MS - 60_000;
    await handleProposalRequest(open(id), id, deps);
    clock.now += PROPOSAL_REOPEN_NOTIFY_GAP_MS;
    await handleProposalRequest(open(id), id, deps);
    await settle();

    assert.deepEqual(notes().map((note) => note.kwargs.body), [
        'Proposta aberta em 22/10/2026 às 12:30 (horário de São Paulo), 1ª vez',
        'Proposta aberta em 22/10/2026 às 13:29 (horário de São Paulo), 3ª vez',
    ]);
    for (const note of notes()) {
        assert.deepEqual(note.args, [[LEAD_ID]]);
        assert.equal(note.kwargs.subtype_xmlid, 'mail.mt_note');
        // Nothing about the visitor beyond what the lead already has.
        assert.ok(!/203\.0\.113|iPhone|mobile/i.test(String(note.kwargs.body)));
    }
});

test('previews never write to the lead, and a proposal without a lead never calls Odoo', async (t) => {
    const { mock, notes } = withOdoo(t);
    const { deps, settle } = setup();
    const { id } = await saveProposal({ redirectUrl: OPERATOR_LINK, leadId: LEAD_ID }, deps);
    const signature = await createProposalPreviewSignature(id, PREVIEW_SECRET);

    await handleProposalRequest(open(id, { query: `?previa=${signature}` }), id, deps);
    await handleProposalRequest(open(id, { userAgent: 'WhatsApp/2.24.21.80 A' }), id, deps);
    await settle();
    assert.equal(notes().length, 0);

    const { id: orphan } = await saveProposal({}, deps);
    const response = await handleProposalRequest(open(orphan), orphan, deps);
    await settle();
    assert.equal(response.status, 200);
    assert.equal(mock.calls.length, 0);
});

test('an Odoo failure on an open never reaches the customer', async (t) => {
    withOdoo(t, { failStatus: 503 });
    const { deps, settle } = setup();
    const { id } = await saveProposal({ redirectUrl: OPERATOR_LINK, leadId: LEAD_ID }, deps);

    const response = await handleProposalRequest(open(id), id, deps);

    assert.equal(response.status, 302);
    await assert.doesNotReject(settle());
});

test('São Paulo time crosses midnight correctly', () => {
    assert.equal(formatSaoPauloDateTime(Date.UTC(2026, 9, 23, 2, 5)), '22/10/2026 às 23:05');
    assert.equal(formatSaoPauloDateTime(Date.UTC(2026, 0, 1, 3, 0)), '01/01/2026 às 00:00');
});
