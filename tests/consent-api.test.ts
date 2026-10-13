import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/consent.ts';
import { effectiveAction } from '../lib/consent-ledger.ts';
import { emailSubjectKey, getConsentStore } from '../lib/consent-store.ts';
import { createOdooMock, setOdooEnv, clearOdooEnv } from './odoo-mock.ts';

const originalFetch = global.fetch;
let ip = 20;

function post(body: Record<string, unknown>): Request {
    ip += 1;
    return new Request('http://localhost/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-real-ip': `10.9.0.${ip}` },
        body: JSON.stringify(body),
    });
}

const anon = 'anon:44444444-4444-4444-8444-444444444444';

test('consent API grants ads measurement and replays the same event id', async () => {
    const body = {
        purpose: 'ads_measurement',
        action: 'grant',
        origin: 'cookie_banner',
        eventId: 'ads_api_grant_01',
        subjectKey: anon,
        occurredAt: '2026-10-13T12:00:00.000Z',
    };
    const first = await handler(post(body));
    const second = await handler(post(body));
    assert.equal(first.status, 201);
    assert.equal(second.status, 201);

    const payload = await second.json() as { effective: string; registered: boolean; subjectKey: string };
    assert.equal(payload.effective, 'grant');
    assert.equal(payload.registered, true);
    assert.equal(payload.subjectKey, anon);

    const events = await getConsentStore().readSubject(anon);
    assert.equal(events.filter((event) => event.id === 'ads_api_grant_01').length, 1);
});

test('consent API rejects an email marketing grant', async () => {
    const response = await handler(post({
        purpose: 'email_marketing',
        action: 'grant',
        origin: 'privacy_page',
        eventId: 'em_api_grant_rejected',
        email: 'grant-rejected@example.com',
    }));
    assert.equal(response.status, 400);
});

test('a stale ads grant does not restore a newer revocation', async () => {
    const subject = 'anon:55555555-5555-4555-8555-555555555555';
    const revoked = await handler(post({
        purpose: 'ads_measurement',
        action: 'revoke',
        origin: 'cookie_banner',
        eventId: 'ads_api_revoke_newer',
        subjectKey: subject,
        occurredAt: '2026-10-13T15:00:00.000Z',
    }));
    const late = await handler(post({
        purpose: 'ads_measurement',
        action: 'grant',
        origin: 'cookie_banner',
        eventId: 'ads_api_grant_older',
        subjectKey: subject,
        occurredAt: '2026-10-13T14:00:00.000Z',
    }));
    assert.equal(revoked.status, 201);
    assert.equal(late.status, 201);
    const payload = await late.json() as { effective: string; registered: boolean };
    assert.equal(payload.effective, 'revoke');
    assert.equal(payload.registered, false);
});

test('email revocation stays recorded when the Odoo write fails and does not say the address exists', async () => {
    const email = 'revoke-odoo-fail@example.com';
    setOdooEnv();
    const mock = createOdooMock({ existingPartnerId: 77 });
    let writeAttempted = false;
    global.fetch = (async (input, init) => {
        const body = JSON.parse(String(init?.body ?? '{}')) as { params?: { args?: unknown[] } };
        if (body.params?.args?.[4] === 'write') {
            writeAttempted = true;
            return new Response(JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                error: { message: 'write failed' },
            }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        return mock.fetch(input, init);
    }) as typeof fetch;

    try {
        const response = await handler(post({
            purpose: 'email_marketing',
            action: 'revoke',
            origin: 'privacy_page',
            eventId: 'emrev_odoo_write_fail',
            email,
            occurredAt: '2026-10-13T16:00:00.000Z',
        }));
        assert.equal(response.status, 201);
        const payload = await response.json() as Record<string, unknown>;
        assert.equal(payload.ok, true);
        assert.equal(payload.effective, 'revoke');
        assert.equal('odooSync' in payload, false);
        assert.equal(JSON.stringify(payload).includes('77'), false);

        const subjectKey = await emailSubjectKey(email);
        const events = await getConsentStore().readSubject(subjectKey);
        assert.equal(effectiveAction(events, 'email_marketing'), 'revoke');
        assert.equal(writeAttempted, true);
    } finally {
        global.fetch = originalFetch;
        clearOdooEnv();
    }
});

test('a future occurredAt is clamped to server time and loses to a later act', async () => {
    const email = 'future-revoke@example.com';
    const before = Date.now();
    const response = await handler(post({
        purpose: 'email_marketing',
        action: 'revoke',
        origin: 'privacy_page',
        eventId: 'emrev_future_clamp',
        email,
        occurredAt: '9999-01-01T00:00:00.000Z',
    }));
    assert.equal(response.status, 201);

    const subjectKey = await emailSubjectKey(email);
    const revoked = await getConsentStore().readSubject(subjectKey);
    assert.equal(revoked.length, 1);
    const revokeAt = Date.parse(revoked[0]?.occurredAt ?? '');
    assert.ok(revokeAt >= before - 1000);
    assert.ok(revokeAt <= Date.now() + 1000);
    assert.equal(revoked[0]?.occurredAt.startsWith('9999'), false);

    await getConsentStore().append({
        id: 'em_quiz_after_clamped_revoke',
        subjectKey,
        purpose: 'email_marketing',
        action: 'grant',
        noticeVersion: '2026-10-13',
        origin: 'quiz',
        occurredAt: new Date(Date.now() + 5000).toISOString(),
    });
    const events = await getConsentStore().readSubject(subjectKey);
    assert.equal(effectiveAction(events, 'email_marketing'), 'grant');
});

test('a future ads grant does not outrank a later refusal', async () => {
    const subject = 'anon:66666666-6666-4666-8666-666666666666';
    const grant = await handler(post({
        purpose: 'ads_measurement',
        action: 'grant',
        origin: 'cookie_banner',
        eventId: 'ads_future_grant_01',
        subjectKey: subject,
        occurredAt: '9999-06-01T00:00:00.000Z',
    }));
    const revoke = await handler(post({
        purpose: 'ads_measurement',
        action: 'revoke',
        origin: 'cookie_banner',
        eventId: 'ads_later_refuse_01',
        subjectKey: subject,
    }));
    assert.equal(grant.status, 201);
    assert.equal(revoke.status, 201);
    const payload = await revoke.json() as { effective: string; registered: boolean };
    assert.equal(payload.effective, 'revoke');
    assert.equal(payload.registered, false);
});

test('a past occurredAt stays the act time', async () => {
    const subject = 'anon:77777777-7777-4777-8777-777777777777';
    const occurredAt = '2026-10-13T10:00:00.000Z';
    const response = await handler(post({
        purpose: 'ads_measurement',
        action: 'grant',
        origin: 'cookie_banner',
        eventId: 'ads_past_stamp_01',
        subjectKey: subject,
        occurredAt,
    }));
    assert.equal(response.status, 201);
    const events = await getConsentStore().readSubject(subject);
    assert.equal(events[0]?.occurredAt, occurredAt);
});

test('an older email revoke does not clear Odoo while the ledger stays granted', async () => {
    const email = 'older-revoke-no-write@example.com';
    setOdooEnv();
    const mock = createOdooMock({ existingPartnerId: 88 });
    global.fetch = mock.fetch;
    try {
        const subjectKey = await emailSubjectKey(email);
        await getConsentStore().append({
            id: 'em_lead_newer_than_revoke',
            subjectKey,
            purpose: 'email_marketing',
            action: 'grant',
            noticeVersion: '2026-10-13',
            origin: 'lead',
            occurredAt: new Date().toISOString(),
        });
        const response = await handler(post({
            purpose: 'email_marketing',
            action: 'revoke',
            origin: 'privacy_page',
            eventId: 'emrev_older_than_grant',
            email,
            occurredAt: '2020-01-01T00:00:00.000Z',
        }));
        assert.equal(response.status, 201);
        const payload = await response.json() as { effective: string };
        assert.equal(payload.effective, 'grant');
        const wroteConsent = mock.calls.some((call) => call.model === 'res.partner' && call.method === 'write');
        assert.equal(wroteConsent, false);
    } finally {
        global.fetch = originalFetch;
        clearOdooEnv();
    }
});

test('replaying an older email grant does not restore a revocation', async () => {
    const email = 'replay-email@example.com';
    const grant = {
        purpose: 'email_marketing',
        action: 'revoke',
        origin: 'privacy_page',
        eventId: 'emrev_replay_once',
        email,
        occurredAt: '2026-10-13T17:00:00.000Z',
    };
    assert.equal((await handler(post(grant))).status, 201);
    assert.equal((await handler(post(grant))).status, 201);
    const subjectKey = await emailSubjectKey(email);
    const events = await getConsentStore().readSubject(subjectKey);
    assert.equal(events.length, 1);
    assert.equal(effectiveAction(events, 'email_marketing'), 'revoke');
});
