/**
 * Shared attribution-normalization contract for the four client-side capture
 * hooks (lead, contact, quiz, waitlist). Each hook used to carry its own copy
 * of this logic (issue #1148) — they had drifted: `useContactForm` sanitized
 * values through `cleanString` (XSS-escaping `<`/`>`, bounding length),
 * while `useLeadCapture`/`useQuizCapture`/`useWaitlistCapture` only trimmed.
 * This module is the one source of truth; every hook now sanitizes the same
 * way, since these values eventually reach CRM notes and logs.
 */
import { cleanString } from './lead-logic';
import type { LeadTracking, LeadUtms } from '../types/leadCapture';

const KNOWN_TRACKING_KEYS = new Set([
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'cid',
    'sid',
    'gclid',
    'fbclid',
    'msclkid',
    'ttclid',
    'wbraid',
    'gbraid',
    'fbc',
    'fbp',
]);

function toNullable(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const normalized = cleanString(value);
    return normalized.length > 0 ? normalized : null;
}

/**
 * Shapes the raw tracking dictionary captured by `utils/whatsapp.ts`'s
 * `getTrackingDataObject()` into the `LeadTracking` contract every submit
 * payload sends: the 5 UTM fields, supported click identifiers (Google,
 * Meta, Microsoft, TikTok), GA4 client/session identifiers, and any
 * unrecognized key (e.g. `ref`, dynamic `hsa_*` Microsoft Ads params)
 * bucketed into `extras`.
 */
export function normalizeLeadTracking(source: Record<string, string> | null | undefined): LeadTracking {
    const raw = source ?? {};
    const extras: Record<string, string> = {};

    for (const [key, value] of Object.entries(raw)) {
        if (KNOWN_TRACKING_KEYS.has(key)) continue;
        const normalized = toNullable(value);
        if (normalized) extras[key] = normalized;
    }

    return {
        utm_source: toNullable(raw.utm_source),
        utm_medium: toNullable(raw.utm_medium),
        utm_campaign: toNullable(raw.utm_campaign),
        utm_term: toNullable(raw.utm_term),
        utm_content: toNullable(raw.utm_content),
        cid: toNullable(raw.cid),
        sid: toNullable(raw.sid),
        gclid: toNullable(raw.gclid),
        fbclid: toNullable(raw.fbclid),
        msclkid: toNullable(raw.msclkid),
        ttclid: toNullable(raw.ttclid),
        wbraid: toNullable(raw.wbraid),
        gbraid: toNullable(raw.gbraid),
        fbc: toNullable(raw.fbc),
        fbp: toNullable(raw.fbp),
        extras: Object.keys(extras).length > 0 ? extras : undefined,
    };
}

/** Projects the 5 UTM fields out of an already-normalized `LeadTracking`. */
export function extractUtms(tracking: LeadTracking): LeadUtms {
    return {
        utm_source: tracking.utm_source ?? null,
        utm_medium: tracking.utm_medium ?? null,
        utm_campaign: tracking.utm_campaign ?? null,
        utm_term: tracking.utm_term ?? null,
        utm_content: tracking.utm_content ?? null,
    };
}
