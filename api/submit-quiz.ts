import {
    classifyN8nSubmitError,
    createN8nSubmitHandler,
    type ClassifyN8nErrorOptions,
    type N8nErrorClassification,
} from '../lib/n8n-submit-handler';
import { maskEmail, maskName, maskPhone } from '../lib/lead-logic';
import { buildN8nQuizPayload } from '../lib/n8n-payloads';
import { validateQuizPayload } from '../lib/quiz-logic';
import { sendQuizToN8n } from '../services/n8n';

const QUIZ_ERROR_OPTIONS: ClassifyN8nErrorOptions = {
    webhookCode: 'N8N_WEBHOOK_ERROR',
    webhookError: 'Erro ao processar quiz.',
    internalError: 'Erro interno ao processar o quiz.',
    mapStatus: (upstreamStatus) => (upstreamStatus >= 400 && upstreamStatus < 600 ? upstreamStatus : 502),
};

export function classifySubmitQuizError(error: unknown): N8nErrorClassification {
    return classifyN8nSubmitError(error, QUIZ_ERROR_OPTIONS);
}

export default createN8nSubmitHandler({
    logScope: 'SUBMIT_QUIZ',
    webhookEnvVar: 'N8N_SUBMIT_QUIZ_WEBHOOK_URL',
    config: {
        missingStatus: 503,
        missingError: 'Serviço de quiz temporariamente indisponível.',
    },
    rateLimit: {
        windowMs: 60 * 1000,
        max: 5,
        keyPrefix: 'ratelimit:submit-quiz',
        exceededError: 'Muitas tentativas. Aguarde um momento.',
        includeRetryAfterInBody: true,
    },
    parse: { invalidJsonError: 'Corpo da requisição inválido.' },
    methodNotAllowedError: 'Método não permitido.',
    validate: (rawBody) => {
        const validation = validateQuizPayload(rawBody);
        if (validation.valid === false) {
            return { ok: false, error: validation.error };
        }
        return { ok: true, data: validation.data };
    },
    buildPayload: (data, requestId) => buildN8nQuizPayload(data, requestId),
    send: sendQuizToN8n,
    success: { status: 200, message: 'Perfil registrado com sucesso.' },
    error: QUIZ_ERROR_OPTIONS,
    onValidated: (data) => ({
        maskedEmail: maskEmail(data.email),
        profile: data.profileKey,
        destinosCount: data.destinos?.length ?? 0,
    }),
    onError: ({ data }) => ({
        recoveredQuiz: {
            maskedEmail: maskEmail(data.email),
            maskedPhone: data.whatsapp ? maskPhone(data.whatsapp) : undefined,
            maskedFirstName: maskName(data.firstName),
            profile: data.profileKey,
        },
    }),
});
