import { isValidEmail, normalizeNullable, normalizeTracking, normalizeUtms } from './lead-logic';
import type { SubmitWaitlistRequest } from '../types/waitlist';

export function validateWaitlistPayload(
    payload: unknown,
): { valid: true; data: SubmitWaitlistRequest } | { valid: false; error: string } {
    if (!payload || typeof payload !== 'object') {
        return { valid: false, error: 'Payload inválido.' };
    }

    const raw = payload as Record<string, unknown>;
    const name = normalizeNullable(raw.name, 160);
    const email = normalizeNullable(raw.email)?.toLowerCase() ?? null;
    const sourcePage = normalizeNullable(raw.sourcePage, 255);

    if (!name || !email || !sourcePage) {
        return { valid: false, error: 'Campos obrigatórios ausentes.' };
    }

    if (!isValidEmail(email)) {
        return { valid: false, error: 'Email inválido.' };
    }

    const utms = normalizeUtms(raw.utms);
    const tracking = normalizeTracking(raw.tracking, utms);

    return {
        valid: true,
        data: {
            name,
            email,
            sourcePage,
            // Marketing opt-in (separate from the privacy/LGPD submission gate) →
            // feeds Odoo x_lgpd_consent.
            emailOptIn: raw.emailOptIn === true,
            utms,
            tracking,
        },
    };
}
