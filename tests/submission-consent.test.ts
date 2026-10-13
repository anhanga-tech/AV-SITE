import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareSubmissionConsent } from '../lib/submission-consent.ts';
import { effectiveAction } from '../lib/consent-ledger.ts';
import { emailSubjectKey, getConsentStore } from '../lib/consent-store.ts';
import type { OdooLeadInput } from '../lib/odoo-lead-mapping.ts';

const utms = {
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_term: null,
    utm_content: null,
};

function formInput(
    formType: 'quiz' | 'waitlist',
    email: string,
    marketingOptIn: boolean,
    eventId?: string,
): OdooLeadInput {
    return {
        formType,
        createsLead: false,
        firstName: 'Maria',
        lastName: 'Silva',
        email,
        phone: null,
        marketingOptIn,
        bantSummary: 'Quiz Anhangá · Perfil: Escapista',
        utms,
        originSignal: formType === 'quiz' ? 'quiz' : null,
        eventId: eventId ?? null,
    };
}

async function revokeEmail(email: string, id: string): Promise<void> {
    const subjectKey = await emailSubjectKey(email);
    await getConsentStore().append({
        id,
        subjectKey,
        purpose: 'email_marketing',
        action: 'revoke',
        noticeVersion: '2026-10-13',
        origin: 'privacy_page',
        occurredAt: new Date().toISOString(),
    });
}

test('quiz and waitlist opt-in after a revocation records a new grant', async () => {
    for (const formType of ['quiz', 'waitlist'] as const) {
        const email = `${formType}-restore@example.com`;
        const first = await prepareSubmissionConsent(formInput(formType, email, true));
        assert.equal(first.input.marketingOptIn, true, formType);

        await revokeEmail(email, `emrev_${formType}_restore`);

        const second = await prepareSubmissionConsent(formInput(formType, email, true));
        assert.equal(second.input.marketingOptIn, true, formType);
        assert.equal(second.enforceEmailRevoke, false, formType);

        const subjectKey = await emailSubjectKey(email);
        const events = await getConsentStore().readSubject(subjectKey);
        const grants = events.filter((event) => event.action === 'grant');
        assert.equal(grants.length, 2, formType);
        assert.notEqual(grants[0]?.id, grants[1]?.id);
        for (const event of grants) {
            assert.equal(event.id.includes('@'), false, event.id);
            assert.equal(event.id.includes(email.split('@')[0] ?? email), false, event.id);
        }
        assert.equal(effectiveAction(events, 'email_marketing'), 'grant');
    }
});

test('replaying the same submission event id does not restore a revoked email grant', async () => {
    const email = 'lead-replay-no-restore@example.com';
    const eventId = 'lead_11111111-1111-4111-8111-111111111111';
    const input = { ...formInput('quiz', email, true, eventId), formType: 'lead' as const, createsLead: true };

    const first = await prepareSubmissionConsent(input);
    assert.equal(first.input.marketingOptIn, true);

    await revokeEmail(email, 'emrev_lead_replay');

    const second = await prepareSubmissionConsent(input);
    assert.equal(second.input.marketingOptIn, false);
    assert.equal(second.enforceEmailRevoke, true);

    const subjectKey = await emailSubjectKey(email);
    const events = await getConsentStore().readSubject(subjectKey);
    assert.equal(events.filter((event) => event.action === 'grant').length, 1);
    assert.equal(effectiveAction(events, 'email_marketing'), 'revoke');
});

test('a form submit without the checkbox repeats a recorded email revoke', async () => {
    const email = 'pending-revoke-resubmit@example.com';
    await revokeEmail(email, 'emrev_pending_resubmit');

    const result = await prepareSubmissionConsent(formInput('waitlist', email, false));
    assert.equal(result.input.marketingOptIn, false);
    assert.equal(result.enforceEmailRevoke, true);

    const subjectKey = await emailSubjectKey(email);
    const events = await getConsentStore().readSubject(subjectKey);
    assert.equal(events.length, 1);
    assert.equal(events[0]?.action, 'revoke');
});

test('an unchecked box does not revoke an active email grant', async () => {
    const email = 'unchecked-keeps-grant@example.com';
    await prepareSubmissionConsent(formInput('quiz', email, true));

    const result = await prepareSubmissionConsent(formInput('quiz', email, false));
    assert.equal(result.enforceEmailRevoke, false);
    assert.equal(result.input.marketingOptIn, false);

    const subjectKey = await emailSubjectKey(email);
    const events = await getConsentStore().readSubject(subjectKey);
    assert.equal(events.length, 1);
    assert.equal(effectiveAction(events, 'email_marketing'), 'grant');
});

test('a ledger failure does not force an email revoke', async () => {
    process.env.CONSENT_LEDGER_FORCE_FAIL = '1';
    try {
        const result = await prepareSubmissionConsent(formInput('quiz', 'ledger-down-revoke@example.com', false));
        assert.equal(result.enforceEmailRevoke, false);
        assert.equal(result.input.marketingOptIn, false);
    } finally {
        delete process.env.CONSENT_LEDGER_FORCE_FAIL;
    }
});
