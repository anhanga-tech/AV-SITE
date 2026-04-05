import type { SubmitLeadRequest, SubmitLeadResponse } from '../types/leadCapture';
import { buildCorsHeaders, getClientIP } from '../lib/network';
import { checkRateLimit } from '../lib/rate-limit';
import { cleanString, validatePayload } from '../lib/lead-logic';
import { buildN8nLeadPayload } from '../lib/n8n-payloads';
import { sendGoogleConversion } from '../lib/conversions/google';
import { sendMetaConversion } from '../lib/conversions/meta';
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

function createRequestId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `lead_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function truncateDetail(detail: string): string | undefined {
    const normalized = detail.replace(/[\r\n]+/g, ' ').trim();
    return normalized ? normalized.substring(0, 600) : undefined;
}

function maskEmail(email: string): string {
    const [localPart, domainPart] = email.split('@');
    if (!domainPart) return 'hidden';

    const firstChar = localPart?.trim().charAt(0) || '*';
    return `${firstChar}***@${domainPart}`;
}

function emitLeadLog(level: LeadLogLevel, requestId: string, stage: string, details: Record<string, unknown> = {}): void {
    const payload = {
        requestId,
        stage,
        ...details,
    };

    if (level === 'warn') {
        console.warn('SUBMIT_LEAD', payload);
        return;
    }

    if (level === 'error') {
        console.error('SUBMIT_LEAD', payload);
        return;
    }

    console.log('SUBMIT_LEAD', payload);
}

function buildJsonResponse(
    body: SubmitLeadResponse,
    status: number,
    corsHeaders: Record<string, string>,
): Response {
    const requestId = typeof body === 'object' && body && 'requestId' in body && typeof body.requestId === 'string'
        ? body.requestId
        : undefined;

    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...(requestId ? { 'X-Request-Id': requestId } : {}),
            ...corsHeaders,
        },
    });
}

function getSubmitLeadConfig(): SubmitLeadConfig | null {
    const webhookUrl = cleanString(process.env.N8N_SUBMIT_LEAD_WEBHOOK_URL);
    const webhookSecret = cleanString(process.env.N8N_WEBHOOK_SECRET);

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

    const detail = truncateDetail(match[2] || '');

    return {
        code: 'N8N_WEBHOOK_ERROR',
        status: 502,
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

async function trackLeadConversions(payload: SubmitLeadRequest, requestId: string): Promise<void> {
    const [googleResult, metaResult] = await Promise.all([
        sendGoogleConversion('lead_qualificado', {
            clientId: payload.tracking?.cid,
            sessionId: payload.tracking?.sid,
            gclid: payload.tracking?.gclid,
            destination: payload.destination,
        }),
        sendMetaConversion({
            eventName: 'Lead',
            eventId: payload.event_id,
            email: payload.email,
            phone: payload.tracking?.extras?.phone,
            firstName: payload.firstName,
            lastName: payload.lastName,
            fbclid: payload.tracking?.fbclid,
            fbc: payload.tracking?.fbc,
            fbp: payload.tracking?.fbp,
            contentName: payload.destination,
            contentType: 'destination_interest',
        }),
    ]);

    emitLeadLog('info', requestId, 'conversions', {
        ga4: googleResult.success ? 'ok' : googleResult.error || 'failed',
        metaAds: metaResult.success ? 'ok' : metaResult.error || 'failed',
    });

    if (!googleResult.success) console.warn('[GA4 MP] Lead conversion failed', googleResult.error);
    if (!metaResult.success) console.warn('META: Lead conversion failed', metaResult.error);
}

export default async function handler(request: Request): Promise<Response> {
    const requestId = createRequestId();
    const corsHeaders = buildCorsHeaders();

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
                hasWebhookUrl: Boolean(cleanString(process.env.N8N_SUBMIT_LEAD_WEBHOOK_URL)),
                hasWebhookSecret: Boolean(cleanString(process.env.N8N_WEBHOOK_SECRET)),
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

        const rawBody = await parseRequestBody(request, corsHeaders, requestId);
        if (rawBody instanceof Response) return rawBody;

        const payload = validateRequestPayload(rawBody, corsHeaders, requestId);
        if (payload instanceof Response) return payload;

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

        const rateLimitResponse = await getRateLimitResponse(request, corsHeaders, requestId);
        if (rateLimitResponse) return rateLimitResponse;

        await sendLeadToN8n(
            config.webhookUrl,
            config.webhookSecret,
            requestId,
            buildN8nLeadPayload(payload, requestId),
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

        void trackLeadConversions(payload, requestId).catch((conversionError: unknown) => {
            emitLeadLog('warn', requestId, 'conversions_failed', {
                detail: truncateDetail(conversionError instanceof Error ? conversionError.message : String(conversionError)),
            });
        });

        return response;
    } catch (error: unknown) {
        const classified = classifySubmitLeadError(error);

        emitLeadLog('error', requestId, classified.code === 'N8N_WEBHOOK_ERROR' ? 'n8n_webhook_failed' : 'unexpected', {
            code: classified.code,
            status: classified.status,
            errorType: error instanceof Error ? error.name : typeof error,
            detail: classified.detail,
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
