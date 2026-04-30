import type { SubmitQuizRequest, SubmitQuizResponse } from '../types/quiz';
import { buildCorsHeaders, createRequestId, getClientIP } from '../lib/network';
import { checkRateLimit } from '../lib/rate-limit';
import { cleanString } from '../lib/lead-logic';
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
    const webhookUrl = cleanString(process.env.N8N_SUBMIT_QUIZ_WEBHOOK_URL);
    const webhookSecret = cleanString(process.env.N8N_WEBHOOK_SECRET);

    if (!webhookUrl || !webhookSecret) {
        return null;
    }

    return { webhookUrl, webhookSecret };
}

function classifySubmitQuizError(error: unknown): {
    code: 'N8N_WEBHOOK_ERROR' | 'INTERNAL_ERROR';
    status: number;
    error: string;
} {
    const message = error instanceof Error ? error.message : String(error);
    const match = message.match(/^N8N_WEBHOOK_ERROR:(\d+):(.*)$/s);

    if (match) {
        const httpStatus = Number.parseInt(match[1], 10);
        const detail = match[2]?.trim().slice(0, 200) || 'Erro no webhook';
        return {
            code: 'N8N_WEBHOOK_ERROR',
            status: httpStatus >= 400 && httpStatus < 600 ? httpStatus : 502,
            error: detail,
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
        prefix: 'quiz',
    });

    if (!rateLimitResult.allowed) {
        return buildJsonResponse(
            { ok: false, requestId, error: 'Muitas tentativas. Aguarde um momento.', code: 'RATE_LIMIT_EXCEEDED' },
            429,
            corsHeaders,
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

    try {
        await sendQuizToN8n(config.webhookUrl, config.webhookSecret, requestId, n8nPayload);

        return buildJsonResponse(
            { ok: true, requestId, message: 'Perfil registrado com sucesso.' },
            200,
            corsHeaders,
        );
    } catch (error: unknown) {
        const classified = classifySubmitQuizError(error);
        return buildJsonResponse(
            { ok: false, requestId, error: classified.error, code: classified.code },
            classified.status,
            corsHeaders,
        );
    }
}
