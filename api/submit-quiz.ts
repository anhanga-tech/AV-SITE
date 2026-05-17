import type { SubmitQuizRequest, SubmitQuizResponse } from '../types/quiz';
import { buildCorsHeaders, createRequestId, getClientIP } from '../lib/network';
import { checkRateLimit } from '../lib/rate-limit';
import { logger } from '../lib/logger';
import { cleanString, maskEmail, maskName, maskPhone } from '../lib/lead-logic';
import { buildN8nQuizPayload } from '../lib/n8n-payloads';
import { validateQuizPayload } from '../lib/quiz-logic';
import { sendQuizToN8n } from '../services/n8n';

export const config = {
    runtime: 'edge',
};

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

interface SubmitQuizConfig {
    webhookUrl: string;
    webhookSecret: string;
}

type QuizLogLevel = 'info' | 'warn' | 'error';

function truncateDetail(detail: string): string | undefined {
    const normalized = detail.replace(/[\r\n]+/g, ' ').trim();
    return normalized ? normalized.substring(0, 600) : undefined;
}

function emitQuizLog(level: QuizLogLevel, requestId: string, stage: string, details: Record<string, unknown> = {}): void {
    const payload = {
        requestId,
        stage,
        ...details,
    };

    if (level === 'warn') {
        logger.warn('SUBMIT_QUIZ', payload);
        return;
    }

    if (level === 'error') {
        logger.error('SUBMIT_QUIZ', payload);
        return;
    }

    logger.info('SUBMIT_QUIZ', payload);
}

function buildJsonResponse(body: SubmitQuizResponse, status: number, corsHeaders: Record<string, string>): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'X-Request-Id': body.requestId,
            ...corsHeaders,
        },
    });
}

function getSubmitQuizConfig(): SubmitQuizConfig | null {
    const webhookUrl = process.env.N8N_SUBMIT_QUIZ_WEBHOOK_URL?.trim();
    const webhookSecret = process.env.N8N_WEBHOOK_SECRET?.trim();

    if (!webhookUrl || !webhookSecret) {
        return null;
    }

    return { webhookUrl, webhookSecret };
}

export function classifySubmitQuizError(error: unknown): {
    code: 'N8N_WEBHOOK_ERROR' | 'INTERNAL_ERROR';
    status: number;
    error: string;
    detail?: string;
} {
    const message = error instanceof Error ? error.message : String(error);
    const match = message.match(/^N8N_WEBHOOK_ERROR:(\d+):(.*)$/s);

    if (match) {
        const httpStatus = Number.parseInt(match[1], 10);
        const detail = truncateDetail(match[2] || '');
        return {
            code: 'N8N_WEBHOOK_ERROR',
            status: httpStatus >= 400 && httpStatus < 600 ? httpStatus : 502,
            error: 'Erro ao processar quiz.',
            detail,
        };
    }

    return {
        code: 'INTERNAL_ERROR',
        status: 500,
        error: 'Erro interno ao processar o quiz.',
    };
}

export default async function handler(request: Request): Promise<Response> {
    const requestId = createRequestId();
    const corsHeaders = buildCorsHeaders();

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
        return buildJsonResponse(
            { ok: false, requestId, error: 'Método não permitido.', code: 'METHOD_NOT_ALLOWED' },
            405,
            corsHeaders,
        );
    }

    const config = getSubmitQuizConfig();
    if (!config) {
        emitQuizLog('error', requestId, 'config', { code: 'SERVER_CONFIG_ERROR' });
        return buildJsonResponse(
            { ok: false, requestId, error: 'Serviço de quiz temporariamente indisponível.', code: 'SERVER_CONFIG_ERROR' },
            503,
            corsHeaders,
        );
    }

    const clientIp = getClientIP(request);
    const rateLimitResult = await checkRateLimit(clientIp, {
        limit: RATE_LIMIT_MAX_REQUESTS,
        windowMs: RATE_LIMIT_WINDOW_MS,
        prefix: 'ratelimit:submit-quiz',
    });

    if (!rateLimitResult.allowed) {
        const retryAfterSec = Math.ceil(rateLimitResult.resetIn / 1000);
        emitQuizLog('warn', requestId, 'rate_limited', {
            clientIp,
            remaining: rateLimitResult.remaining,
            retryAfterSeconds: retryAfterSec,
        });

        return buildJsonResponse(
            {
                ok: false,
                requestId,
                error: 'Muitas tentativas. Aguarde um momento.',
                code: 'RATE_LIMIT_EXCEEDED',
                // @ts-expect-error - retryAfter is used by discovery schemas but not in strict response type
                retryAfter: retryAfterSec,
            },
            429,
            {
                ...corsHeaders,
                'Retry-After': String(retryAfterSec),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': String(Math.ceil((Date.now() + rateLimitResult.resetIn) / 1000)),
            },
        );
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return buildJsonResponse(
            { ok: false, requestId, error: 'Corpo da requisição inválido.', code: 'VALIDATION_ERROR' },
            400,
            corsHeaders,
        );
    }

    const validation = validateQuizPayload(body);
    if (validation.valid === false) {
        return buildJsonResponse(
            { ok: false, requestId, error: validation.error, code: 'VALIDATION_ERROR' },
            400,
            corsHeaders,
        );
    }

    const payload: SubmitQuizRequest = validation.data;
    const n8nPayload = buildN8nQuizPayload(payload, requestId);

    emitQuizLog('info', requestId, 'payload_validated', {
        maskedEmail: maskEmail(payload.email),
        profile: payload.profileKey,
        destinosCount: payload.destinos?.length ?? 0,
    });

    try {
        await sendQuizToN8n(config.webhookUrl, config.webhookSecret, requestId, n8nPayload);

        emitQuizLog('info', requestId, 'done');

        return buildJsonResponse(
            { ok: true, requestId, message: 'Perfil registrado com sucesso.' },
            200,
            corsHeaders,
        );
    } catch (error: unknown) {
        const classified = classifySubmitQuizError(error);

        emitQuizLog('error', requestId, classified.code === 'N8N_WEBHOOK_ERROR' ? 'n8n_webhook_failed' : 'unexpected', {
            code: classified.code,
            status: classified.status,
            detail: classified.detail,
            recoveredQuiz: {
                maskedEmail: maskEmail(payload.email),
                maskedPhone: payload.whatsapp ? maskPhone(payload.whatsapp) : undefined,
                maskedFirstName: maskName(payload.firstName),
                profile: payload.profileKey,
            },
        });

        return buildJsonResponse(
            { ok: false, requestId, error: classified.error, code: classified.code },
            classified.status,
            corsHeaders,
        );
    }
}
