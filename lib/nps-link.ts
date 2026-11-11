/**
 * Per-customer NPS link issued for the Odoo post-trip automation.
 *
 * The Odoo template can't sign anything (no secret may live in a template, and
 * Odoo's sandbox can't compute an HMAC or make an HTTP call that reads the
 * answer). So the flow is a webhook plus a write-back:
 *
 * 1. Odoo's rule (2 days after `x_data_de_retorno`) sends its built-in
 *    "Send Webhook Notification" to `/api/nps-link-hook` — a POST whose body
 *    only carries `_model` and `_id` (see api/nps-link-hook.ts for the auth).
 * 2. This module re-reads that lead from Odoo with the site's own credential
 *    (the payload is never trusted), checks it is eligible, mints the usual
 *    signed invite (lib/nps-invite.ts: 30 days, single use) and writes the
 *    ready URL to `crm.lead.x_nps_link`.
 * 3. A second Odoo rule fires on that write and sends template 54, whose
 *    button is `object.x_nps_link`.
 *
 * Eligibility (all required): opportunity won, active, a valid `email_from`,
 * a first name, a return date between 30 days ago and today (São Paulo), and
 * no `x_nps_link` yet. The last one makes a repeated webhook harmless: it
 * never overwrites a link (so never triggers a second e-mail). To re-issue,
 * clear the field in Odoo and fire the webhook again.
 *
 * A skipped lead gets an internal note saying why, so the team sees it; the
 * note never carries the link or the token. Never log the lead id, the e-mail,
 * the name or the URL.
 */
import { z } from 'zod';

import { getOdooConfig, openOdooSession, type OdooConfig, type OdooSession } from '../services/odoo';
import { logger } from './logger';
import { createNpsInviteToken, getNpsInviteSecret, NPS_INVITE_DEFAULT_MAX_AGE_MS } from './nps-invite';
import { getRedisClient, isEdgeRuntime } from './redis-client';

export const NPS_LINK_PRODUCTION_ORIGIN = 'https://www.anhanga.tur.br';
/** The Odoo field the link is written to (created by hand in Odoo, type Char). */
export const NPS_LINK_FIELD = 'x_nps_link';
/** A trip that ended longer ago than this no longer gets an automatic survey. */
export const NPS_LINK_MAX_DAYS_AFTER_RETURN = 30;
const LOCK_PREFIX = 'nps:link:lead';
const LOCK_TTL_SECONDS = 10 * 60;
const DAY_MS = 24 * 60 * 60 * 1000;

export const NPS_LINK_LEAD_FIELDS = [
    'active',
    'won_status',
    'email_from',
    'contact_name',
    'partner_id',
    'x_data_de_retorno',
    NPS_LINK_FIELD,
] as const;

export type NpsLinkSkipReason =
    | 'not_found'
    | 'archived'
    | 'not_won'
    | 'missing_email'
    | 'missing_name'
    | 'missing_return_date'
    | 'return_in_future'
    | 'return_too_old'
    | 'already_issued';

export type NpsLinkOutcome =
    | { status: 'issued'; expiresAt: number }
    | { status: 'skipped'; reason: NpsLinkSkipReason }
    | { status: 'busy' }
    | { status: 'not_configured' }
    | { status: 'failed' };

type LeadSession = Pick<OdooSession, 'readLead' | 'writeLead' | 'postLeadNote'>;

export interface NpsLinkDeps {
    getConfig?: () => OdooConfig | null;
    openSession?: (config: OdooConfig) => Promise<LeadSession>;
    /** Returns true when this call owns the lead for the lock window. */
    acquireLock?: (leadId: number) => Promise<boolean>;
    secret?: string | null;
    now?: () => number;
    /**
     * Origin of the deploy that answered the webhook (see `npsLinkOriginFor`):
     * the link must be checked by the same `NPS_INVITE_SECRET` that signed it.
     */
    origin?: string;
}

/**
 * Production for the real hosts; the deploy's own origin for a Pages preview
 * (`*.pages.dev`) or local dev, so a preview test link opens on the preview
 * that signed it. Any other host falls back to production.
 */
export function npsLinkOriginFor(requestUrl: string): string {
    const url = new URL(requestUrl);
    const host = url.hostname.toLowerCase();
    if (url.protocol === 'https:' && host.endsWith('.pages.dev')) return url.origin;
    if (host === 'localhost' || host === '127.0.0.1') return url.origin;
    return NPS_LINK_PRODUCTION_ORIGIN;
}

const EMAIL_SCHEMA = z.email().max(254);

const SAO_PAULO_DATE = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
});

const BR_DATE = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
});

/** Whole days between two `YYYY-MM-DD` dates (`to - from`). */
function daysBetween(from: string, to: string): number {
    return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

function isBlank(value: unknown): boolean {
    return value === false || value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
}

/** First word of the partner's name, else of the lead's contact name. */
export function firstNameOf(lead: Record<string, unknown>): string {
    const partner = lead.partner_id;
    const partnerName = Array.isArray(partner) && typeof partner[1] === 'string' ? partner[1] : '';
    const contactName = typeof lead.contact_name === 'string' ? lead.contact_name : '';
    for (const candidate of [partnerName, contactName]) {
        // Odoo shows a company contact as "Company, Person": keep the person.
        const person = candidate.includes(',') ? candidate.split(',').pop() ?? '' : candidate;
        const first = person.trim().split(/\s+/)[0] ?? '';
        if (first && first.length <= 100) return first;
    }
    return '';
}

export type NpsLinkEligibility =
    | { eligible: true; email: string; firstname: string }
    | { eligible: false; reason: NpsLinkSkipReason };

/** Pure check of a lead row read from Odoo; `now` decides "today" in São Paulo. */
export function checkNpsLinkEligibility(lead: Record<string, unknown> | null, now: number): NpsLinkEligibility {
    if (!lead) return { eligible: false, reason: 'not_found' };
    if (lead.active === false) return { eligible: false, reason: 'archived' };
    if (lead.won_status !== 'won') return { eligible: false, reason: 'not_won' };
    if (!isBlank(lead[NPS_LINK_FIELD])) return { eligible: false, reason: 'already_issued' };

    const email = typeof lead.email_from === 'string' ? lead.email_from.trim().toLowerCase() : '';
    if (!EMAIL_SCHEMA.safeParse(email).success) return { eligible: false, reason: 'missing_email' };

    const firstname = firstNameOf(lead);
    if (!firstname) return { eligible: false, reason: 'missing_name' };

    const returnDate = typeof lead.x_data_de_retorno === 'string' ? lead.x_data_de_retorno : '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(returnDate)) return { eligible: false, reason: 'missing_return_date' };
    const daysSinceReturn = daysBetween(returnDate, SAO_PAULO_DATE.format(now));
    if (daysSinceReturn < 0) return { eligible: false, reason: 'return_in_future' };
    if (daysSinceReturn > NPS_LINK_MAX_DAYS_AFTER_RETURN) return { eligible: false, reason: 'return_too_old' };

    return { eligible: true, email, firstname };
}

const SKIP_NOTES: Record<NpsLinkSkipReason, string | null> = {
    not_found: null,
    archived: null,
    not_won: 'a oportunidade não está como Ganha',
    missing_email: 'falta um e-mail válido na oportunidade',
    missing_name: 'falta o nome do contato',
    missing_return_date: 'falta a Data de Retorno',
    return_in_future: 'a Data de Retorno ainda não passou',
    return_too_old: `a viagem terminou há mais de ${NPS_LINK_MAX_DAYS_AFTER_RETURN} dias`,
    // Silent: a repeated webhook is expected and must stay a no-op.
    already_issued: null,
};

export function buildNpsLinkSkippedNote(reason: NpsLinkSkipReason): string | null {
    const why = SKIP_NOTES[reason];
    return why ? `Link de NPS não gerado: ${why}. Corrija e dispare o envio de novo.` : null;
}

export function buildNpsLinkIssuedNote(expiresAt: number): string {
    return `Link de NPS gerado (uso único, válido até ${BR_DATE.format(expiresAt)}). O e-mail sai pela automação.`;
}

export function buildNpsLinkUrl(token: string, origin: string = NPS_LINK_PRODUCTION_ORIGIN): string {
    const url = new URL('/nps', origin);
    url.searchParams.set('token', token);
    return url.toString();
}

async function defaultAcquireLock(leadId: number): Promise<boolean> {
    const redis = await getRedisClient();
    if (!redis) return !isEdgeRuntime();
    const result = await redis.set(`${LOCK_PREFIX}:${leadId}`, '1', { nx: true, ex: LOCK_TTL_SECONDS });
    return result === 'OK';
}

/**
 * Issues the link for one lead. Never throws: it runs in the webhook's
 * `waitUntil`, after Odoo already has its answer.
 */
export async function issueNpsLinkForLead(leadId: number, deps: NpsLinkDeps = {}): Promise<NpsLinkOutcome> {
    try {
        const secret = deps.secret === undefined ? getNpsInviteSecret() : deps.secret || null;
        const config = (deps.getConfig ?? getOdooConfig)();
        if (!secret || !config) {
            logger.error('NPS_LINK', { stage: 'config_missing', invite: Boolean(secret), odoo: Boolean(config) });
            return { status: 'not_configured' };
        }

        if (!(await (deps.acquireLock ?? defaultAcquireLock)(leadId))) {
            logger.warn('NPS_LINK', { stage: 'busy' });
            return { status: 'busy' };
        }

        const session = await (deps.openSession ?? openOdooSession)(config);
        const now = (deps.now ?? Date.now)();
        const lead = await session.readLead(leadId, NPS_LINK_LEAD_FIELDS);
        const eligibility = checkNpsLinkEligibility(lead, now);
        if (!eligibility.eligible) {
            logger.info('NPS_LINK', { stage: 'skipped', reason: eligibility.reason });
            const note = buildNpsLinkSkippedNote(eligibility.reason);
            if (note) await session.postLeadNote(leadId, note);
            return { status: 'skipped', reason: eligibility.reason };
        }

        // `exp` is stamped from the real clock inside createNpsInviteToken; the
        // note only shows the date, so this approximation is exact enough.
        const expiresAt = Date.now() + NPS_INVITE_DEFAULT_MAX_AGE_MS;
        const token = await createNpsInviteToken({ email: eligibility.email, firstname: eligibility.firstname }, secret);
        await session.writeLead(leadId, { [NPS_LINK_FIELD]: buildNpsLinkUrl(token, deps.origin) });
        await session.postLeadNote(leadId, buildNpsLinkIssuedNote(expiresAt));
        logger.info('NPS_LINK', { stage: 'issued' });
        return { status: 'issued', expiresAt };
    } catch (error) {
        logger.error('NPS_LINK', {
            stage: 'failed',
            errorName: error instanceof Error ? error.name : typeof error,
        });
        return { status: 'failed' };
    }
}
