import type { SubmitContactRequest, SubmitContactResponse } from '../types/contactCapture';
import { buildCorsHeaders, createRequestId, getClientIP } from '../lib/network';
import { checkRateLimit } from '../lib/rate-limit';
import {
    cleanString,
    normalizeNullable,
    normalizeTracking,
    normalizeUtms,
    normalizeWhatsappNumber,
} from '../lib/lead-logic';
import { buildN8nContactPayload } from '../lib/n8n-payloads';
import { sendContactToN8n } from '../services/n8n';

export const config = {
    runtime: 'edge',
};

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_KEY_PREFIX = 'ratelimit:submit-contact';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ContactConfig {
    webhookUrl: string;
    webhookSecret: string;
}

function getContactConfig(): ContactConfig | null {
    const webhookUrl = cleanString(process.env.N8N_SUBMIT_CONTACT_WEBHOOK_URL);
    const webhookSecret = cleanString(process.env.N8N_WEBHOOK_SECRET);
    if (!webhookUrl || !webhookSecret) return null;
    return { webhookUrl, webhookSecret };
}

function buildJsonResponse(
    body: SubmitContactResponse,
    status: number,
    corsHeaders: Record<string, string>,
): Response {
    const requestId =
        'requestId' in body && typeof body.requestId === 'string' ? body.requestId : undefined;
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...(requestId ? { 'X-Request-Id': requestId } : {}),
            ...corsHeaders,
        },
    });
}

async function getRateLimitResponse(
    request: Request,
    corsHeaders: Record<string, string>,
    requestId: string,
): Promise<Response | null> {
    const clientIP = getClientIP(request);
    const rateLimitResult = await checkRateLimit(clientIP, {
        limit: RATE_LIMIT_MAX_REQUESTS,
        windowMs: RATE_LIMIT_WINDOW_MS,
        prefix: RATE_LIMIT_KEY_PREFIX,
    });

    if (rateLimitResult.allowed) return null;

    return buildJsonResponse(
        {
            ok: false,
            requestId,
            error: 'Muitas requisições. Tente novamente em breve.',
            code: 'RATE_LIMIT_EXCEEDED',
        },
        429,
        {
            ...corsHeaders,
            'Retry-After': String(Math.ceil(rateLimitResult.resetIn / 1000)),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(Math.ceil((Date.now() + rateLimitResult.resetIn) / 1000)),
        },
    );
}

function validateContactRequest(body: unknown): SubmitContactRequest | null {
    if (!body || typeof body !== 'object') return null;
    const raw = body as Record<string, unknown>;

    const firstName = cleanString(raw.firstName);
    const whatsapp = normalizeWhatsappNumber(raw.whatsapp);
    const email = normalizeNullable(raw.email, 255)?.toLowerCase();

    if (!firstName || !whatsapp) return null;
    if (firstName.length > 100 || whatsapp.length > 16) return null;
    if (email && !EMAIL_REGEX.test(email)) return null;

    const utms = normalizeUtms(raw.utms);
    const tracking = normalizeTracking(raw.tracking, utms);

    return {
        firstName,
        lastName: normalizeNullable(raw.lastName, 100) ?? undefined,
        whatsapp,
        email,
        emailOptIn: Boolean(raw.emailOptIn),
        source: normalizeNullable(raw.source, 128) ?? undefined,
        destination: normalizeNullable(raw.destination, 255) ?? undefined,
        eventId: normalizeNullable(raw.eventId, 128) ?? undefined,
        utms,
        tracking,
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
                error: 'Corpo da requisição inválido.',
                code: 'VALIDATION_ERROR',
            },
            400,
            corsHeaders,
        );
    }
}

export default async function handler(request: Request): Promise<Response> {
    const corsHeaders = buildCorsHeaders();
    const requestId = createRequestId();

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
        return buildJsonResponse(
            { ok: false, requestId, error: 'Method not allowed.', code: 'METHOD_NOT_ALLOWED' },
            405,
            corsHeaders,
        );
    }

    const contactConfig = getContactConfig();
    if (!contactConfig) {
        return buildJsonResponse(
            {
                ok: false,
                requestId,
                error: 'Serviço temporariamente indisponível.',
                code: 'SERVER_CONFIG_ERROR',
            },
            503,
            corsHeaders,
        );
    }

    const rateLimitResponse = await getRateLimitResponse(request, corsHeaders, requestId);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await parseRequestBody(request, corsHeaders, requestId);
    if (body instanceof Response) return body;

    const payload = validateContactRequest(body);
    if (!payload) {
        return buildJsonResponse(
            {
                ok: false,
                requestId,
                error: 'Nome e WhatsApp são obrigatórios.',
                code: 'VALIDATION_ERROR',
            },
            400,
            corsHeaders,
        );
    }

    try {
        await sendContactToN8n(
            contactConfig.webhookUrl,
            contactConfig.webhookSecret,
            requestId,
            buildN8nContactPayload(payload, requestId),
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        const isWebhookError = message.startsWith('N8N_WEBHOOK_ERROR:');
        return buildJsonResponse(
            {
                ok: false,
                requestId,
                error: 'Não foi possível enviar sua mensagem. Tente novamente.',
                code: isWebhookError ? 'N8N_WEBHOOK_ERROR' : 'INTERNAL_ERROR',
            },
            isWebhookError ? 502 : 500,
            corsHeaders,
        );
    }

    return buildJsonResponse({ ok: true, requestId }, 200, corsHeaders);
}
