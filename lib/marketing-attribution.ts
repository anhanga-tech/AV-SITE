/**
 * Identificadores de campanha paga. Não são analytics de legítimo interesse:
 * só podem ser persistidos ou enviados ao CRM depois de um consentimento de
 * medição registrado (issues #1543 e #1545).
 */
import type { LeadTracking, LeadUtms } from '../types/leadCapture';
import type { OdooLeadInput } from './odoo-lead-mapping';

export const MARKETING_PARAM_NAMES = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'gclid',
    'fbclid',
    'ttclid',
    'wbraid',
    'gbraid',
    'msclkid',
    'fbc',
    'fbp',
] as const;

const MARKETING_KEYS = new Set<string>(MARKETING_PARAM_NAMES);

export const EMPTY_UTMS: LeadUtms = {
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_term: null,
    utm_content: null,
};

export function isMarketingAttributionKey(key: string): boolean {
    return MARKETING_KEYS.has(key) || key.startsWith('hsa_');
}

function stripExtras(extras: Record<string, string> | undefined): Record<string, string> | undefined {
    if (!extras) return undefined;
    const kept: Record<string, string> = {};
    for (const [key, value] of Object.entries(extras)) {
        if (!isMarketingAttributionKey(key) && value) kept[key] = value;
    }
    return Object.keys(kept).length > 0 ? kept : undefined;
}

export function stripMarketingTracking(tracking: LeadTracking | undefined): LeadTracking | undefined {
    if (!tracking) return tracking;
    return {
        ...tracking,
        utm_source: null,
        utm_medium: null,
        utm_campaign: null,
        utm_term: null,
        utm_content: null,
        gclid: null,
        fbclid: null,
        msclkid: null,
        ttclid: null,
        wbraid: null,
        gbraid: null,
        fbc: null,
        fbp: null,
        extras: stripExtras(tracking.extras),
    };
}

/** Linhas `utm_*: …` que os adaptadores de quiz/waitlist colocam na nota do parceiro. */
export function redactAttributionNote(note: string | null | undefined): string | null {
    if (!note) return note ?? null;
    const kept = note
        .split('\n')
        .filter((line) => !/^utm_(source|medium|campaign|term|content):/i.test(line.trim()));
    const text = kept.join('\n').trim();
    return text.length > 0 ? text : null;
}

export function stripMarketingAttribution(input: OdooLeadInput): OdooLeadInput {
    return {
        ...input,
        utms: { ...EMPTY_UTMS },
        tracking: stripMarketingTracking(input.tracking),
        contextNote: redactAttributionNote(input.contextNote),
    };
}
