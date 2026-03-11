import type { LeadTracking, LeadUtms, SubmitLeadRequest } from '../types/leadCapture';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
]);

/**
 * Sanitize strings to prevent XSS and remove leading/trailing whitespace.
 */
export function cleanString(value: unknown): string {
    if (typeof value !== 'string') return '';
    return value.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Normalizes a string or returns null if empty.
 */
export function normalizeNullable(value: unknown, maxLength = 255): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (trimmed.length === 0) return null;
    const sanitized = trimmed.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return sanitized.length > maxLength ? sanitized.substring(0, maxLength) : sanitized;
}

/**
 * Normalizes UTM parameters.
 */
export function normalizeUtms(value: unknown): LeadUtms {
    const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

    return {
        utm_source: normalizeNullable(source.utm_source),
        utm_medium: normalizeNullable(source.utm_medium),
        utm_campaign: normalizeNullable(source.utm_campaign),
        utm_term: normalizeNullable(source.utm_term),
        utm_content: normalizeNullable(source.utm_content),
    };
}

/**
 * Normalizes tracking parameters.
 */
export function normalizeTracking(value: unknown, utms: LeadUtms): LeadTracking {
    const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
    const extrasInput = source.extras && typeof source.extras === 'object'
        ? (source.extras as Record<string, unknown>)
        : {};

    const extras: Record<string, string> = {};
    let count = 0;

    const processExtra = (key: string, raw: unknown) => {
        const normalized = normalizeNullable(raw);
        if (normalized) {
            const cleanKey = key.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;').substring(0, 64);
            extras[cleanKey] = normalized;
            count++;
        }
    };

    // Limit the number of extra properties to 15 to prevent payload inflation
    for (const [key, raw] of Object.entries(extrasInput)) {
        if (count >= 15) break;
        processExtra(key, raw);
    }

    for (const [key, raw] of Object.entries(source)) {
        if (count >= 15) break;
        if (key === 'extras' || KNOWN_TRACKING_KEYS.has(key)) continue;
        processExtra(key, raw);
    }

    return {
        utm_source: normalizeNullable(source.utm_source) ?? utms.utm_source,
        utm_medium: normalizeNullable(source.utm_medium) ?? utms.utm_medium,
        utm_campaign: normalizeNullable(source.utm_campaign) ?? utms.utm_campaign,
        utm_term: normalizeNullable(source.utm_term) ?? utms.utm_term,
        utm_content: normalizeNullable(source.utm_content) ?? utms.utm_content,
        cid: normalizeNullable(source.cid),
        sid: normalizeNullable(source.sid),
        gclid: normalizeNullable(source.gclid),
        fbclid: normalizeNullable(source.fbclid),
        msclkid: normalizeNullable(source.msclkid),
        ttclid: normalizeNullable(source.ttclid),
        wbraid: normalizeNullable(source.wbraid),
        gbraid: normalizeNullable(source.gbraid),
        fbc: normalizeNullable(source.fbc),
        extras: Object.keys(extras).length > 0 ? extras : undefined,
    };
}

/**
 * Validates the lead submission payload.
 */
export function validatePayload(payload: unknown): { valid: true; data: SubmitLeadRequest } | { valid: false; error: string } {
    if (!payload || typeof payload !== 'object') {
        return { valid: false, error: 'Payload inválido.' };
    }

    const raw = payload as Record<string, unknown>;
    const firstName = cleanString(raw.firstName);
    const lastName = cleanString(raw.lastName);
    const email = cleanString(raw.email).toLowerCase();
    const bantSummary = cleanString(raw.bantSummary);
    const destination = cleanString(raw.destination);

    if (!firstName || !lastName || !email || !bantSummary || !destination) {
        return { valid: false, error: 'Campos obrigatórios ausentes.' };
    }

    if (firstName.length > 100 || lastName.length > 100 || email.length > 255 || bantSummary.length > 5000 || destination.length > 255) {
        return { valid: false, error: 'Entrada muito longa.' };
    }

    if (!EMAIL_REGEX.test(email)) {
        return { valid: false, error: 'Email inválido.' };
    }

    const utms = normalizeUtms(raw.utms);
    const tracking = normalizeTracking(raw.tracking, utms);

    return {
        valid: true,
        data: {
            firstName,
            lastName,
            email,
            bantSummary,
            destination,
            utms,
            tracking,
        },
    };
}
