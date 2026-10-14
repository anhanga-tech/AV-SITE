import { cleanString, isValidEmail, normalizeNullable, normalizeTracking, normalizeUtms, normalizeWhatsappNumber, splitFullName } from './lead-logic';
import type { SubmitQuizRequest } from '../types/quiz';

/** Derives firstName/lastName from the quiz form via {@link splitFullName},
 *  applying the quiz-specific "Viajante" fallback when the name is empty so the
 *  WhatsApp copy and CRM payload always have a first name. */
export function deriveQuizLeadName(
    nome: string,
    sobrenome: string,
): { firstName: string; lastName: string } {
    const { firstName, lastName } = splitFullName(nome, sobrenome);
    return { firstName: firstName || 'Viajante', lastName };
}

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

    if (!isValidEmail(email)) {
        return { valid: false, error: 'Email inválido.' };
    }

    const whatsapp = normalizeWhatsappNumber(raw.whatsapp) ?? undefined;

    const destinos = Array.isArray(raw.destinos)
        ? raw.destinos
            .flatMap((d): string[] => {
                if (typeof d !== 'string') return [];
                const cleaned = cleanString(d.slice(0, 50));
                return cleaned ? [cleaned] : [];
            })
            .slice(0, 10)
        : [];

    const utms = normalizeUtms(raw.utms);
    const tracking = normalizeTracking(raw.tracking, utms);
    const skipped = raw.skipped === true;
    const newsletterOptIn = raw.newsletterOptIn === true;

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
            skipped,
            newsletterOptIn,
            utms,
            tracking,
        },
    };
}
