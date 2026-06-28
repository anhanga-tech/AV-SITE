import {
    classifyN8nSubmitError,
    createN8nSubmitHandler,
    type ClassifyN8nErrorOptions,
    type N8nErrorClassification,
} from '../lib/n8n-submit-handler';
import { buildN8nWaitlistPayload } from '../lib/n8n-payloads';
import { validateWaitlistPayload } from '../lib/waitlist-logic';
import { sendWaitlistToN8n } from '../services/n8n';

const WAITLIST_ERROR_OPTIONS: ClassifyN8nErrorOptions = {
    webhookCode: 'N8N_WEBHOOK_ERROR',
    webhookError: 'Erro ao enviar inscrição na lista de espera.',
    internalError: 'Erro interno ao processar envio da lista de espera.',
    mapStatus: (upstreamStatus) => (Number.isFinite(upstreamStatus) && upstreamStatus >= 400 ? upstreamStatus : 502),
};

export function classifySubmitWaitlistError(error: unknown): N8nErrorClassification {
    return classifyN8nSubmitError(error, WAITLIST_ERROR_OPTIONS);
}

export default createN8nSubmitHandler({
    logScope: 'SUBMIT_WAITLIST',
    webhookEnvVar: 'N8N_SUBMIT_WAITLIST_WEBHOOK_URL',
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
    buildPayload: (data, requestId) => buildN8nWaitlistPayload(data, requestId),
    send: sendWaitlistToN8n,
    success: { status: 201, message: 'Enviado com sucesso' },
    error: WAITLIST_ERROR_OPTIONS,
});
