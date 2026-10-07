import {
    classifyN8nSubmitError,
    type ClassifyN8nErrorOptions,
    type N8nErrorClassification,
    type ValidationResult,
} from '../lib/n8n-submit-handler';
import { createOdooSubmitHandler } from '../lib/odoo-submit-handler';
import { leadInputFromSubmitNps } from '../lib/odoo-lead-mapping';
import { NpsInviteTokenSchema, SubmitNpsBodySchema, type SubmitNpsRequest } from '../lib/schemas/submit-nps';
import { cleanString } from '../lib/lead-logic';
import { getNpsInviteSecret, verifyNpsInviteToken } from '../lib/nps-invite';
import { consumeNpsInviteOnce, releaseNpsInvite } from '../lib/nps-invite-replay';
import { buildClearedNpsInviteCookies, NPS_INVITE_TOKEN_COOKIE, readCookie } from '../lib/nps-invite-cookie';
import { logger } from '../lib/logger';
import { z } from 'zod';

const ODOO_ERROR_PATTERN = /^ODOO_ERROR:(\d+):(.*)$/s;

// Deliberately generic: distinguishing "expired" from "already used" from
// "tampered" to the caller would help an attacker probe the invitation
// scheme (issue #1137). A real customer just needs to know to ask for a new link.
const INVALID_INVITE_ERROR = 'Link de avaliação inválido ou expirado. Solicite um novo link.';
const MISSING_INVITE_ERROR = 'Link de avaliação ausente ou inválido.';
const SWITCHED_INVITE_ERROR =
    'Outro link de avaliação foi aberto neste navegador depois deste. Abra novamente o link do seu e-mail para enviar.';

/**
 * Requests whose invite was verified and consumed. A 201 alone doesn't prove
 * that: the shared handler answers bot hits (honeypot, fill under 2.5s) with a
 * decoy 201 before validation, and clearing the cookies then would leave a
 * fast human with a thank-you, no recorded rating and no way to retry.
 */
const consumedInviteRequests = new WeakSet<Request>();
const INVITE_EMAIL_SCHEMA = z.email().max(254);

function mapNpsZodError(error: z.ZodError): string {
    const issue = error.issues[0];
    const path = issue?.path[0];
    if (path === 'inviteRef') return MISSING_INVITE_ERROR;
    if (path === 'score') return 'Nota deve ser um número inteiro entre 0 e 10.';
    if (path === 'reason') return 'O motivo da nota é obrigatório (máximo 2000 caracteres).';
    if (path === 'highlight') return 'Momento marcante deve ter no máximo 2000 caracteres.';
    return 'Payload inválido.';
}

/**
 * Verifies the signed NPS invitation before trusting any identity: signature,
 * expiry, and single-use replay (issue #1137). Identity (firstname/email) is
 * read from the verified payload, never from the request body. The token is
 * read only from the invite cookie — a `token` in the body is ignored, so the
 * page never has a reason to hold the credential (issue #1666).
 */
async function validateNpsSubmission(rawBody: unknown, request: Request): Promise<ValidationResult<SubmitNpsRequest>> {
    const parsed = SubmitNpsBodySchema.safeParse(rawBody);
    if (!parsed.success) {
        return { ok: false, error: mapNpsZodError(parsed.error) };
    }

    const tokenParsed = NpsInviteTokenSchema.safeParse(
        readCookie(request.headers.get('cookie'), NPS_INVITE_TOKEN_COOKIE) ?? '',
    );
    if (!tokenParsed.success) {
        return { ok: false, error: MISSING_INVITE_ERROR };
    }

    // checkExtraConfig (below) already guarantees this is set before validate runs.
    const secret = getNpsInviteSecret()!;
    const verification = await verifyNpsInviteToken(tokenParsed.data, secret);
    if (!verification.valid) {
        logger.warn('SUBMIT_NPS: invitation rejected', { reason: verification.reason });
        return { ok: false, error: INVALID_INVITE_ERROR };
    }

    const { payload } = verification;
    if (parsed.data.inviteRef !== payload.jti) {
        logger.warn('SUBMIT_NPS: invite cookie belongs to another invite opened later');
        return { ok: false, error: SWITCHED_INVITE_ERROR };
    }
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

    consumedInviteRequests.add(request);

    return {
        ok: true,
        data: {
            firstname,
            email: emailParsed.data,
            score: parsed.data.score,
            reason: parsed.data.reason,
            highlight: parsed.data.highlight,
            jti: payload.jti,
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

const submitNpsHandler = createOdooSubmitHandler({
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
    // validateNpsSubmission consumes the jti before the Odoo write (atomic,
    // so concurrent double-submits are still rejected) — if the write then
    // fails, release it so a legitimate retry with the same link succeeds
    // instead of permanently burning a customer's single-use invite.
    onSendFailure: async (data) => {
        await releaseNpsInvite(data.jti);
    },
});

/**
 * Once the invite is spent (single-use), drop both cookies: the readable
 * cookie carries the first name with no further purpose, and a reload should
 * show "link inválido" rather than a form the server will refuse. Only a 201
 * for a consumed invite counts — see consumedInviteRequests. A failed Odoo
 * write releases the invite and answers 5xx, so it keeps the cookies too.
 */
export default async function handler(request: Request): Promise<Response> {
    const response = await submitNpsHandler(request);
    if (response.status === 201 && consumedInviteRequests.has(request)) {
        const secure = new URL(request.url).protocol === 'https:';
        for (const cookie of buildClearedNpsInviteCookies(secure)) {
            response.headers.append('Set-Cookie', cookie);
        }
    }
    return response;
}
