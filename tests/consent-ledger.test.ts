import test from 'node:test';
import assert from 'node:assert/strict';
import { adsGrantIsActive, effectiveAction, planAppend, type ConsentEventDraft } from '../lib/consent-ledger.ts';

const draft = (overrides: Partial<ConsentEventDraft> = {}): ConsentEventDraft => ({
    id: 'evt-grant-0001',
    subjectKey: 'anon:00000000-0000-4000-8000-000000000001',
    purpose: 'ads_measurement',
    action: 'grant',
    noticeVersion: '2026-10-13',
    origin: 'cookie_banner',
    occurredAt: '2026-10-13T12:00:00.000Z',
    ...overrides,
});

test('planAppend is a no-op when the same event id is replayed', () => {
    const first = planAppend([], draft(), '2026-10-13T12:00:01.000Z');
    const second = planAppend(first.events, draft(), '2026-10-13T12:00:09.000Z');
    assert.equal(first.status, 'appended');
    assert.equal(second.status, 'replay');
    assert.equal(second.events.length, 1);
    assert.equal(second.events[0]?.recordedAt, '2026-10-13T12:00:01.000Z');
});

test('a later grant with an older occurredAt does not undo a revocation', () => {
    const revoked = planAppend([], draft({
        id: 'evt-revoke-0001',
        action: 'revoke',
        occurredAt: '2026-10-13T13:00:00.000Z',
    }), '2026-10-13T13:00:01.000Z');
    const lateGrant = planAppend(revoked.events, draft({
        id: 'evt-grant-late',
        action: 'grant',
        occurredAt: '2026-10-13T12:00:00.000Z',
    }), '2026-10-13T13:05:00.000Z');

    assert.equal(lateGrant.status, 'appended');
    assert.equal(lateGrant.events.length, 2);
    assert.equal(effectiveAction(lateGrant.events, 'ads_measurement'), 'revoke');
    assert.equal(adsGrantIsActive(lateGrant.events, 'evt-grant-late'), false);
});

test('a new grant with a newer occurredAt restores ads measurement', () => {
    const revoked = planAppend([], draft({
        id: 'evt-revoke-0002',
        action: 'revoke',
        occurredAt: '2026-10-13T12:00:00.000Z',
    }), '2026-10-13T12:00:01.000Z');
    const granted = planAppend(revoked.events, draft({
        id: 'evt-grant-0002',
        occurredAt: '2026-10-13T12:05:00.000Z',
    }), '2026-10-13T12:05:01.000Z');

    assert.equal(effectiveAction(granted.events, 'ads_measurement'), 'grant');
    assert.equal(adsGrantIsActive(granted.events, 'evt-grant-0002'), true);
    assert.equal(adsGrantIsActive(granted.events, 'evt-revoke-0002'), false);
});

test('email marketing and ads measurement do not share effective state', () => {
    const ads = planAppend([], draft(), '2026-10-13T12:00:01.000Z');
    const email = planAppend(ads.events, draft({
        id: 'evt-email-revoke',
        purpose: 'email_marketing',
        action: 'revoke',
        occurredAt: '2026-10-13T12:10:00.000Z',
    }), '2026-10-13T12:10:01.000Z');

    assert.equal(effectiveAction(email.events, 'ads_measurement'), 'grant');
    assert.equal(effectiveAction(email.events, 'email_marketing'), 'revoke');
});
