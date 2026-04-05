import type { SubmitWaitlistRequest, SubmitWaitlistResponse } from '../types/waitlist';
import { buildCorsHeaders, getClientIP } from '../lib/network';
import { checkRateLimit } from '../lib/rate-limit';
import { cleanString } from '../lib/lead-logic';
import { buildN8nWaitlistPayload } from '../lib/n8n-payloads';
import { validateWaitlistPayload } from '../lib/waitlist-logic';
import { sendWaitlistToN8n } from '../services/n8n';

export const config = {
    runtime: 'edge',
};

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

interface SubmitWaitlistConfig {
    webhookUrl: string;
    webhookSecret: string;
}

function truncateDetail(detail: string): string | undefined {
    const trimmed = detail.replace(/[\r\n]+/g, ' ').trim();
    if (!trimmed) return undefined;

    return trimmed.slice(0, 200);
}

function createRequestId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `waitlist_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function buildJsonResponse(body: SubmitWaitlistResponse, status: number, corsHeaders: Record<string, string>): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'X-Request-Id': body.requestId,
            ...corsHeaders,
        },
    });
}

function getSubmitWaitlistConfig(): SubmitWaitlistConfig | null {
    const webhookUrl = cleanString(process.env.N8N_SUBMIT_WAITLIST_WEBHOOK_URL);
    const webhookSecret = cleanString(process.env.N8N_WEBHOOK_SECRET);

    if (!webhookUrl || !webhookSecret) {
        return null;
    }

    return {
        webhookUrl,
        webhookSecret,
    };
}

export function classifySubmitWaitlistError(error: unknown): {
    code: 'N8N_WEBHOOK_ERROR' | 'INTERNAL_ERROR';
    status: number;
    error: string;
    detail?: string;
} {
    const message = error instanceof Error ? error.message : String(error);
    const match = message.match(/^N8N_WEBHOOK_ERROR:(\d+):(.*)$/s);
    if (!match) {
        return {
            code: 'INTERNAL_ERROR',
            status: 500,
            error: 'Erro interno ao processar envio da lista de espera.',
        };
    }

    const status = Number(match[1]);
    const detail = truncateDetail(match[2] || '');

    return {
        code: 'N8N_WEBHOOK_ERROR',
        status: Number.isFinite(status) && status >= 400 ? status : 502,
        error: 'Erro ao enviar inscrição na lista de espera.',
        detail,
    };
}

async function parseRequestBody(
    request: Request,
    corsHeaders: Record<string, string>,
    requestId: string,
): Promise<unknown | Response> {
    try {
        return await request.json();
    } catch {
        return buildJsonResponse(
            {
                ok: false,
                requestId,
                code: 'VALIDATION_ERROR',
                error: 'JSON inválido no corpo da requisição.',
            },
            400,
            corsHeaders,
        );
    }
}

function validateRequestPayload(
    rawBody: unknown,
    corsHeaders: Record<string, string>,
    requestId: string,
): SubmitWaitlistRequest | Response {
    const validation = validateWaitlistPayload(rawBody);
    if (validation.valid === false) {
        return buildJsonResponse(
            {
                ok: false,
                requestId,
                code: 'VALIDATION_ERROR',
                error: validation.error,
            },
            400,
            corsHeaders,
        );
    }

    return validation.data;
}

async function getRateLimitResponse(
    request: Request,
    corsHeaders: Record<string, string>,
    requestId: string,
): Promise<Response | null> {
    const clientIP = getClientIP(request);
    const rateLimit = await checkRateLimit(clientIP, {
        limit: RATE_LIMIT_MAX_REQUESTS,
        windowMs: RATE_LIMIT_WINDOW_MS,
        prefix: 'ratelimit:submit-waitlist',
    });

    if (rateLimit.allowed) return null;

    return buildJsonResponse(
        {
            ok: false,
            requestId,
            code: 'RATE_LIMIT_EXCEEDED',
            error: 'Muitas tentativas. Tente novamente em breve.',
        },
        429,
        {
            ...corsHeaders,
            'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(Math.ceil((Date.now() + rateLimit.resetIn) / 1000)),
        },
    );
}

export default async function handler(request: Request): Promise<Response> {
    const corsHeaders = buildCorsHeaders();
    const requestId = createRequestId();

    try {
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        if (request.method !== 'POST') {
            return buildJsonResponse(
                {
                    ok: false,
                    requestId,
                    code: 'METHOD_NOT_ALLOWED',
                    error: 'Método não permitido.',
                },
                405,
                corsHeaders,
            );
        }

        const config = getSubmitWaitlistConfig();
        if (!config) {
            return buildJsonResponse(
                {
                    ok: false,
                    requestId,
                    code: 'SERVER_CONFIG_ERROR',
                    error: 'Integração de waitlist indisponível no momento.',
                },
                500,
                corsHeaders,
            );
        }

        const rawBody = await parseRequestBody(request, corsHeaders, requestId);
        if (rawBody instanceof Response) return rawBody;

        const payload = validateRequestPayload(rawBody, corsHeaders, requestId);
        if (payload instanceof Response) return payload;

        const rateLimitResponse = await getRateLimitResponse(request, corsHeaders, requestId);
        if (rateLimitResponse) return rateLimitResponse;

        await sendWaitlistToN8n(
            config.webhookUrl,
            config.webhookSecret,
            requestId,
            buildN8nWaitlistPayload(payload, requestId),
        );

        return buildJsonResponse(
            {
                ok: true,
                requestId,
                message: 'Enviado com sucesso',
            },
            201,
            corsHeaders,
        );
    } catch (error: unknown) {
        const classified = classifySubmitWaitlistError(error);
        return buildJsonResponse(
            {
                ok: false,
                requestId,
                code: classified.code,
                error: classified.error,
            },
            classified.status,
            corsHeaders,
        );
    }
}
