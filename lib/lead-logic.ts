import { z } from 'zod';
import type { LeadTracking, LeadUtms, SubmitLeadRequest } from '../types/leadCapture';
import { SubmitLeadBodySchema } from './schemas/submit-lead';
import { isRecord } from './type-guards';

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

export function maskPhone(phone: string): string {
    const trimmed = phone.trim();
    if (trimmed.length <= 6) return '***';
    return `${trimmed.slice(0, 3)}***${trimmed.slice(-3)}`;
}

export function maskName(name: string): string {
    const trimmed = name.trim();
    if (trimmed.length === 0) return '***';
    return `${trimmed.charAt(0)}***`;
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
    const source = isRecord(value) ? value : {};

    return {
        utm_source: normalizeNullable(source.utm_source),
        utm_medium: normalizeNullable(source.utm_medium),
        utm_campaign: normalizeNullable(source.utm_campaign),
        utm_term: normalizeNullable(source.utm_term),
        utm_content: normalizeNullable(source.utm_content),
    };
}

function toRecord(value: unknown): Record<string, unknown> {
    return isRecord(value) ? value : {};
}

function sanitizeTrackingKey(key: string): string {
    return key.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;').substring(0, 64);
}

const MAX_TRACKING_EXTRAS = 15;

function normalizeTrackingExtras(source: Record<string, unknown>): Record<string, string> | undefined {
    const extrasInput = toRecord(source.extras);
    const extras: Record<string, string> = {};

    // Returns false once the cap is reached so callers can stop iterating over
    // an attacker-supplied object with an unbounded number of keys.
    const appendExtra = (key: string, raw: unknown): boolean => {
        if (Object.keys(extras).length >= MAX_TRACKING_EXTRAS) return false;

        const normalized = normalizeNullable(raw);
        if (normalized) {
            extras[sanitizeTrackingKey(key)] = normalized;
        }

        return true;
    };

    for (const [key, raw] of Object.entries(extrasInput)) {
        if (!appendExtra(key, raw)) break;
    }

    for (const [key, raw] of Object.entries(source)) {
        if (key === 'extras' || KNOWN_TRACKING_KEYS.has(key)) continue;
        if (!appendExtra(key, raw)) break;
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

function mapZodError(error: z.ZodError): string {
    const issue = error.issues[0];
    if (issue?.code === 'too_big') return 'Entrada muito longa.';
    if (issue?.code === 'invalid_format' && 'format' in issue && issue.format === 'email') return 'Email inválido.';
    return 'Campos obrigatórios ausentes.';
}

/**
 * Validates the lead submission payload.
 */
export function validatePayload(payload: unknown): { valid: true; data: SubmitLeadRequest } | { valid: false; error: string } {
    const parsed = SubmitLeadBodySchema.safeParse(payload);
    if (!parsed.success) {
        return { valid: false, error: mapZodError(parsed.error) };
    }

    const raw = parsed.data;
    const firstName = cleanString(raw.firstName);
    const lastName = cleanString(raw.lastName);
    const email = cleanString(raw.email).toLowerCase();
    const whatsapp = normalizeWhatsappNumber(raw.whatsapp);
    const eventId = normalizeNullable(raw.event_id, 128) ?? undefined;
    const bantSummary = cleanString(raw.bantSummary);
    const destination = cleanString(raw.destination);
    const empresa = normalizeNullable(raw.empresa) ?? undefined;
    const cargo = normalizeNullable(raw.cargo) ?? undefined;
    const referred = normalizeNullable(raw.referred) ?? undefined;

    // normalizeWhatsappNumber can still fail for strings Zod accepted (e.g. non-digit-only content)
    if (!whatsapp) {
        return { valid: false, error: 'Campos obrigatórios ausentes.' };
    }

    // cleanString can zero out strings that Zod accepted as non-empty (e.g. whitespace-only input)
    if (!firstName || !lastName || !bantSummary || !destination) {
        return { valid: false, error: 'Campos obrigatórios ausentes.' };
    }

    // Safety net: cleanString expands HTML entities which can push lengths past the Zod-checked raw limits
    if (
        firstName.length > 100
        || lastName.length > 100
        || bantSummary.length > 5000
        || destination.length > 255
        || (empresa && empresa.length > 255)
        || (cargo && cargo.length > 255)
        || (referred && referred.length > 255)
    ) {
        return { valid: false, error: 'Entrada muito longa.' };
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
            empresa,
            cargo,
            referred,
            marketingOptIn: raw.marketingOptIn === true,
            utms,
            tracking,
        },
    };
}
