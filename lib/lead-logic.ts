import type { LeadTracking, LeadUtms, SubmitLeadRequest } from '../types/leadCapture';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PHONE_DIGITS = 10;
const MAX_PHONE_DIGITS = 15;

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

/**
 * Sanitize strings to prevent XSS and remove leading/trailing whitespace.
 * Includes a maximum length check to prevent DoS via excessive regex execution.
 */
export function maskEmail(email: string): string {
    const [localPart, domainPart] = email.split('@');
    if (!domainPart) return 'hidden';
    const firstChar = localPart?.trim().charAt(0) || '*';
    return `${firstChar}***@${domainPart}`;
}

export function cleanString(value: unknown): string {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    const truncated = trimmed.length > 10000 ? trimmed.substring(0, 10000) : trimmed;
    return truncated.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Normalizes a string or returns null if empty.
 * Includes a maximum length check to prevent DoS via excessive regex execution.
 */
export function normalizeNullable(value: unknown, maxLength = 255): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (trimmed.length === 0) return null;
    const truncated = trimmed.length > 10000 ? trimmed.substring(0, 10000) : trimmed;
    const sanitized = truncated.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (sanitized.length <= maxLength) return sanitized;
    let cut = sanitized.substring(0, maxLength);
    const lastAmp = cut.lastIndexOf('&');
    if (lastAmp !== -1 && !cut.includes(';', lastAmp)) {
        cut = cut.substring(0, lastAmp);
    }
    return cut;
}

export function normalizeWhatsappNumber(value: unknown, defaultCountryCode = '+55'): string | null {
    if (typeof value !== 'string') return null;

    const trimmed = value.trim();
    if (!trimmed) return null;

    const countryDigits = defaultCountryCode.replace(/\D/g, '');
    if (!countryDigits) return null;

    const sanitized = trimmed.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const digits = sanitized.replace(/\D/g, '');
    if (!digits) return null;

    const normalizedDigits = sanitized.startsWith('+')
        ? digits
        : digits.startsWith(countryDigits)
            ? digits
            : `${countryDigits}${digits}`;

    if (normalizedDigits.length < MIN_PHONE_DIGITS || normalizedDigits.length > MAX_PHONE_DIGITS) {
        return null;
    }

    return `+${normalizedDigits}`;
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

function toRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function sanitizeTrackingKey(key: string): string {
    return key.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;').substring(0, 64);
}

function normalizeTrackingExtras(source: Record<string, unknown>): Record<string, string> | undefined {
    const extrasInput = toRecord(source.extras);
    const extras: Record<string, string> = {};

    const appendExtra = (key: string, raw: unknown) => {
        if (Object.keys(extras).length >= 15) return;

        const normalized = normalizeNullable(raw);
        if (!normalized) return;

        extras[sanitizeTrackingKey(key)] = normalized;
    };

    for (const [key, raw] of Object.entries(extrasInput)) {
        appendExtra(key, raw);
    }

    for (const [key, raw] of Object.entries(source)) {
        if (key === 'extras' || KNOWN_TRACKING_KEYS.has(key)) continue;
        appendExtra(key, raw);
    }

    return Object.keys(extras).length > 0 ? extras : undefined;
}

/**
 * Normalizes tracking parameters.
 */
export function normalizeTracking(value: unknown, utms: LeadUtms): LeadTracking {
    const source = toRecord(value);

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
        fbp: normalizeNullable(source.fbp),
        extras: normalizeTrackingExtras(source),
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
    const whatsapp = normalizeWhatsappNumber(raw.whatsapp);
    const eventId = normalizeNullable(raw.event_id, 128) ?? undefined;
    const bantSummary = cleanString(raw.bantSummary);
    const destination = cleanString(raw.destination);

    if (!firstName || !lastName || !email || !whatsapp || !bantSummary || !destination) {
        return { valid: false, error: 'Campos obrigatórios ausentes.' };
    }

    if (firstName.length > 100 || lastName.length > 100 || email.length > 255 || whatsapp.length > 16 || bantSummary.length > 5000 || destination.length > 255) {
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
            whatsapp,
            event_id: eventId,
            bantSummary,
            destination,
            utms,
            tracking,
        },
    };
}
