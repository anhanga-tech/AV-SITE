/**
 * Aplica o ledger na borda do Odoo. Opt-in de e-mail vira um grant append-only;
 * gclid/fbclid/UTM só seguem se o recibo de medição ainda for o estado efetivo.
 * Falha do ledger não perde o lead: o envio segue sem o booleano e sem
 * identificadores de campanha.
 */
import type { AttributionConsentReceipt } from '../types/leadCapture';
import { logger } from './logger';
import { adsGrantIsActive, effectiveAction, isAnonSubjectKey, isConsentEventId } from './consent-ledger';
import { ADS_NOTICE_VERSION, EMAIL_NOTICE_VERSION } from './consent-notices';
import { emailSubjectKey, getConsentStore, ConsentLedgerUnavailable } from './consent-store';
import { stripMarketingAttribution } from './marketing-attribution';
import type { OdooLeadInput } from './odoo-lead-mapping';

export interface SubmissionConsent {
    input: OdooLeadInput;
    /** Revogação vigente: o write do parceiro precisa forçar x_lgpd_consent = false. */
    enforceEmailRevoke: boolean;
}

function emailEventId(input: OdooLeadInput): string {
    const material = input.eventId?.trim()
        || `${input.formType}:${input.email ?? ''}:${input.destination ?? ''}:${input.bantSummary ?? ''}`;
    const safe = material.replace(/[^\w:.-]/g, '_').slice(0, 60);
    const id = `em_${input.formType}_${safe}`;
    return id.length >= 8 ? id : `em_${input.formType}_missing`;
}

export function readAttributionConsent(raw: unknown): AttributionConsentReceipt | null {
    if (!raw || typeof raw !== 'object') return null;
    const record = raw as Record<string, unknown>;
    const eventId = typeof record.eventId === 'string' ? record.eventId.trim() : '';
    const subjectKey = typeof record.subjectKey === 'string' ? record.subjectKey.trim() : '';
    if (!isConsentEventId(eventId) || !isAnonSubjectKey(subjectKey)) return null;
    return { eventId, subjectKey };
}

async function emailDecision(input: OdooLeadInput): Promise<{ granted: boolean; revoked: boolean }> {
    if (!input.marketingOptIn || !input.email) return { granted: false, revoked: false };
    try {
        const subjectKey = await emailSubjectKey(input.email);
        const store = getConsentStore();
        const outcome = await store.append({
            id: emailEventId(input),
            subjectKey,
            purpose: 'email_marketing',
            action: 'grant',
            noticeVersion: EMAIL_NOTICE_VERSION,
            origin: input.formType,
            occurredAt: new Date().toISOString(),
        });
        const effective = effectiveAction(outcome.events, 'email_marketing');
        return { granted: effective === 'grant', revoked: effective === 'revoke' };
    } catch (error) {
        if (!(error instanceof ConsentLedgerUnavailable)) {
            logger.warn('CONSENT_LEDGER', {
                stage: 'email_grant_failed',
                detail: error instanceof Error ? error.message : 'unknown',
            });
        } else {
            logger.warn('CONSENT_LEDGER', { stage: 'email_grant_unavailable' });
        }
        return { granted: false, revoked: false };
    }
}

async function adsMeasurementGranted(receipt: AttributionConsentReceipt | null | undefined, email: string | null): Promise<boolean> {
    if (!receipt) return false;
    try {
        const store = getConsentStore();
        const events = await store.readSubject(receipt.subjectKey);
        if (!adsGrantIsActive(events, receipt.eventId)) return false;
        if (email) {
            const subjectKey = await emailSubjectKey(email);
            await store.linkAnonEmail(receipt.subjectKey, subjectKey);
        }
        return true;
    } catch (error) {
        logger.warn('CONSENT_LEDGER', {
            stage: 'ads_receipt_failed',
            detail: error instanceof Error ? error.message : 'unknown',
        });
        return false;
    }
}

export async function prepareSubmissionConsent(input: OdooLeadInput): Promise<SubmissionConsent> {
    const email = await emailDecision(input);
    const adsGranted = await adsMeasurementGranted(input.attributionConsent, input.email);
    const gated = adsGranted ? input : stripMarketingAttribution(input);
    return {
        input: { ...gated, marketingOptIn: email.granted },
        enforceEmailRevoke: email.revoked,
    };
}

export { ADS_NOTICE_VERSION };
