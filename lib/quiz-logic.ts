import { normalizeNullable, normalizeTracking, normalizeUtms, normalizeWhatsappNumber } from './lead-logic';
import type { SubmitQuizRequest } from '../types/quiz';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateQuizPayload(
    payload: unknown,
): { valid: true; data: SubmitQuizRequest } | { valid: false; error: string } {
    if (!payload || typeof payload !== 'object') {
        return { valid: false, error: 'Payload inválido.' };
    }

    const raw = payload as Record<string, unknown>;
    const firstName = normalizeNullable(raw.firstName, 100);
    const lastName = normalizeNullable(raw.lastName, 100) ?? '';
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

    const whatsapp = normalizeWhatsappNumber(raw.whatsapp) ?? undefined;

    const destinos = Array.isArray(raw.destinos)
        ? raw.destinos
            .filter((d): d is string => typeof d === 'string')
            .map((d) => d.trim().slice(0, 50))
            .filter(Boolean)
            .slice(0, 10)
        : [];

    const utms = normalizeUtms(raw.utms);
    const tracking = normalizeTracking(raw.tracking, utms);

    return {
        valid: true,
        data: {
            firstName,
            lastName,
            email,
            whatsapp,
            profileKey,
            profileName,
            bantSummary,
            sourcePage,
            destinos,
            utms,
            tracking,
        },
    };
}
