import type { LeadUtms, SubmitLeadRequest, SubmitLeadResponse } from '../types/leadCapture';

export const config = {
    runtime: 'edge',
};

interface HubSpotContactResponse {
    id?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function buildCorsHeaders(): Record<string, string> {
    return {
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
}

function cleanString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
}

function normalizeUtm(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function normalizeUtms(value: unknown): LeadUtms {
    const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

    return {
        utm_source: normalizeUtm(source.utm_source),
        utm_medium: normalizeUtm(source.utm_medium),
        utm_campaign: normalizeUtm(source.utm_campaign),
        utm_term: normalizeUtm(source.utm_term),
        utm_content: normalizeUtm(source.utm_content),
    };
}

function buildErrorResponse(
    body: SubmitLeadResponse,
    status: number,
    corsHeaders: Record<string, string>,
): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
}

function validatePayload(payload: unknown): { valid: true; data: SubmitLeadRequest } | { valid: false; error: string } {
    if (!payload || typeof payload !== 'object') {
        return { valid: false, error: 'Payload inválido.' };
    }

    const raw = payload as Record<string, unknown>;
    const firstName = cleanString(raw.firstName);
    const lastName = cleanString(raw.lastName);
    const email = cleanString(raw.email).toLowerCase();
    const bantSummary = cleanString(raw.bantSummary);

    if (!firstName || !lastName || !email || !bantSummary) {
        return { valid: false, error: 'Campos obrigatórios ausentes: firstName, lastName, email e bantSummary.' };
    }

    if (!EMAIL_REGEX.test(email)) {
        return { valid: false, error: 'Email inválido.' };
    }

    return {
        valid: true,
        data: {
            firstName,
            lastName,
            email,
            bantSummary,
            utms: normalizeUtms(raw.utms),
        },
    };
}

export default async function handler(request: Request): Promise<Response> {
    const corsHeaders = buildCorsHeaders();

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
        return buildErrorResponse(
            {
                ok: false,
                code: 'METHOD_NOT_ALLOWED',
                error: 'Method not allowed',
            },
            405,
            corsHeaders,
        );
    }

    const hubspotToken = process.env.HUBSPOT_TOKEN;
    if (!hubspotToken) {
        return buildErrorResponse(
            {
                ok: false,
                code: 'SERVER_CONFIG_ERROR',
                error: 'Server configuration error: HUBSPOT_TOKEN missing',
            },
            500,
            corsHeaders,
        );
    }

    try {
        let rawBody: unknown;
        try {
            rawBody = await request.json();
        } catch {
            return buildErrorResponse(
                {
                    ok: false,
                    code: 'VALIDATION_ERROR',
                    error: 'JSON inválido no corpo da requisição.',
                },
                400,
                corsHeaders,
            );
        }

        const validation = validatePayload(rawBody);

        if (!validation.valid) {
            return buildErrorResponse(
                {
                    ok: false,
                    code: 'VALIDATION_ERROR',
                    error: validation.error,
                },
                400,
                corsHeaders,
            );
        }

        const payload = validation.data;
        const properties: Record<string, string> = {
            firstname: payload.firstName,
            lastname: payload.lastName,
            email: payload.email,
            bant_summary: payload.bantSummary,
        };

        if (payload.utms.utm_source) properties.ultimo_utm_source = payload.utms.utm_source;
        if (payload.utms.utm_medium) properties.ultimo_utm_medium = payload.utms.utm_medium;
        if (payload.utms.utm_campaign) properties.ultimo_utm_campaign = payload.utms.utm_campaign;
        if (payload.utms.utm_term) properties.utm_term = payload.utms.utm_term;
        if (payload.utms.utm_content) properties.ultimo_utm_content = payload.utms.utm_content;

        const hubspotResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${hubspotToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ properties }),
        });

        if (hubspotResponse.status === 401) {
            return buildErrorResponse(
                {
                    ok: false,
                    code: 'HUBSPOT_UNAUTHORIZED',
                    error: 'Token do HubSpot inválido ou sem permissão.',
                },
                401,
                corsHeaders,
            );
        }

        if (hubspotResponse.status === 409) {
            return buildErrorResponse(
                {
                    ok: false,
                    code: 'HUBSPOT_DUPLICATE_CONTACT',
                    error: 'Contato já existe no HubSpot.',
                },
                409,
                corsHeaders,
            );
        }

        if (!hubspotResponse.ok) {
            const hubspotErrorText = await hubspotResponse.text().catch(() => '');
            console.error('HUBSPOT: Error creating contact', hubspotResponse.status, hubspotErrorText);

            return buildErrorResponse(
                {
                    ok: false,
                    code: 'HUBSPOT_API_ERROR',
                    error: 'Erro ao criar contato no HubSpot.',
                },
                502,
                corsHeaders,
            );
        }

        const hubspotData = (await hubspotResponse.json().catch(() => ({}))) as HubSpotContactResponse;
        const contactId = cleanString(hubspotData.id) || 'unknown';

        return new Response(
            JSON.stringify({
                ok: true,
                contactId,
                message: 'Contato criado com sucesso no HubSpot.',
            } satisfies SubmitLeadResponse),
            {
                status: 201,
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
            },
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('SERVER: submit-lead unexpected error:', message);

        return buildErrorResponse(
            {
                ok: false,
                code: 'HUBSPOT_API_ERROR',
                error: 'Erro interno ao processar envio do lead.',
            },
            500,
            corsHeaders,
        );
    }
}
