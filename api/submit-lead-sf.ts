import { buildCorsHeaders, createRequestId, getClientIP } from '../lib/network';
import { checkRateLimit } from '../lib/rate-limit';
import { cleanString, normalizeWhatsappNumber, maskEmail } from '../lib/lead-logic';
import { logger } from '../lib/logger';
import { postWebToLead } from '../services/salesforce';
import type { SalesforceLeadFields } from '../services/salesforce';

export const config = {
    runtime: 'edge',
};

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

const VALID_LEAD_SOURCES = new Set([
    'Advertisement',
    'Employee Referral',
    'External Referral',
    'Partner',
    'Public Relations',
    'Seminar - Internal',
    'Corporativo',
    'Trade Show',
    'Web',
    'Word of mouth',
    'Other',
]);

function buildJsonResponse(
    body: Record<string, unknown>,
    status: number,
    corsHeaders: Record<string, string>,
): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
}

function validateSfLeadBody(raw: unknown): { valid: true; data: SalesforceLeadFields } | { valid: false; error: string } {
    if (!raw || typeof raw !== 'object') {
        return { valid: false, error: 'Corpo da requisição inválido.' };
    }

    const body = raw as Record<string, unknown>;

    const firstName = cleanString(body.firstName);
    const lastName = cleanString(body.lastName);
    const email = cleanString(body.email).toLowerCase();

    if (!firstName || !lastName || !email) {
        return { valid: false, error: 'Campos obrigatórios ausentes.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { valid: false, error: 'Email inválido.' };
    }

    const phone = normalizeWhatsappNumber(body.whatsapp) ?? undefined;
    const company = cleanString(body.empresa) || undefined;
    const title = cleanString(body.cargo) || undefined;
    const description = cleanString(body.description) || undefined;

    const rawLeadSource = cleanString(body.leadSource);
    const leadSource = VALID_LEAD_SOURCES.has(rawLeadSource) ? rawLeadSource : 'Web';

    return {
        valid: true,
        data: {
            firstName,
            lastName,
            email,
            phone,
            company,
            title,
            leadSource,
            description,
        },
    };
}

export default async function handler(request: Request): Promise<Response> {
    const requestId = createRequestId();
    const corsHeaders = buildCorsHeaders();

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
        return buildJsonResponse({ ok: false, requestId, error: 'Method not allowed' }, 405, corsHeaders);
    }

    const clientIP = getClientIP(request);
    const rateLimit = await checkRateLimit(clientIP, {
        limit: RATE_LIMIT_MAX_REQUESTS,
        windowMs: RATE_LIMIT_WINDOW_MS,
        prefix: 'ratelimit:submit-lead-sf',
    });

    if (!rateLimit.allowed) {
        if (rateLimit.serviceUnavailable) {
            return buildJsonResponse({ ok: false, requestId, error: 'Serviço temporariamente indisponível.' }, 503, corsHeaders);
        }
        return buildJsonResponse(
            { ok: false, requestId, error: 'Muitas tentativas. Tente novamente em breve.' },
            429,
            { ...corsHeaders, 'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)) },
        );
    }

    let rawBody: unknown;
    try {
        rawBody = await request.json();
    } catch {
        return buildJsonResponse({ ok: false, requestId, error: 'JSON inválido.' }, 400, corsHeaders);
    }

    const validation = validateSfLeadBody(rawBody);
    if (!validation.valid) {
        return buildJsonResponse({ ok: false, requestId, error: validation.error }, 400, corsHeaders);
    }

    const fields = validation.data;

    logger.info('SUBMIT_LEAD_SF', {
        requestId,
        stage: 'sending',
        email: maskEmail(fields.email),
        leadSource: fields.leadSource,
    });

    try {
        const result = await postWebToLead(fields);

        if (!result.ok) {
            logger.error('SUBMIT_LEAD_SF', { requestId, stage: 'sf_rejected' });
            return buildJsonResponse({ ok: false, requestId, error: 'Falha ao enviar para Salesforce.' }, 502, corsHeaders);
        }

        logger.info('SUBMIT_LEAD_SF', { requestId, stage: 'success' });
        return buildJsonResponse({ ok: true, requestId }, 201, corsHeaders);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        const isTimeout = error instanceof Error && error.name === 'AbortError';

        logger.error('SUBMIT_LEAD_SF', {
            requestId,
            stage: isTimeout ? 'timeout' : 'error',
            detail: message.slice(0, 200),
        });

        return buildJsonResponse(
            { ok: false, requestId, error: 'Erro ao processar envio para Salesforce.' },
            isTimeout ? 504 : 500,
            corsHeaders,
        );
    }
}
