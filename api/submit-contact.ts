import type { SubmitContactRequest } from '../types/contactCapture';
import {
    cleanString,
    normalizeNullable,
    normalizeTracking,
    normalizeUtms,
    normalizeWhatsappNumber,
    isValidEmail,
} from '../lib/lead-logic';
import { type ValidationResult } from '../lib/n8n-submit-handler';
import { createOdooSubmitHandler } from '../lib/odoo-submit-handler';
import { leadInputFromSubmitContact } from '../lib/odoo-lead-mapping';

const CONTACT_VALIDATION_ERROR = 'Nome e WhatsApp são obrigatórios.';

function validateContactRequest(body: unknown): ValidationResult<SubmitContactRequest> {
    if (!body || typeof body !== 'object') return { ok: false, error: CONTACT_VALIDATION_ERROR };
    const raw = body as Record<string, unknown>;

    const firstName = cleanString(raw.firstName);
    const whatsapp = normalizeWhatsappNumber(raw.whatsapp);
    const email = normalizeNullable(raw.email, 255)?.toLowerCase();

    if (!firstName || !whatsapp) return { ok: false, error: CONTACT_VALIDATION_ERROR };
    if (firstName.length > 100 || whatsapp.length > 16) return { ok: false, error: CONTACT_VALIDATION_ERROR };
    if (email && !isValidEmail(email)) return { ok: false, error: CONTACT_VALIDATION_ERROR };

    const utms = normalizeUtms(raw.utms);
    const tracking = normalizeTracking(raw.tracking, utms);

    return {
        ok: true,
        data: {
            firstName,
            lastName: normalizeNullable(raw.lastName, 100) ?? undefined,
            whatsapp,
            email,
            emailOptIn: Boolean(raw.emailOptIn),
            source: normalizeNullable(raw.source, 128) ?? undefined,
            destination: normalizeNullable(raw.destination, 255) ?? undefined,
            eventId: normalizeNullable(raw.eventId, 128) ?? undefined,
            utms,
            tracking,
        },
    };
}

export default createOdooSubmitHandler({
    logScope: 'SUBMIT_CONTACT',
    config: {
        missingStatus: 503,
        missingError: 'Serviço temporariamente indisponível.',
    },
    rateLimit: {
        windowMs: 60 * 1000,
        max: 5,
        keyPrefix: 'ratelimit:submit-contact',
        exceededError: 'Muitas requisições. Tente novamente em breve.',
    },
    parse: { invalidJsonError: 'Corpo da requisição inválido.' },
    methodNotAllowedError: 'Método não permitido.',
    validate: validateContactRequest,
    buildInput: leadInputFromSubmitContact,
    success: { status: 200 },
    error: {
        // Contact returns the same neutral message for upstream and internal failures.
        webhookCode: 'ODOO_ERROR',
        webhookError: 'Não foi possível enviar sua mensagem. Tente novamente.',
        internalError: 'Não foi possível enviar sua mensagem. Tente novamente.',
        mapStatus: (upstreamStatus) => (upstreamStatus === 504 ? 504 : 502),
    },
});
