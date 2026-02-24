import type { LeadTracking, LeadUtms, SubmitLeadRequest, SubmitLeadResponse } from '../types/leadCapture';

export const config = {
    runtime: 'edge',
};

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

interface HubSpotObjectResponse {
    id?: string;
}

interface HubSpotSearchResponse {
    results?: Array<{ id?: string }>;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TRACKING_PROPERTY_MAP: Record<string, string> = {
    cid: 'ga_client_id',
    sid: 'ga_session_id',
    gclid: 'hs_google_click_id',
    fbclid: 'hs_facebook_click_id',
    msclkid: 'hs_linkedin_click_id',
    ttclid: 'tiktok_id',
    gbraid: 'gbraid',
};

const KNOWN_TRACKING_KEYS = new Set([
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'cid',
    'sid',
    'gclid',
    'fbclid',
    'msclkid',
    'ttclid',
    'wbraid',
    'gbraid',
    'fbc',
]);

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

function getClientIP(request: Request): string {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        const ips = forwardedFor.split(',');
        return ips[ips.length - 1].trim(); // Pega o último IP na lista, que é o IP real no Vercel
    }
    const realIP = request.headers.get('x-real-ip');
    if (realIP) return realIP;
    return 'unknown';
}
}

function checkRateLimit(clientIP: string): { allowed: boolean; resetIn: number } {
    const now = Date.now();
    const entry = rateLimitStore.get(clientIP);
    if (!entry || now > entry.resetTime) {
        rateLimitStore.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        return { allowed: true, resetIn: 0 };
    }
    if (entry.count >= RATE_LIMIT_MAX_REQUESTS) return { allowed: false, resetIn: entry.resetTime - now };
    entry.count++;
    return { allowed: true, resetIn: 0 };
}

function normalizeNullable(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function normalizeUtms(value: unknown): LeadUtms {
    const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

    return {
        utm_source: normalizeNullable(source.utm_source),
        utm_medium: normalizeNullable(source.utm_medium),
        utm_campaign: normalizeNullable(source.utm_campaign),
        utm_term: normalizeNullable(source.utm_term),
        utm_content: normalizeNullable(source.utm_content),
    };
}

function normalizeTracking(value: unknown, utms: LeadUtms): LeadTracking {
    const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
    const extrasInput = source.extras && typeof source.extras === 'object'
        ? (source.extras as Record<string, unknown>)
        : {};

    const extras: Record<string, string> = {};

    for (const [key, raw] of Object.entries(extrasInput)) {
        const normalized = normalizeNullable(raw);
        if (normalized) {
            extras[key] = normalized;
        }
    }

    for (const [key, raw] of Object.entries(source)) {
        if (key === 'extras' || KNOWN_TRACKING_KEYS.has(key)) continue;
        const normalized = normalizeNullable(raw);
        if (normalized) {
            extras[key] = normalized;
        }
    }

    return {
        utm_source: normalizeNullable(source.utm_source) ?? utms.utm_source,
        utm_medium: normalizeNullable(source.utm_medium) ?? utms.utm_medium,
        utm_campaign: normalizeNullable(source.utm_campaign) ?? utms.utm_campaign,
        utm_term: normalizeNullable(source.utm_term) ?? utms.utm_term,
        utm_content: normalizeNullable(source.utm_content) ?? utms.utm_content,
        cid: normalizeNullable(source.cid),
        sid: normalizeNullable(source.sid),
        gclid: normalizeNullable(source.gclid),
        fbclid: normalizeNullable(source.fbclid),
        msclkid: normalizeNullable(source.msclkid),
        ttclid: normalizeNullable(source.ttclid),
        wbraid: normalizeNullable(source.wbraid),
        gbraid: normalizeNullable(source.gbraid),
        fbc: normalizeNullable(source.fbc),
        extras: Object.keys(extras).length > 0 ? extras : undefined,
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
        return { valid: false, error: 'Campos obrigatórios ausentes.' };
    }

    if (firstName.length > 100 || lastName.length > 100 || email.length > 255 || bantSummary.length > 5000) {
        return { valid: false, error: 'Entrada muito longa.' };
    }

    if (!EMAIL_REGEX.test(email)) {
        return { valid: false, error: 'Email inválido.' };
    }

    const utms = normalizeUtms(raw.utms);
    const tracking = normalizeTracking(raw.tracking, utms);

    return {
        valid: true,
        data: {
            firstName,
            lastName,
            email,
            bantSummary,
            utms,
            tracking,
        },
    };
}

function getTrackingEntries(tracking?: LeadTracking): Record<string, string> {
    if (!tracking) return {};

    const baseEntries: Record<string, string | null | undefined> = {
        cid: tracking.cid,
        sid: tracking.sid,
        gclid: tracking.gclid,
        fbclid: tracking.fbclid,
        msclkid: tracking.msclkid,
        ttclid: tracking.ttclid,
        gbraid: tracking.gbraid,
        wbraid: tracking.wbraid,
        fbc: tracking.fbc,
    };

    const normalized: Record<string, string> = {};

    for (const [key, value] of Object.entries(baseEntries)) {
        if (!value) continue;
        const trimmed = value.trim();
        if (!trimmed) continue;
        normalized[key] = trimmed;
    }

    if (tracking.extras) {
        for (const [key, value] of Object.entries(tracking.extras)) {
            const trimmed = value.trim();
            if (!trimmed) continue;
            normalized[key] = trimmed;
        }
    }

    return normalized;
}

export function mapTrackingToContactProperties(tracking?: LeadTracking): {
    properties: Record<string, string>;
    unmapped: Record<string, string>;
} {
    const values = getTrackingEntries(tracking);
    const properties: Record<string, string> = {};
    const unmapped: Record<string, string> = {};

    for (const [key, value] of Object.entries(values)) {
        const mappedProperty = TRACKING_PROPERTY_MAP[key];
        if (mappedProperty) {
            properties[mappedProperty] = value;
        } else {
            unmapped[key] = value;
        }
    }

    return { properties, unmapped };
}

function buildContactProperties(payload: SubmitLeadRequest): Record<string, string> {
    const properties: Record<string, string> = {
        firstname: payload.firstName,
        lastname: payload.lastName,
        email: payload.email,
    };

    if (payload.utms.utm_source) properties.ultimo_utm_source = payload.utms.utm_source;
    if (payload.utms.utm_medium) properties.ultimo_utm_medium = payload.utms.utm_medium;
    if (payload.utms.utm_campaign) properties.ultimo_utm_campaign = payload.utms.utm_campaign;
    if (payload.utms.utm_term) properties.utm_term = payload.utms.utm_term;
    if (payload.utms.utm_content) properties.ultimo_utm_content = payload.utms.utm_content;

    const trackingMapping = mapTrackingToContactProperties(payload.tracking);
    Object.assign(properties, trackingMapping.properties);

    const fallbackProperty = cleanString(process.env.HUBSPOT_CONTACT_TRACKING_FALLBACK_PROPERTY);
    if (fallbackProperty && Object.keys(trackingMapping.unmapped).length > 0) {
        properties[fallbackProperty] = JSON.stringify(trackingMapping.unmapped);
    }

    return properties;
}

async function hubspotRequest(
    token: string,
    path: string,
    init: RequestInit,
): Promise<Response> {
    const headers = new Headers(init.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', 'application/json');

    return fetch(`https://api.hubapi.com${path}`, {
        ...init,
        headers,
    });
}

async function getContactIdByEmail(token: string, email: string): Promise<string | null> {
    const response = await hubspotRequest(token, '/crm/v3/objects/contacts/search', {
        method: 'POST',
        body: JSON.stringify({
            filterGroups: [
                {
                    filters: [
                        {
                            propertyName: 'email',
                            operator: 'EQ',
                            value: email,
                        },
                    ],
                },
            ],
            properties: ['email'],
            limit: 1,
        }),
    });

    if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
    }

    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`CONTACT_SEARCH_FAILED:${response.status}:${detail}`);
    }

    const data = (await response.json().catch(() => ({}))) as HubSpotSearchResponse;
    const contactId = cleanString(data.results?.[0]?.id);

    return contactId || null;
}

async function updateContactProperties(token: string, contactId: string, properties: Record<string, string>): Promise<void> {
    const response = await hubspotRequest(token, `/crm/v3/objects/contacts/${contactId}`, {
        method: 'PATCH',
        body: JSON.stringify({ properties }),
    });

    if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
    }

    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`CONTACT_UPDATE_FAILED:${response.status}:${detail}`);
    }
}

async function createDeal(token: string, properties: Record<string, string>): Promise<string> {
    const response = await hubspotRequest(token, '/crm/v3/objects/deals', {
        method: 'POST',
        body: JSON.stringify({ properties }),
    });

    if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
    }

    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`DEAL_CREATE_FAILED:${response.status}:${detail}`);
    }

    const data = (await response.json().catch(() => ({}))) as HubSpotObjectResponse;
    const dealId = cleanString(data.id);
    if (!dealId) {
        throw new Error('DEAL_CREATE_FAILED:missing_id');
    }

    return dealId;
}

async function associateDealToContact(token: string, dealId: string, contactId: string): Promise<void> {
    const response = await hubspotRequest(
        token,
        `/crm/v4/objects/deals/${dealId}/associations/default/contacts/${contactId}`,
        {
            method: 'PUT',
            body: JSON.stringify({}),
        },
    );

    if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
    }

    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`DEAL_ASSOCIATION_FAILED:${response.status}:${detail}`);
    }
}

async function createFallbackNote(token: string, contactId: string, body: string): Promise<void> {
    const noteResponse = await hubspotRequest(token, '/crm/v3/objects/notes', {
        method: 'POST',
        body: JSON.stringify({
            properties: {
                hs_timestamp: new Date().toISOString(),
                hs_note_body: body,
            },
        }),
    });

    if (noteResponse.status === 401) {
        throw new Error('UNAUTHORIZED');
    }

    if (!noteResponse.ok) {
        const detail = await noteResponse.text().catch(() => '');
        throw new Error(`NOTE_CREATE_FAILED:${noteResponse.status}:${detail}`);
    }

    const noteData = (await noteResponse.json().catch(() => ({}))) as HubSpotObjectResponse;
    const noteId = cleanString(noteData.id);
    if (!noteId) {
        throw new Error('NOTE_CREATE_FAILED:missing_id');
    }

    const associationResponse = await hubspotRequest(
        token,
        `/crm/v4/objects/notes/${noteId}/associations/default/contacts/${contactId}`,
        {
            method: 'PUT',
            body: JSON.stringify({}),
        },
    );

    if (associationResponse.status === 401) {
        throw new Error('UNAUTHORIZED');
    }

    if (!associationResponse.ok) {
        const detail = await associationResponse.text().catch(() => '');
        throw new Error(`NOTE_ASSOCIATION_FAILED:${associationResponse.status}:${detail}`);
    }
}

export default async function handler(request: Request): Promise<Response> {
    const corsHeaders = buildCorsHeaders();

    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(clientIP);
    if (!rateLimit.allowed) {
        return buildErrorResponse(
            { ok: false, code: 'RATE_LIMIT_EXCEEDED', error: 'Muitas tentativas. Tente novamente em breve.' },
            429,
            { ...corsHeaders, 'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)) },
        );
    }

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
    const dealPipelineId = cleanString(process.env.HUBSPOT_DEAL_PIPELINE_ID);
    const dealStageId = cleanString(process.env.HUBSPOT_DEAL_STAGE_ID);
    const dealBantProperty = cleanString(process.env.HUBSPOT_DEAL_BANT_PROPERTY) || 'bant_summary';

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

    if (!dealPipelineId || !dealStageId) {
        return buildErrorResponse(
            {
                ok: false,
                code: 'SERVER_CONFIG_ERROR',
                error: 'Server configuration error: HUBSPOT_DEAL_PIPELINE_ID or HUBSPOT_DEAL_STAGE_ID missing',
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

        if (validation.valid === false) {
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
        const contactProperties = buildContactProperties(payload);

        let contactId = '';

        const createContactResponse = await hubspotRequest(hubspotToken, '/crm/v3/objects/contacts', {
            method: 'POST',
            body: JSON.stringify({ properties: contactProperties }),
        });

        if (createContactResponse.status === 401) {
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

        if (createContactResponse.status === 409) {
            try {
                const existingContactId = await getContactIdByEmail(hubspotToken, payload.email);
                if (!existingContactId) {
                    return buildErrorResponse(
                        {
                            ok: false,
                            code: 'HUBSPOT_API_ERROR',
                            error: 'Contato duplicado, mas não foi possível localizar o registro existente.',
                        },
                        502,
                        corsHeaders,
                    );
                }

                contactId = existingContactId;
                await updateContactProperties(hubspotToken, contactId, contactProperties);
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : 'Unknown duplicate-contact error';
                if (message.includes('UNAUTHORIZED')) {
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

                console.error('HUBSPOT: Duplicate contact recovery failed', message);
                return buildErrorResponse(
                    {
                        ok: false,
                        code: 'HUBSPOT_API_ERROR',
                        error: 'Falha ao recuperar contato existente no HubSpot.',
                    },
                    502,
                    corsHeaders,
                );
            }
        } else if (!createContactResponse.ok) {
            const hubspotErrorText = await createContactResponse.text().catch(() => '');
            console.error('HUBSPOT: Error creating contact', createContactResponse.status, hubspotErrorText);

            return buildErrorResponse(
                {
                    ok: false,
                    code: 'HUBSPOT_API_ERROR',
                    error: 'Erro ao criar contato no HubSpot.',
                },
                502,
                corsHeaders,
            );
        } else {
            const hubspotData = (await createContactResponse.json().catch(() => ({}))) as HubSpotObjectResponse;
            const resolvedId = cleanString(hubspotData.id);
            if (!resolvedId) {
                return buildErrorResponse(
                    {
                        ok: false,
                        code: 'HUBSPOT_API_ERROR',
                        error: 'Contato criado mas ID não retornado pelo HubSpot',
                    },
                    502,
                    corsHeaders,
                );
            }
            contactId = resolvedId;
        }

        const dealProperties: Record<string, string> = {
            dealname: `Lead chatbot - ${payload.firstName} ${payload.lastName}`,
            pipeline: dealPipelineId,
            dealstage: dealStageId,
            [dealBantProperty]: payload.bantSummary,
        };

        let dealId: string | undefined;
        let warning: string | undefined;

        try {
            dealId = await createDeal(hubspotToken, dealProperties);
            await associateDealToContact(hubspotToken, dealId, contactId);
        } catch (dealError: unknown) {
            const message = dealError instanceof Error ? dealError.message : 'Unknown deal error';

            if (message.includes('UNAUTHORIZED')) {
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

            console.error('HUBSPOT: Deal creation/association failed', message);

            warning = 'Contato salvo, mas não foi possível criar ou associar o deal automaticamente.';

            try {
                const noteBody = [
                    'Fallback automático do chatbot:',
                    warning,
                    `Lead: ${payload.firstName} ${payload.lastName} <${payload.email}>`,
                    `BANT: ${payload.bantSummary}`,
                ].join('\n');

                await createFallbackNote(hubspotToken, contactId, noteBody);
                warning = `${warning} Uma nota foi registrada no contato para acompanhamento manual.`;
            } catch (noteError: unknown) {
                const noteMessage = noteError instanceof Error ? noteError.message : 'Unknown note fallback error';
                console.error('HUBSPOT: Note fallback failed', noteMessage);
            }
        }

        return new Response(
            JSON.stringify({
                ok: true,
                contactId,
                dealId,
                warning,
                message: dealId
                    ? 'Contato e deal criados com sucesso no HubSpot.'
                    : 'Contato criado com sucesso no HubSpot.',
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
