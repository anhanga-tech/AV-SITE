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

/**
 * Lead e contato mandam um eventId por tentativa (estável no retry daquela
 * tentativa). Quiz e waitlist não mandam: um id derivado do e-mail repetia o
 * grant antigo e a revogação nunca saía. Sem id válido, cada envio ganha um
 * id opaco — e o e-mail não entra na chave.
 */
function emailEventId(input: OdooLeadInput): string {
    const provided = input.eventId?.trim() ?? '';
    const material = isConsentEventId(provided) ? provided : crypto.randomUUID();
    const safe = material.replace(/[^\w:.-]/g, '_').slice(0, 60);
    const id = `em_${input.formType}_${safe}`;
    return isConsentEventId(id) ? id : `em_${input.formType}_${Date.now()}`;
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
    if (!input.email) return { granted: false, revoked: false };
    try {
        const subjectKey = await emailSubjectKey(input.email);
        const store = getConsentStore();
        // Checkbox desmarcado não é revogação: qualquer um reenviaria o
        // formulário e apagaria o opt-in. Mas se a revogação já está no
        // ledger e o write no Odoo ficou pendente, este envio repete o write.
        if (!input.marketingOptIn) {
            const events = await store.readSubject(subjectKey);
            return { granted: false, revoked: effectiveAction(events, 'email_marketing') === 'revoke' };
        }
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
    const [email, adsGranted] = await Promise.all([
        emailDecision(input),
        adsMeasurementGranted(input.attributionConsent, input.email),
    ]);
    const gated = adsGranted ? input : stripMarketingAttribution(input);
    return {
        input: { ...gated, marketingOptIn: email.granted },
        enforceEmailRevoke: email.revoked,
    };
}

export { ADS_NOTICE_VERSION };
