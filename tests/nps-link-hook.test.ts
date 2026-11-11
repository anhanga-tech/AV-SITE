import test from 'node:test';
import assert from 'node:assert/strict';

import { handleNpsLinkHook } from '../api/nps-link-hook.ts';
import {
    buildNpsLinkSkippedNote,
    checkNpsLinkEligibility,
    firstNameOf,
    issueNpsLinkForLead,
    npsLinkOriginFor,
    NPS_LINK_FIELD,
    type NpsLinkDeps,
} from '../lib/nps-link.ts';
import { verifyNpsInviteToken } from '../lib/nps-invite.ts';
import { scrubSensitiveUrl } from '../lib/error-tracking.ts';

// Per-customer NPS link for the Odoo post-trip automation (lib/nps-link.ts).

const WEBHOOK_SECRET = 'test-nps-link-webhook-secret';
const INVITE_SECRET = 'test-nps-invite-secret';
const ORIGIN = 'https://www.anhanga.tur.br';
// 11/11/2026 12:00 in São Paulo.
const NOW = Date.UTC(2026, 10, 11, 15, 0);

let ipCounter = 0;

function wonLead(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        id: 61,
        active: true,
        won_status: 'won',
        email_from: 'Felipewilliam@gmail.com ',
        contact_name: 'Contato do lead',
        partner_id: [679, 'Felipe William'],
        x_data_de_retorno: '2026-11-09',
        [NPS_LINK_FIELD]: false,
        ...overrides,
    };
}

function fakeSession(lead: Record<string, unknown> | null) {
    const writes: { leadId: number; fields: Record<string, unknown> }[] = [];
    const notes: string[] = [];
    const reads: { leadId: number; fields: readonly string[] }[] = [];
    return {
        writes,
        notes,
        reads,
        session: {
            async readLead(leadId: number, fields: readonly string[]) {
                reads.push({ leadId, fields });
                return lead;
            },
            async writeLead(leadId: number, fields: Record<string, unknown>) {
                writes.push({ leadId, fields });
            },
            async postLeadNote(_leadId: number, body: string) {
                notes.push(body);
            },
        },
    };
}

function deps(lead: Record<string, unknown> | null, extra: Partial<NpsLinkDeps> = {}) {
    const fake = fakeSession(lead);
    const linkDeps: NpsLinkDeps = {
        getConfig: () => ({ url: 'https://odoo.test', db: 'db', login: 'bot', apiKey: 'key' }),
        openSession: async () => fake.session,
        acquireLock: async () => true,
        secret: INVITE_SECRET,
        now: () => NOW,
        ...extra,
    };
    return { ...fake, linkDeps };
}

function hookRequest(
    body: unknown,
    options: { secret?: string | null; method?: string; ip?: string; rawBody?: string } = {},
): Request {
    const url = new URL(`${ORIGIN}/api/nps-link-hook`);
    const secret = options.secret === undefined ? WEBHOOK_SECRET : options.secret;
    if (secret !== null) url.searchParams.set('secret', secret);
    const method = options.method ?? 'POST';
    return new Request(url, {
        method,
        headers: {
            'content-type': 'application/json',
            'cf-connecting-ip': options.ip ?? `203.0.113.${(ipCounter += 1) % 200}`,
        },
        body: method === 'GET' || method === 'HEAD' ? undefined : options.rawBody ?? JSON.stringify(body),
    });
}

const ODOO_BODY = { _action: 'NPS: gerar link(#817)', _id: 61, _model: 'crm.lead' };

test('issues a signed invite for an eligible lead and writes the URL to x_nps_link', async () => {
    const { linkDeps, writes, notes, reads } = deps(wonLead());
    const outcome = await issueNpsLinkForLead(61, linkDeps);

    assert.equal(outcome.status, 'issued');
    assert.equal(reads[0].leadId, 61);
    assert.equal(writes.length, 1);
    assert.equal(writes[0].leadId, 61);
    const url = new URL(String(writes[0].fields[NPS_LINK_FIELD]));
    assert.equal(`${url.origin}${url.pathname}`, 'https://www.anhanga.tur.br/nps');
    assert.deepEqual([...url.searchParams.keys()], ['token']);

    const verification = await verifyNpsInviteToken(url.searchParams.get('token') ?? '', INVITE_SECRET);
    assert.equal(verification.valid, true);
    if (verification.valid) {
        assert.equal(verification.payload.email, 'felipewilliam@gmail.com');
        assert.equal(verification.payload.firstname, 'Felipe');
        const days = (verification.payload.exp - Date.now()) / (24 * 60 * 60 * 1000);
        assert.ok(days > 29.9 && days <= 30, `expiry ~30 days, got ${days}`);
    }

    assert.equal(notes.length, 1);
    assert.match(notes[0], /^Link de NPS gerado \(uso único, válido até \d{2}\/\d{2}\/\d{4}\)/);
    assert.ok(!notes[0].includes('token'), 'the note never carries the link');
});

test('never overwrites an existing link, and stays silent about it (repeated webhook)', async () => {
    const { linkDeps, writes, notes } = deps(wonLead({ [NPS_LINK_FIELD]: 'https://www.anhanga.tur.br/nps?token=old' }));
    const outcome = await issueNpsLinkForLead(61, linkDeps);
    assert.deepEqual(outcome, { status: 'skipped', reason: 'already_issued' });
    assert.equal(writes.length, 0);
    assert.equal(notes.length, 0);
});

test('skips ineligible leads with an internal note and no write', async () => {
    const cases: [Record<string, unknown>, string][] = [
        [{ won_status: 'pending' }, 'not_won'],
        [{ email_from: false }, 'missing_email'],
        [{ email_from: 'not-an-email' }, 'missing_email'],
        [{ partner_id: false, contact_name: false }, 'missing_name'],
        [{ x_data_de_retorno: false }, 'missing_return_date'],
        [{ x_data_de_retorno: '2026-11-12' }, 'return_in_future'],
        [{ x_data_de_retorno: '2026-10-11' }, 'return_too_old'],
    ];
    for (const [overrides, reason] of cases) {
        const { linkDeps, writes, notes } = deps(wonLead(overrides));
        const outcome = await issueNpsLinkForLead(61, linkDeps);
        assert.deepEqual(outcome, { status: 'skipped', reason }, reason);
        assert.equal(writes.length, 0, reason);
        assert.equal(notes.length, 1, reason);
        assert.match(notes[0], /^Link de NPS não gerado: /, reason);
    }
});

test('a missing or archived lead is skipped without a note', async () => {
    for (const [lead, reason] of [[null, 'not_found'], [wonLead({ active: false }), 'archived']] as const) {
        const { linkDeps, writes, notes } = deps(lead);
        assert.deepEqual(await issueNpsLinkForLead(61, linkDeps), { status: 'skipped', reason });
        assert.equal(writes.length + notes.length, 0);
    }
});

test('return window uses the São Paulo date: day 30 still qualifies, day 31 does not', () => {
    // 11/11 00:30 in São Paulo is still 11/11 there, though 03:30 UTC.
    const justAfterMidnight = Date.UTC(2026, 10, 11, 3, 30);
    assert.equal(checkNpsLinkEligibility(wonLead({ x_data_de_retorno: '2026-10-12' }), justAfterMidnight).eligible, true);
    assert.equal(checkNpsLinkEligibility(wonLead({ x_data_de_retorno: '2026-11-11' }), justAfterMidnight).eligible, true);
    // 10/11 23:30 in São Paulo: 11/11 is still in the future there.
    const lateEvening = Date.UTC(2026, 10, 11, 2, 30);
    assert.deepEqual(checkNpsLinkEligibility(wonLead({ x_data_de_retorno: '2026-11-11' }), lateEvening), {
        eligible: false,
        reason: 'return_in_future',
    });
    assert.deepEqual(checkNpsLinkEligibility(wonLead({ x_data_de_retorno: '2026-10-11' }), justAfterMidnight), {
        eligible: false,
        reason: 'return_too_old',
    });
});

test('first name comes from the partner, then the contact name; company contacts keep the person', () => {
    assert.equal(firstNameOf({ partner_id: [1, 'Ana Maria Souza'] }), 'Ana');
    assert.equal(firstNameOf({ partner_id: [1, 'Empresa X, João Silva'] }), 'João');
    assert.equal(firstNameOf({ partner_id: false, contact_name: '  Bia  ' }), 'Bia');
    assert.equal(firstNameOf({ partner_id: false, contact_name: false }), '');
});

test('does nothing when another call holds the lead lock', async () => {
    const { linkDeps, writes, reads } = deps(wonLead(), { acquireLock: async () => false });
    assert.deepEqual(await issueNpsLinkForLead(61, linkDeps), { status: 'busy' });
    assert.equal(reads.length + writes.length, 0);
});

test('refuses to run without the invite secret or the Odoo config', async () => {
    for (const extra of [{ secret: null }, { getConfig: () => null }] as Partial<NpsLinkDeps>[]) {
        const { linkDeps, reads } = deps(wonLead(), extra);
        assert.deepEqual(await issueNpsLinkForLead(61, linkDeps), { status: 'not_configured' });
        assert.equal(reads.length, 0);
    }
});

test('an Odoo failure is reported, never thrown', async () => {
    const { linkDeps } = deps(wonLead(), {
        openSession: async () => {
            throw new Error('ODOO_ERROR:502:boom');
        },
    });
    assert.deepEqual(await issueNpsLinkForLead(61, linkDeps), { status: 'failed' });
});

test('skip notes exist for the reasons the team can fix, not for silent ones', () => {
    assert.equal(buildNpsLinkSkippedNote('already_issued'), null);
    assert.equal(buildNpsLinkSkippedNote('not_found'), null);
    assert.match(buildNpsLinkSkippedNote('missing_return_date') ?? '', /Data de Retorno/);
});

// --- webhook handler ---

test('hook: only POST', async () => {
    const response = await handleNpsLinkHook(hookRequest(null, { method: 'GET' }), { webhookSecret: WEBHOOK_SECRET });
    assert.equal(response.status, 405);
    assert.equal(response.headers.get('allow'), 'POST');
});

test('hook: answers CONFIG_ERROR when the webhook secret is not set', async () => {
    let issued = 0;
    const response = await handleNpsLinkHook(hookRequest(ODOO_BODY), {
        webhookSecret: null,
        issue: async () => {
            issued += 1;
            return { status: 'issued', expiresAt: 0 };
        },
    });
    assert.equal(response.status, 500);
    assert.equal((await response.json()).code, 'CONFIG_ERROR');
    assert.equal(issued, 0);
});

test('hook: rejects a missing or wrong secret before reading the body', async () => {
    for (const secret of [null, '', 'wrong-secret', `${WEBHOOK_SECRET}x`]) {
        let issued = 0;
        const response = await handleNpsLinkHook(hookRequest(ODOO_BODY, { secret }), {
            webhookSecret: WEBHOOK_SECRET,
            issue: async () => {
                issued += 1;
                return { status: 'issued', expiresAt: 0 };
            },
        });
        assert.equal(response.status, 401, String(secret));
        assert.equal((await response.json()).code, 'UNAUTHORIZED');
        assert.equal(issued, 0);
    }
});

test('hook: rejects bodies that are not an Odoo crm.lead notification', async () => {
    const bodies = [
        { rawBody: '{not json' },
        { body: { _model: 'res.partner', _id: 61 } },
        { body: { _model: 'crm.lead', _id: '61' } },
        { body: { _model: 'crm.lead', _id: 0 } },
        { body: { _model: 'crm.lead' } },
    ];
    for (const { body, rawBody } of bodies) {
        const response = await handleNpsLinkHook(hookRequest(body, { rawBody }), {
            webhookSecret: WEBHOOK_SECRET,
            issue: async () => assert.fail('must not issue'),
        });
        assert.equal(response.status, 400);
        assert.equal((await response.json()).code, 'VALIDATION_ERROR');
    }
});

test('hook: answers 202 at once and runs the work in waitUntil, with only the lead id from the body', async () => {
    const pending: Promise<unknown>[] = [];
    const ids: number[] = [];
    const response = await handleNpsLinkHook(hookRequest({ ...ODOO_BODY, email_from: 'attacker@example.com' }), {
        webhookSecret: WEBHOOK_SECRET,
        waitUntil: (promise) => pending.push(promise),
        issue: async (leadId) => {
            ids.push(leadId);
            return { status: 'issued', expiresAt: 0 };
        },
    });
    assert.equal(response.status, 202);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(Object.keys(body).sort().join(','), 'ok,requestId', 'never returns the link');
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(pending.length, 1);
    await Promise.all(pending);
    assert.deepEqual(ids, [61]);
});

test('hook: end to end, the link lands in Odoo and not in the response', async () => {
    const { linkDeps, writes } = deps(wonLead());
    const response = await handleNpsLinkHook(hookRequest(ODOO_BODY), { ...linkDeps, webhookSecret: WEBHOOK_SECRET });
    assert.equal(response.status, 202);
    assert.equal(writes.length, 1);
    assert.ok(!(await response.text()).includes('token'));
});

test('hook: rate limits by IP before the secret check', async () => {
    const ip = '198.51.100.250';
    let last: Response | null = null;
    for (let i = 0; i < 61; i += 1) {
        last = await handleNpsLinkHook(hookRequest(ODOO_BODY, { ip, secret: 'wrong' }), { webhookSecret: WEBHOOK_SECRET });
    }
    assert.equal(last?.status, 429);
    assert.ok(last?.headers.get('retry-after'));
});

test('the webhook secret is redacted from URLs sent to Sentry', () => {
    const scrubbed = scrubSensitiveUrl(`${ORIGIN}/api/nps-link-hook?secret=${WEBHOOK_SECRET}`);
    assert.ok(!scrubbed.includes(WEBHOOK_SECRET), scrubbed);
});

test('the link opens on production, or on the preview deploy that signed it', async () => {
    assert.equal(npsLinkOriginFor('https://www.anhanga.tur.br/api/nps-link-hook?secret=x'), 'https://www.anhanga.tur.br');
    assert.equal(npsLinkOriginFor('https://anhanga.tur.br/api/nps-link-hook'), 'https://www.anhanga.tur.br');
    assert.equal(
        npsLinkOriginFor('https://feat-nps-link.av-site-8ex.pages.dev/api/nps-link-hook'),
        'https://feat-nps-link.av-site-8ex.pages.dev',
    );
    assert.equal(npsLinkOriginFor('http://evil.pages.dev/api/nps-link-hook'), 'https://www.anhanga.tur.br');
    assert.equal(npsLinkOriginFor('https://evil.example/api/nps-link-hook'), 'https://www.anhanga.tur.br');

    const { linkDeps, writes } = deps(wonLead());
    const preview = 'https://feat-nps-link.av-site-8ex.pages.dev';
    const request = new Request(`${preview}/api/nps-link-hook?secret=${WEBHOOK_SECRET}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.240' },
        body: JSON.stringify(ODOO_BODY),
    });
    assert.equal((await handleNpsLinkHook(request, { ...linkDeps, webhookSecret: WEBHOOK_SECRET })).status, 202);
    assert.ok(String(writes[0].fields[NPS_LINK_FIELD]).startsWith(`${preview}/nps?token=`));
});
