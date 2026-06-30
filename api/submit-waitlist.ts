import {
    classifyN8nSubmitError,
    type ClassifyN8nErrorOptions,
    type N8nErrorClassification,
} from '../lib/n8n-submit-handler';
import { createOdooSubmitHandler } from '../lib/odoo-submit-handler';
import { leadInputFromSubmitWaitlist } from '../lib/odoo-lead-mapping';
import { validateWaitlistPayload } from '../lib/waitlist-logic';

const ODOO_ERROR_PATTERN = /^ODOO_ERROR:(\d+):(.*)$/s;

const WAITLIST_ERROR_OPTIONS: ClassifyN8nErrorOptions = {
    webhookCode: 'ODOO_ERROR',
    webhookError: 'Erro ao enviar inscrição na lista de espera.',
    internalError: 'Erro interno ao processar envio da lista de espera.',
    mapStatus: (upstreamStatus) => (Number.isFinite(upstreamStatus) && upstreamStatus >= 400 ? upstreamStatus : 502),
    errorPattern: ODOO_ERROR_PATTERN,
};

export function classifySubmitWaitlistError(error: unknown): N8nErrorClassification {
    return classifyN8nSubmitError(error, WAITLIST_ERROR_OPTIONS);
}

export default createOdooSubmitHandler({
    logScope: 'SUBMIT_WAITLIST',
    config: {
        missingStatus: 500,
        missingError: 'Integração de waitlist indisponível no momento.',
    },
    rateLimit: {
        windowMs: 60 * 1000,
        max: 5,
        keyPrefix: 'ratelimit:submit-waitlist',
        exceededError: 'Muitas tentativas. Tente novamente em breve.',
    },
    parse: { invalidJsonError: 'JSON inválido no corpo da requisição.' },
    methodNotAllowedError: 'Método não permitido.',
    validate: (rawBody) => {
        const validation = validateWaitlistPayload(rawBody);
        if (validation.valid === false) {
            return { ok: false, error: validation.error };
        }
        return { ok: true, data: validation.data };
    },
    buildInput: leadInputFromSubmitWaitlist,
    success: { status: 201, message: 'Enviado com sucesso' },
    error: WAITLIST_ERROR_OPTIONS,
});
