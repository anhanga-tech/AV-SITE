import {
    classifyN8nSubmitError,
    type ClassifyN8nErrorOptions,
    type N8nErrorClassification,
} from '../lib/n8n-submit-handler';
import { createOdooSubmitHandler } from '../lib/odoo-submit-handler';
import { leadInputFromSubmitNps } from '../lib/odoo-lead-mapping';
import { SubmitNpsBodySchema } from '../lib/schemas/submit-nps';
import type { z } from 'zod';

const ODOO_ERROR_PATTERN = /^ODOO_ERROR:(\d+):(.*)$/s;

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

const NPS_ERROR_OPTIONS: ClassifyN8nErrorOptions = {
    webhookCode: 'ODOO_ERROR',
    webhookError: 'Erro ao registrar avaliação. Tente novamente.',
    internalError: 'Erro interno. Tente novamente.',
    mapStatus: (upstreamStatus) => (upstreamStatus === 504 ? 504 : 502),
    errorPattern: ODOO_ERROR_PATTERN,
};

export function classifySubmitNpsError(error: unknown): N8nErrorClassification {
    return classifyN8nSubmitError(error, NPS_ERROR_OPTIONS);
}

export default createOdooSubmitHandler({
    logScope: 'SUBMIT_NPS',
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
    buildInput: leadInputFromSubmitNps,
    success: { status: 201, message: 'Avaliação registrada com sucesso.' },
    error: NPS_ERROR_OPTIONS,
});
