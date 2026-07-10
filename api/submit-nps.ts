import {
    classifyN8nSubmitError,
    type ClassifyN8nErrorOptions,
    type N8nErrorClassification,
    type ValidationResult,
} from '../lib/n8n-submit-handler';
import { createOdooSubmitHandler } from '../lib/odoo-submit-handler';
import { leadInputFromSubmitNps } from '../lib/odoo-lead-mapping';
import { SubmitNpsBodySchema, type SubmitNpsRequest } from '../lib/schemas/submit-nps';
import { cleanString } from '../lib/lead-logic';
import { getNpsInviteSecret, verifyNpsInviteToken } from '../lib/nps-invite';
import { consumeNpsInviteOnce } from '../lib/nps-invite-replay';
import { logger } from '../lib/logger';
import { z } from 'zod';

const ODOO_ERROR_PATTERN = /^ODOO_ERROR:(\d+):(.*)$/s;

// Deliberately generic: distinguishing "expired" from "already used" from
// "tampered" to the caller would help an attacker probe the invitation
// scheme (issue #1137). A real customer just needs to know to ask for a new link.
const INVALID_INVITE_ERROR = 'Link de avaliação inválido ou expirado. Solicite um novo link.';
const INVITE_EMAIL_SCHEMA = z.email().max(254);

function mapNpsZodError(error: z.ZodError): string {
    const issue = error.issues[0];
    const path = issue?.path[0];
    if (path === 'token') return 'Link de avaliação ausente ou inválido.';
    if (path === 'score') return 'Nota deve ser um número inteiro entre 0 e 10.';
    if (path === 'reason') return 'O motivo da nota é obrigatório (máximo 2000 caracteres).';
    if (path === 'highlight') return 'Momento marcante deve ter no máximo 2000 caracteres.';
    return 'Payload inválido.';
}

/**
 * Verifies the signed NPS invitation before trusting any identity: signature,
 * expiry, and single-use replay (issue #1137). Identity (firstname/email) is
 * read from the verified payload, never from the request body.
 */
async function validateNpsSubmission(rawBody: unknown): Promise<ValidationResult<SubmitNpsRequest>> {
    const parsed = SubmitNpsBodySchema.safeParse(rawBody);
    if (!parsed.success) {
        return { ok: false, error: mapNpsZodError(parsed.error) };
    }

    // checkExtraConfig (below) already guarantees this is set before validate runs.
    const secret = getNpsInviteSecret()!;
    const verification = await verifyNpsInviteToken(parsed.data.token, secret);
    if (!verification.valid) {
        logger.warn('SUBMIT_NPS: invitation rejected', { reason: verification.reason });
        return { ok: false, error: INVALID_INVITE_ERROR };
    }

    const { payload } = verification;
    const remainingTtlSeconds = Math.max(1, Math.floor((payload.exp - Date.now()) / 1000));
    const firstUse = await consumeNpsInviteOnce(payload.jti, remainingTtlSeconds);
    if (!firstUse) {
        logger.warn('SUBMIT_NPS: invitation replay rejected');
        return { ok: false, error: INVALID_INVITE_ERROR };
    }

    // Same escape + post-escape length guard the old free-text firstname field
    // used: cleanString turns each `<`/`>` into a 4-char entity, so a name full
    // of angle brackets could quadruple past the 100-char res.partner.name limit.
    const rawFirstname = payload.firstname.trim();
    if (!rawFirstname || rawFirstname.length > 100) {
        return { ok: false, error: INVALID_INVITE_ERROR };
    }
    const firstname = cleanString(rawFirstname);
    if (firstname.length > 100) {
        return { ok: false, error: INVALID_INVITE_ERROR };
    }

    const emailParsed = INVITE_EMAIL_SCHEMA.safeParse(payload.email);
    if (!emailParsed.success) {
        return { ok: false, error: INVALID_INVITE_ERROR };
    }

    return {
        ok: true,
        data: {
            firstname,
            email: emailParsed.data,
            score: parsed.data.score,
            reason: parsed.data.reason,
            highlight: parsed.data.highlight,
        },
    };
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
    checkExtraConfig: () =>
        getNpsInviteSecret()
            ? { ok: true }
            : { ok: false, status: 500, error: 'Serviço de avaliação indisponível no momento.' },
    parse: { invalidJsonError: 'JSON inválido no corpo da requisição.' },
    methodNotAllowedError: 'Method not allowed',
    validate: validateNpsSubmission,
    buildInput: leadInputFromSubmitNps,
    success: { status: 201, message: 'Avaliação registrada com sucesso.' },
    error: NPS_ERROR_OPTIONS,
});
