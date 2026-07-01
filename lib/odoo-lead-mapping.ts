/**
 * Pure mapping from the site's validated form payloads to Odoo records.
 *
 * Two Odoo records are involved (Fase 0 contract + migration review):
 *  - `res.partner` — every form upserts the contact (dedup by e-mail) and writes
 *    the custom funnel fields (`x_perfil_do_viajante`, `x_lgpd_consent`). This is
 *    what the native Odoo nurture segments filter on.
 *  - `crm.lead` — only lead/corporativo/contato create an opportunity (linked to
 *    the partner via `partner_id`). Quiz and waitlist are ToFu: partner only, so
 *    they don't inflate the pipeline.
 *
 * IDs (`source_id`/`medium_id`/`stage_id`/`team_id`) are fixed records of the
 * `anhanga` instance, validated via MCP against the contract's §3 table.
 */
import type { LeadTracking, LeadUtms, SubmitLeadRequest } from '../types/leadCapture';
import type { SubmitContactRequest } from '../types/contactCapture';
import type { SubmitQuizRequest } from '../types/quiz';
import type { SubmitWaitlistRequest } from '../types/waitlist';
import type { SubmitNpsRequest } from './schemas/submit-nps';
import {
    type RegionTagId,
    resolveQuizDestinoTags,
    resolveRegionTagsFromText,
} from './destination-region';

// utm.source / utm.medium record IDs (see contract §3, validated against instance).
const SOURCE = { referral: 8, googleAds: 17, metaAds: 18, quiz: 16, whatsapp: 19, site: 15 } as const;
const MEDIUM = { indicacao: 6, cpc: 7, organic: 8 } as const;
const DEFAULT_SOURCE_MEDIUM = { source_id: SOURCE.site, medium_id: MEDIUM.organic } as const;

// crm.lead fixed records.
const STAGE_NOVO = 1;
const TEAM_SALES = 1;

const PAID_MEDIUMS = new Set(['cpc', 'ppc', 'paid']);
const META_SOURCES = new Set(['facebook', 'instagram', 'meta']);

// x_perfil_do_viajante selection — the site's quiz ProfileKey matches 1:1.
const VALID_PROFILE_KEYS = new Set([
    'escapista',
    'bon-vivant',
    'viajante-de-verdade',
    'desbravador',
    'nomade-de-alma',
]);

export type LeadFormType = 'lead' | 'contact' | 'quiz' | 'waitlist' | 'nps';

/** Explicit non-UTM origin signal, when the form itself implies a channel. */
export type OriginSignal = 'referral' | 'quiz' | 'whatsapp' | null;

export interface OdooLeadInput {
    formType: LeadFormType;
    /** Whether this form should also create a crm.lead opportunity. */
    createsLead: boolean;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    /** E-mail-marketing opt-in → x_lgpd_consent (NOT the privacy/LGPD gate). */
    marketingOptIn: boolean;
    /** Quiz ProfileKey → x_perfil_do_viajante (selection). */
    profileKey?: string | null;
    /** "Destino de Interesse" tags (res.partner.category) → category_id. */
    destinationTagIds?: RegionTagId[];
    destination?: string | null;
    bantSummary?: string | null;
    referred?: string | null;
    empresa?: string | null;
    cargo?: string | null;
    eventId?: string | null;
    utms: LeadUtms;
    tracking?: LeadTracking;
    originSignal: OriginSignal;
    /** Free-text context for partner-only forms (quiz/waitlist/nps) — no crm.lead. */
    contextNote?: string | null;
    /** Post-trip NPS (0-10) → x_nps_score. */
    npsScore?: number;
    /**
     * Skip overwriting `name` on an existing partner match. Set by adapters whose
     * form only captures a partial name (e.g. NPS asks for firstname only) so a
     * fuller name already on file isn't clobbered.
     */
    preserveName?: boolean;
}

export interface SourceMedium {
    source_id: number;
    medium_id: number;
}

/**
 * Resolves utm/origin signals to Odoo source/medium IDs (contract §3, first match
 * wins). Default is the safe Site/organic pair.
 */
export function resolveSourceMedium(utms: LeadUtms, signal: OriginSignal): SourceMedium {
    if (signal === 'referral') return { source_id: SOURCE.referral, medium_id: MEDIUM.indicacao };

    const source = (utms.utm_source ?? '').toLowerCase();
    const medium = (utms.utm_medium ?? '').toLowerCase();
    const isPaid = PAID_MEDIUMS.has(medium);

    if (source === 'google' && isPaid) return { source_id: SOURCE.googleAds, medium_id: MEDIUM.cpc };
    if (META_SOURCES.has(source) && isPaid) return { source_id: SOURCE.metaAds, medium_id: MEDIUM.cpc };
    if (signal === 'quiz') return { source_id: SOURCE.quiz, medium_id: MEDIUM.organic };
    if (signal === 'whatsapp') return { source_id: SOURCE.whatsapp, medium_id: MEDIUM.organic };

    return { ...DEFAULT_SOURCE_MEDIUM };
}

function fullName(firstName: string, lastName: string): string {
    return `${firstName} ${lastName}`.trim();
}

/**
 * Builds the `res.partner` create/write dict. Only includes fields with content:
 * `x_lgpd_consent` is written only when opting in (we never revoke consent on an
 * update), and `x_perfil_do_viajante` only for a recognized quiz profile.
 * `category_id` uses link commands `(4, id)` so tags are added without removing
 * any existing ones on a deduped partner.
 */
export function buildPartnerFields(input: OdooLeadInput): Record<string, unknown> {
    const fields: Record<string, unknown> = { name: fullName(input.firstName, input.lastName) };

    if (input.email) fields.email = input.email;
    if (input.phone) fields.phone = input.phone;
    if (input.marketingOptIn) fields.x_lgpd_consent = true;
    if (input.profileKey && VALID_PROFILE_KEYS.has(input.profileKey)) {
        fields.x_perfil_do_viajante = input.profileKey;
    }
    if (input.destinationTagIds && input.destinationTagIds.length > 0) {
        fields.category_id = input.destinationTagIds.map((id) => [4, id]);
    }
    if (input.contextNote) fields.comment = input.contextNote;
    if (typeof input.npsScore === 'number') fields.x_nps_score = input.npsScore;

    return fields;
}

function buildDescriptionHtml(input: OdooLeadInput): string {
    // Values arrive already sanitized (cleanString/normalizeNullable escape `<`/`>`
    // at validation), so they are inserted as-is — re-escaping would double-encode.
    const items: string[] = [];
    const push = (label: string, value: string | null | undefined) => {
        if (value) items.push(`<li>${label}: ${value}</li>`);
    };

    push('BANT', input.bantSummary);
    push('Destino', input.destination);
    push('Indicado por', input.referred);
    push('Empresa', input.empresa);
    push('Cargo', input.cargo);

    const t = input.tracking;
    push('gclid', t?.gclid);
    push('fbclid', t?.fbclid);
    push('fbp', t?.fbp);
    push('fbc', t?.fbc);
    push('GA cid', t?.cid);
    push('GA sid', t?.sid);
    push('utm_campaign', input.utms.utm_campaign);
    push('utm_term', input.utms.utm_term);
    push('utm_content', input.utms.utm_content);
    push('event_id', input.eventId);

    return items.length > 0 ? `<ul>${items.join('')}</ul>` : '';
}

/**
 * Builds the `crm.lead` create dict for forms that become an opportunity. Links
 * the deduped partner via `partner_id`.
 */
export function buildLeadFields(input: OdooLeadInput, partnerId: number): Record<string, unknown> {
    const name = fullName(input.firstName, input.lastName);
    const title = input.destination ? `Lead Site — ${name} (${input.destination})` : `Lead Site — ${name}`;
    const { source_id, medium_id } = resolveSourceMedium(input.utms, input.originSignal);

    const fields: Record<string, unknown> = {
        name: title,
        type: 'opportunity',
        stage_id: STAGE_NOVO,
        team_id: TEAM_SALES,
        partner_id: partnerId,
        contact_name: name,
        source_id,
        medium_id,
    };

    if (input.email) fields.email_from = input.email;
    if (input.phone) fields.phone = input.phone;
    if (input.referred) fields.referred = input.referred;
    if (input.empresa) fields.partner_name = input.empresa;
    if (input.cargo) fields.function = input.cargo;

    const description = buildDescriptionHtml(input);
    if (description) fields.description = description;

    return fields;
}

// --- Per-form adapters: validated payload → OdooLeadInput ------------------

export function leadInputFromSubmitLead(data: SubmitLeadRequest): OdooLeadInput {
    return {
        formType: 'lead',
        createsLead: true,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        phone: data.whatsapp || null,
        marketingOptIn: data.marketingOptIn === true,
        destination: data.destination,
        destinationTagIds: resolveRegionTagsFromText(data.destination),
        bantSummary: data.bantSummary,
        empresa: data.empresa ?? null,
        cargo: data.cargo ?? null,
        eventId: data.event_id ?? null,
        utms: data.utms,
        tracking: data.tracking,
        originSignal: null,
    };
}

export function leadInputFromSubmitContact(data: SubmitContactRequest): OdooLeadInput {
    return {
        formType: 'contact',
        createsLead: true,
        firstName: data.firstName,
        lastName: data.lastName ?? '',
        email: data.email ?? null,
        phone: data.whatsapp || null,
        marketingOptIn: data.emailOptIn === true,
        destination: data.destination ?? null,
        destinationTagIds: resolveRegionTagsFromText(data.destination ?? null),
        eventId: data.eventId ?? null,
        utms: data.utms,
        tracking: data.tracking,
        originSignal: null,
    };
}

function buildContextNote(parts: Array<string | null | undefined>): string | null {
    const lines = parts.filter((p): p is string => Boolean(p && p.trim()));
    return lines.length > 0 ? lines.join('\n') : null;
}

export function leadInputFromSubmitQuiz(data: SubmitQuizRequest): OdooLeadInput {
    const contextNote = buildContextNote([
        data.bantSummary,
        data.destinos && data.destinos.length > 0 ? `Destinos: ${data.destinos.join(', ')}` : null,
        data.utms.utm_source ? `utm_source: ${data.utms.utm_source}` : null,
        data.utms.utm_medium ? `utm_medium: ${data.utms.utm_medium}` : null,
        data.utms.utm_campaign ? `utm_campaign: ${data.utms.utm_campaign}` : null,
    ]);

    return {
        formType: 'quiz',
        createsLead: false,
        firstName: data.firstName,
        lastName: data.lastName ?? '',
        email: data.email || null,
        phone: data.whatsapp || null,
        marketingOptIn: data.newsletterOptIn === true,
        profileKey: data.profileKey,
        destinationTagIds: resolveQuizDestinoTags(data.destinos),
        utms: data.utms,
        tracking: data.tracking,
        originSignal: 'quiz',
        contextNote,
    };
}

const EMPTY_UTMS: LeadUtms = {
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_term: null,
    utm_content: null,
};

/**
 * Post-trip NPS form → partner-only update (no crm.lead — the opportunity is
 * already Won by the time NPS is collected). Score goes to `x_nps_score`;
 * reason/highlight are appended to `comment` since there is no dedicated
 * free-text NPS field on res.partner.
 */
export function leadInputFromSubmitNps(data: SubmitNpsRequest): OdooLeadInput {
    const contextNote = buildContextNote([
        `NPS ${data.score}/10 — ${data.reason}`,
        data.highlight ? `Momento marcante: ${data.highlight}` : null,
    ]);

    return {
        formType: 'nps',
        createsLead: false,
        firstName: data.firstname,
        lastName: '',
        email: data.email,
        phone: null,
        marketingOptIn: false,
        npsScore: data.score,
        utms: EMPTY_UTMS,
        originSignal: null,
        contextNote,
        preserveName: true,
    };
}

export function leadInputFromSubmitWaitlist(data: SubmitWaitlistRequest): OdooLeadInput {
    const parts = data.name.trim().split(/\s+/).filter(Boolean);
    const [firstName = data.name.trim(), ...rest] = parts;

    const contextNote = buildContextNote([
        `Lista de espera — origem: ${data.sourcePage}`,
        data.utms.utm_source ? `utm_source: ${data.utms.utm_source}` : null,
        data.utms.utm_medium ? `utm_medium: ${data.utms.utm_medium}` : null,
        data.utms.utm_campaign ? `utm_campaign: ${data.utms.utm_campaign}` : null,
    ]);

    return {
        formType: 'waitlist',
        createsLead: false,
        firstName,
        lastName: rest.join(' '),
        email: data.email || null,
        phone: null,
        marketingOptIn: data.emailOptIn === true,
        utms: data.utms,
        tracking: data.tracking,
        originSignal: null,
        contextNote,
    };
}
