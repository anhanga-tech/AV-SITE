import { cleanString, normalizeNullable, normalizeTracking, normalizeUtms, normalizeWhatsappNumber } from './lead-logic';
import type { SubmitQuizRequest } from '../types/quiz';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Derives firstName/lastName from the quiz form, whose UI collapsed
 *  nome+sobrenome into a single "nome" field to cut friction. Keeps an
 *  explicit `sobrenome` when present (e.g. prefilled from the URL); otherwise
 *  falls back to the remaining tokens of the full name ("João Silva" → "Silva")
 *  so the last name is not silently dropped before it reaches the CRM. */
export function deriveQuizLeadName(
    nome: string,
    sobrenome: string,
): { firstName: string; lastName: string } {
    const nameParts = nome.trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || 'Viajante';
    const lastName = sobrenome.trim() || nameParts.slice(1).join(' ');
    return { firstName, lastName };
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

    if (!EMAIL_REGEX.test(email)) {
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
