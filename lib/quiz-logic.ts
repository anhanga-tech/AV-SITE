import { normalizeNullable, normalizeTracking, normalizeUtms } from './lead-logic';
import type { SubmitQuizRequest } from '../types/quiz';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WHATSAPP_MIN_DIGITS = 10;

export function validateQuizPayload(
    payload: unknown,
): { valid: true; data: SubmitQuizRequest } | { valid: false; error: string } {
    if (!payload || typeof payload !== 'object') {
        return { valid: false, error: 'Payload inválido.' };
    }

    const raw = payload as Record<string, unknown>;
    const firstName = normalizeNullable(raw.firstName, 100);
    const email = normalizeNullable(raw.email)?.toLowerCase() ?? null;
    const profileKey = normalizeNullable(raw.profileKey, 50);
    const profileName = normalizeNullable(raw.profileName, 100);
    const bantSummary = normalizeNullable(raw.bantSummary, 1000);
    const sourcePage = normalizeNullable(raw.sourcePage, 255) ?? '/quiz';

    if (!firstName || !email || !profileKey || !profileName || !bantSummary) {
        return { valid: false, error: 'Campos obrigatórios ausentes.' };
    }

    if (!EMAIL_REGEX.test(email)) {
        return { valid: false, error: 'Email inválido.' };
    }

    const rawWhatsapp = typeof raw.whatsapp === 'string' ? raw.whatsapp : '';
    const whatsappDigits = rawWhatsapp.replace(/\D/g, '');
    const whatsapp = whatsappDigits.length >= WHATSAPP_MIN_DIGITS
        ? whatsappDigits
        : undefined;

    const utms = normalizeUtms(raw.utms);
    const tracking = normalizeTracking(raw.tracking, utms);

    return {
        valid: true,
        data: {
            firstName,
            email,
            whatsapp,
            profileKey,
            profileName,
            bantSummary,
            sourcePage,
            utms,
            tracking,
        },
    };
}
