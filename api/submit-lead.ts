import {
    classifyN8nSubmitError,
    createN8nSubmitHandler,
    type ClassifyN8nErrorOptions,
    type N8nErrorClassification,
} from '../lib/n8n-submit-handler';
import { maskEmail, maskName, maskPhone, validatePayload } from '../lib/lead-logic';
import { buildN8nLeadPayload } from '../lib/n8n-payloads';
import { sendLeadToN8n } from '../services/n8n';

const LEAD_ERROR_OPTIONS: ClassifyN8nErrorOptions = {
    webhookCode: 'N8N_WEBHOOK_ERROR',
    webhookError: 'Erro ao enviar lead.',
    internalError: 'Erro interno ao processar envio do lead.',
    mapStatus: (upstreamStatus) => (Number.isFinite(upstreamStatus) && upstreamStatus >= 400 ? upstreamStatus : 502),
};

export function classifySubmitLeadError(error: unknown): N8nErrorClassification {
    return classifyN8nSubmitError(error, LEAD_ERROR_OPTIONS);
}

export default createN8nSubmitHandler({
    logScope: 'SUBMIT_LEAD',
    webhookEnvVar: 'N8N_SUBMIT_LEAD_WEBHOOK_URL',
    config: {
        missingStatus: 500,
        missingError: 'Integração de lead indisponível no momento.',
    },
    rateLimit: {
        windowMs: 60 * 1000,
        max: 5,
        keyPrefix: 'ratelimit:submit-lead',
        exceededError: 'Muitas tentativas. Tente novamente em breve.',
    },
    parse: { invalidJsonError: 'JSON inválido no corpo da requisição.' },
    methodNotAllowedError: 'Method not allowed',
    validate: (rawBody) => {
        const validation = validatePayload(rawBody);
        if (validation.valid === false) {
            return { ok: false, error: validation.error };
        }
        return { ok: true, data: validation.data };
    },
    buildPayload: (data, requestId, ctx) => buildN8nLeadPayload(data, requestId, {
        clientIpAddress: ctx.clientIpAddress,
        clientUserAgent: ctx.clientUserAgent,
    }),
    send: sendLeadToN8n,
    success: { status: 201, message: 'Enviado com sucesso' },
    error: LEAD_ERROR_OPTIONS,
    onValidated: (data) => ({
        email: maskEmail(data.email),
        destination: data.destination,
        utmSource: data.utms.utm_source,
        extraTrackingKeys: Object.keys(data.tracking?.extras ?? {}).length,
        hasClickIds: Boolean(
            data.tracking?.gclid
            || data.tracking?.fbclid
            || data.tracking?.msclkid
            || data.tracking?.ttclid
            || data.tracking?.wbraid
            || data.tracking?.gbraid,
        ),
    }),
    onError: ({ data }) => ({
        recoveredLead: {
            maskedEmail: maskEmail(data.email),
            maskedPhone: maskPhone(data.whatsapp),
            maskedFirstName: maskName(data.firstName),
            destination: data.destination,
            // bantSummary omitted — may contain sensitive PII (budget, health, family details).
            // hasBantSummary preserves qualification signal without exposing content to log infra.
            hasBantSummary: Boolean(data.bantSummary),
            utms: data.utms,
        },
    }),
});
