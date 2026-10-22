/**
 * Internal notes on the Odoo `crm.lead` of a proposal (#1904, epic #1894):
 * one when the proposal is created ("Proposta enviada: <link>") and one per
 * relevant open ("Proposta aberta em dd/mm/aaaa às hh:mm (SP), Nª vez") — the
 * same opens that notify the sales bot (lib/proposal-webhook.ts).
 *
 * The bot (Clara) reads the link from here, so it never travels in the
 * webhook. Notes carry nothing about the customer beyond what the lead
 * already holds: no IP, city or device.
 *
 * Never throws: a CRM outage must not break proposal creation or the page.
 * Never log the lead id or the note body (it has the proposal link).
 */
import { getOdooConfig, openOdooSession, type OdooConfig, type OdooSession } from '../services/odoo';
import { logger } from './logger';

export type ProposalNoteOutcome = 'recorded' | 'skipped' | 'failed';

export interface ProposalOdooNotesDeps {
    getConfig?: () => OdooConfig | null;
    openSession?: (config: OdooConfig) => Promise<Pick<OdooSession, 'postLeadNote'>>;
}

const SAO_PAULO_DATE_TIME = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
});

const SAO_PAULO_DATE = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
});

/** `22/10/2026 às 12:30`, in São Paulo time. */
export function formatSaoPauloDateTime(ms: number): string {
    const parts = Object.fromEntries(SAO_PAULO_DATE_TIME.formatToParts(ms).map((part) => [part.type, part.value]));
    return `${parts.day}/${parts.month}/${parts.year} às ${parts.hour}:${parts.minute}`;
}

export function buildProposalSentNote(input: { url: string; expiresAt: number }): string {
    return `Proposta enviada: ${input.url} (válida até ${SAO_PAULO_DATE.format(input.expiresAt)})`;
}

export function buildProposalOpenedNote(input: { openedAt: number; count: number }): string {
    return `Proposta aberta em ${formatSaoPauloDateTime(input.openedAt)} (horário de São Paulo), ${input.count}ª vez`;
}

export async function postProposalNote(
    leadId: number | undefined,
    body: string,
    deps: ProposalOdooNotesDeps = {},
): Promise<ProposalNoteOutcome> {
    if (leadId === undefined) return 'skipped';
    const config = (deps.getConfig ?? getOdooConfig)();
    if (!config) {
        logger.info('PROPOSAL_ODOO_NOTE', { stage: 'not_configured' });
        return 'skipped';
    }
    try {
        const session = await (deps.openSession ?? openOdooSession)(config);
        await session.postLeadNote(leadId, body);
        return 'recorded';
    } catch (error) {
        // Status only: the Odoo fault detail can echo the note (and its link).
        const status = error instanceof Error ? /^ODOO_ERROR:(\d+):/.exec(error.message)?.[1] : undefined;
        logger.error('PROPOSAL_ODOO_NOTE', {
            stage: 'failed',
            status,
            errorName: error instanceof Error ? error.name : typeof error,
        });
        return 'failed';
    }
}
