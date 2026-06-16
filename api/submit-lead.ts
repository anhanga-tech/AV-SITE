import type { SubmitLeadRequest } from '../types/leadCapture';
import { buildCorsHeaders, buildJsonResponse, createRequestId, getClientIP } from '../lib/network';
import { checkRateLimit } from '../lib/rate-limit';
import { cleanString, maskEmail, maskName, maskPhone, validatePayload } from '../lib/lead-logic';
import { logger } from '../lib/logger';
import { buildN8nLeadPayload } from '../lib/n8n-payloads';
import { sendLeadToN8n } from '../services/n8n';

export const config = {
    runtime: 'edge',
};

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

interface SubmitLeadConfig {
    webhookUrl: string;
    webhookSecret: string;
}

type SubmitLeadInternalErrorCode = 'N8N_WEBHOOK_ERROR' | 'INTERNAL_ERROR';

type LeadLogLevel = 'info' | 'warn' | 'error';

function truncateDetail(detail: string): string | undefined {
    const normalized = detail.replace(/[\r\n]+/g, ' ').trim();
    return normalized ? normalized.substring(0, 600) : undefined;
}

function emitLeadLog(level: LeadLogLevel, requestId: string, stage: string, details: Record<string, unknown> = {}): void {
    const payload = {
        requestId,
        stage,
        ...details,
    };

    if (level === 'warn') {
        logger.warn('SUBMIT_LEAD', payload);
        return;
    }

    if (level === 'error') {
        logger.error('SUBMIT_LEAD', payload);
        return;
    }

    logger.info('SUBMIT_LEAD', payload);
}

// getClientIP falls back to 'unknown' when no edge header is present. Meta CAPI
// expects a real address or nothing, so collapse the sentinel to null.
function resolveClientIpAddress(request: Request): string | null {
    const ip = getClientIP(request);
    return ip && ip !== 'unknown' ? ip : null;
}

function getSubmitLeadConfig(): SubmitLeadConfig | null {
    const webhookUrl = process.env.N8N_SUBMIT_LEAD_WEBHOOK_URL?.trim() || '';
    const webhookSecret = process.env.N8N_WEBHOOK_SECRET?.trim() || '';

    if (!webhookUrl || !webhookSecret) {
        return null;
    }

    return {
        webhookUrl,
        webhookSecret,
    };
}

export function classifySubmitLeadError(error: unknown): {
    code: SubmitLeadInternalErrorCode;
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
            error: 'Erro interno ao processar envio do lead.',
        };
    }

    const status = Number(match[1]);
    const detail = truncateDetail(match[2] || '');

    return {
        code: 'N8N_WEBHOOK_ERROR',
        status: Number.isFinite(status) && status >= 400 ? status : 502,
        error: 'Erro ao enviar lead.',
        detail,
    };
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
        prefix: 'ratelimit:submit-lead',
    });

    if (rateLimit.allowed) return null;

    if (rateLimit.serviceUnavailable) {
        emitLeadLog('error', requestId, 'service_unavailable', { clientIP });
        return buildJsonResponse(
            { ok: false, requestId, code: 'SERVICE_UNAVAILABLE', error: 'Serviço temporariamente indisponível. Tente novamente em instantes.' },
            503,
            corsHeaders,
        );
    }

    emitLeadLog('warn', requestId, 'rate_limited', {
        clientIP,
        remaining: rateLimit.remaining,
        retryAfterSeconds: Math.ceil(rateLimit.resetIn / 1000),
    });

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
): SubmitLeadRequest | Response {
    const validation = validatePayload(rawBody);
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

export default async function handler(request: Request): Promise<Response> {
    const requestId = createRequestId();
    const corsHeaders = buildCorsHeaders();
    // Hoisted so the catch block can log recovery data if the N8n call fails after validation.
    let recoveryPayload: SubmitLeadRequest | null = null;

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
                    error: 'Method not allowed',
                },
                405,
                corsHeaders,
            );
        }

        const config = getSubmitLeadConfig();
        if (!config) {
            emitLeadLog('error', requestId, 'config', {
                code: 'SERVER_CONFIG_ERROR',
                hasWebhookUrl: Boolean(process.env.N8N_SUBMIT_LEAD_WEBHOOK_URL?.trim()),
                hasWebhookSecret: Boolean(process.env.N8N_WEBHOOK_SECRET?.trim()),
            });

            return buildJsonResponse(
                {
                    ok: false,
                    requestId,
                    code: 'SERVER_CONFIG_ERROR',
                    error: 'Integração de lead indisponível no momento.',
                },
                500,
                corsHeaders,
            );
        }

        const rateLimitResponse = await getRateLimitResponse(request, corsHeaders, requestId);
        if (rateLimitResponse) return rateLimitResponse;

        const rawBody = await parseRequestBody(request, corsHeaders, requestId);
        if (rawBody instanceof Response) return rawBody;

        const payload = validateRequestPayload(rawBody, corsHeaders, requestId);
        if (payload instanceof Response) return payload;

        recoveryPayload = payload;

        emitLeadLog('info', requestId, 'payload_validated', {
            email: maskEmail(payload.email),
            destination: payload.destination,
            utmSource: payload.utms.utm_source,
            extraTrackingKeys: Object.keys(payload.tracking?.extras ?? {}).length,
            hasClickIds: Boolean(
                payload.tracking?.gclid
                || payload.tracking?.fbclid
                || payload.tracking?.msclkid
                || payload.tracking?.ttclid
                || payload.tracking?.wbraid
                || payload.tracking?.gbraid,
            ),
        });

        await sendLeadToN8n(
            config.webhookUrl,
            config.webhookSecret,
            requestId,
            buildN8nLeadPayload(payload, requestId, {
                clientIpAddress: resolveClientIpAddress(request),
                clientUserAgent: request.headers.get('user-agent'),
            }),
        );

        const response = buildJsonResponse(
            {
                ok: true,
                requestId,
                message: 'Enviado com sucesso',
            },
            201,
            corsHeaders,
        );

        return response;
    } catch (error: unknown) {
        const classified = classifySubmitLeadError(error);

        const recoveryData = recoveryPayload !== null
            ? {
                recoveredLead: {
                    maskedEmail: maskEmail(recoveryPayload.email),
                    maskedPhone: maskPhone(recoveryPayload.whatsapp),
                    maskedFirstName: maskName(recoveryPayload.firstName),
                    destination: recoveryPayload.destination,
                    // bantSummary omitted — may contain sensitive PII (budget, health, family details).
                    // hasBantSummary preserves qualification signal without exposing content to log infra.
                    hasBantSummary: Boolean(recoveryPayload.bantSummary),
                    utms: recoveryPayload.utms,
                },
            }
            : {};

        emitLeadLog('error', requestId, classified.code === 'N8N_WEBHOOK_ERROR' ? 'n8n_webhook_failed' : 'unexpected', {
            code: classified.code,
            status: classified.status,
            errorType: error instanceof Error ? error.name : typeof error,
            detail: classified.detail,
            ...recoveryData,
        });

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
