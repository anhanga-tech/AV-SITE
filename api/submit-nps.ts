import { z } from 'zod';
import { createN8nSubmitHandler } from '../lib/n8n-submit-handler';
import { buildN8nNpsPayload } from '../lib/n8n-payloads';
import { SubmitNpsBodySchema } from '../lib/schemas/submit-nps';
import { sendNpsToN8n } from '../services/n8n';

function mapNpsZodError(error: z.ZodError): string {
    const issue = error.issues[0];
    const path = issue?.path[0];
    if (path === 'firstname') return 'Nome inválido.';
    if (path === 'email') return 'E-mail inválido.';
    if (path === 'score') return 'Nota deve ser um número inteiro entre 0 e 10.';
    if (path === 'reason') return 'O motivo da nota é obrigatório (máximo 2000 caracteres).';
    if (path === 'highlight') return 'Momento marcante deve ter no máximo 2000 caracteres.';
    return 'Payload inválido.';
}

export default createN8nSubmitHandler({
    logScope: 'SUBMIT_NPS',
    webhookEnvVar: 'NPS_WEBHOOK_URL',
    config: {
        missingStatus: 500,
        missingError: 'Serviço de NPS indisponível no momento.',
    },
    rateLimit: {
        windowMs: 10 * 60 * 1000,
        max: 3,
        keyPrefix: 'ratelimit:submit-nps',
        exceededError: 'Muitas tentativas. Tente novamente em breve.',
    },
    parse: { invalidJsonError: 'JSON inválido no corpo da requisição.' },
    methodNotAllowedError: 'Method not allowed',
    validate: (rawBody) => {
        const parsed = SubmitNpsBodySchema.safeParse(rawBody);
        if (!parsed.success) {
            return { ok: false, error: mapNpsZodError(parsed.error) };
        }
        return { ok: true, data: parsed.data };
    },
    buildPayload: (data, requestId) => buildN8nNpsPayload(data, requestId),
    send: sendNpsToN8n,
    success: { status: 201, message: 'Avaliação registrada com sucesso.' },
    error: {
        webhookCode: 'WEBHOOK_ERROR',
        webhookError: 'Erro ao registrar avaliação. Tente novamente.',
        internalError: 'Erro interno. Tente novamente.',
        mapStatus: (upstreamStatus) => (upstreamStatus === 504 ? 504 : 502),
    },
});
