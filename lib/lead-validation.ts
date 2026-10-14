import { z } from 'zod';
import type { SubmitLeadRequest } from '../types/leadCapture';
import { SubmitLeadBodySchema } from './schemas/submit-lead';
import {
    cleanString,
    normalizeNullable,
    normalizeTracking,
    normalizeUtms,
    normalizeWhatsappNumber,
} from './lead-logic';

// Zod-backed validation, split out of lib/lead-logic.ts so the client bundle
// (which imports lead-logic.ts's sanitization helpers via useContactForm,
// useLeadCapture, useQuizCapture, useWaitlistCapture, useCorpFormReducer, …)
// never pulls in zod or this module's schema construction. Only api/submit-lead.ts
// (server) needs full payload validation.
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
