export const config = {
    runtime: 'edge',
};

import type { SubmitLeadRequest, SubmitLeadResponse } from '../types/leadCapture';
import { checkRateLimit as checkRateLimitInternal } from '../lib/rate-limit';
import { buildCorsHeaders, getClientIP } from '../lib/network';
import { cleanString, validatePayload } from '../lib/lead-logic';
import {
    associateDealToContact,
    buildContactProperties,
    createDeal,
    createFallbackNote,
    getContactIdByEmail,
    hubspotRequest,
    updateContactProperties,
    type HubSpotObjectResponse
} from '../services/hubspot';
import { sendGoogleConversion } from '../lib/conversions/google';
import { sendMetaConversion } from '../lib/conversions/meta';

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

interface SubmitLeadConfig {
    hubspotToken: string;
    dealPipelineId: string;
    dealStageId: string;
    dealBantProperty: string;
}

interface DealCreationResult {
    dealId?: string;
    warning?: string;
}

/**
 * Builds a standard error response for the API.
 */
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

function buildSuccessResponse(
    body: SubmitLeadResponse,
    status: number,
    corsHeaders: Record<string, string>,
): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
}

async function getRateLimitResponse(
    request: Request,
    corsHeaders: Record<string, string>,
): Promise<Response | null> {
    const clientIP = getClientIP(request);
    const rateLimit = await checkRateLimitInternal(clientIP, {
        limit: RATE_LIMIT_MAX_REQUESTS,
        windowMs: RATE_LIMIT_WINDOW_MS,
        prefix: 'ratelimit:submit-lead',
    });

    if (rateLimit.allowed) return null;

    return buildErrorResponse(
        { ok: false, code: 'RATE_LIMIT_EXCEEDED', error: 'Muitas tentativas. Tente novamente em breve.' },
        429,
        { ...corsHeaders, 'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)) },
    );
}

function getSubmitLeadConfig(): SubmitLeadConfig | null {
    const hubspotToken = process.env.HUBSPOT_TOKEN;
    const dealPipelineId = cleanString(process.env.HUBSPOT_DEAL_PIPELINE_ID);
    const dealStageId = cleanString(process.env.HUBSPOT_DEAL_STAGE_ID);

    if (!hubspotToken || !dealPipelineId || !dealStageId) {
        return null;
    }

    return {
        hubspotToken,
        dealPipelineId,
        dealStageId,
        dealBantProperty: cleanString(process.env.HUBSPOT_DEAL_BANT_PROPERTY) || 'bant_summary',
    };
}

async function parseRequestBody(
    request: Request,
    corsHeaders: Record<string, string>,
): Promise<unknown | Response> {
    try {
        return await request.json();
    } catch {
        return buildErrorResponse(
            { ok: false, code: 'VALIDATION_ERROR', error: 'JSON inválido no corpo da requisição.' },
            400,
            corsHeaders,
        );
    }
}

function validateRequestPayload(
    rawBody: unknown,
    corsHeaders: Record<string, string>,
): SubmitLeadRequest | Response {
    const validation = validatePayload(rawBody);
    if (validation.valid === false) {
        return buildErrorResponse(
            { ok: false, code: 'VALIDATION_ERROR', error: validation.error },
            400,
            corsHeaders,
        );
    }

    return validation.data;
}

function isUnauthorizedHubSpotError(message: string): boolean {
    return message.includes('UNAUTHORIZED');
}

async function recoverDuplicateContact(
    hubspotToken: string,
    email: string,
    contactProperties: Record<string, string>,
): Promise<string> {
    const existingContactId = await getContactIdByEmail(hubspotToken, email);
    if (!existingContactId) {
        throw new Error('Contact ID not found for existing email');
    }

    await updateContactProperties(hubspotToken, existingContactId, contactProperties);
    return existingContactId;
}

async function createOrUpdateContact(
    hubspotToken: string,
    payload: { email: string },
    contactProperties: Record<string, string>,
    corsHeaders: Record<string, string>,
): Promise<string | Response> {
    const createContactResponse = await hubspotRequest(hubspotToken, '/crm/v3/objects/contacts', {
        method: 'POST',
        body: JSON.stringify({ properties: contactProperties }),
    });

    if (createContactResponse.status === 401) {
        return buildErrorResponse(
            { ok: false, code: 'HUBSPOT_UNAUTHORIZED', error: 'Erro de integração com o CRM' },
            401,
            corsHeaders,
        );
    }

    if (createContactResponse.status === 409) {
        try {
            return await recoverDuplicateContact(hubspotToken, payload.email, contactProperties);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown recovery error';
            console.error('HUBSPOT: Duplicate contact recovery failed', message);

            if (isUnauthorizedHubSpotError(message)) {
                return buildErrorResponse(
                    { ok: false, code: 'HUBSPOT_UNAUTHORIZED', error: 'Erro de integração com o CRM' },
                    401,
                    corsHeaders,
                );
            }

            return buildErrorResponse(
                { ok: false, code: 'HUBSPOT_API_ERROR', error: 'Erro ao processar contato' },
                502,
                corsHeaders,
            );
        }
    }

    if (!createContactResponse.ok) {
        const hubspotErrorText = await createContactResponse.text().catch(() => '');
        console.error('HUBSPOT: Error creating contact', createContactResponse.status, hubspotErrorText);

        return buildErrorResponse(
            { ok: false, code: 'HUBSPOT_API_ERROR', error: 'Erro de integração com o CRM' },
            502,
            corsHeaders,
        );
    }

    const hubspotData = (await createContactResponse.json().catch(() => ({}))) as HubSpotObjectResponse;
    const contactId = cleanString(hubspotData.id);
    if (!contactId) {
        return buildErrorResponse(
            { ok: false, code: 'HUBSPOT_API_ERROR', error: 'Erro de integração com o CRM' },
            502,
            corsHeaders,
        );
    }

    return contactId;
}

function buildDealProperties(
    payload: {
        firstName: string;
        lastName: string;
        destination: string;
        bantSummary: string;
    },
    config: SubmitLeadConfig,
): Record<string, string> {
    const rawDealName = `Lead chatbot - ${payload.firstName} ${payload.lastName} - ${payload.destination}`;

    return {
        dealname: rawDealName.length > 255 ? `${rawDealName.substring(0, 252)}...` : rawDealName,
        pipeline: config.dealPipelineId,
        dealstage: config.dealStageId,
        [config.dealBantProperty]: payload.bantSummary,
    };
}

async function createFallbackNoteForLead(
    hubspotToken: string,
    contactId: string,
    payload: {
        firstName: string;
        lastName: string;
        email: string;
        bantSummary: string;
    },
    baseWarning: string,
): Promise<string> {
    try {
        const noteBody = [
            'Fallback automático do chatbot:',
            baseWarning,
            `Lead: ${payload.firstName} ${payload.lastName} <${payload.email}>`,
            `BANT: ${payload.bantSummary}`,
        ].join('\n');

        await createFallbackNote(hubspotToken, contactId, noteBody);
        return `${baseWarning} Uma nota foi registrada no contato para acompanhamento manual.`;
    } catch (noteError: unknown) {
        console.error('HUBSPOT: Note fallback failed', noteError);
        return baseWarning;
    }
}

async function createDealForLead(
    hubspotToken: string,
    contactId: string,
    payload: {
        firstName: string;
        lastName: string;
        email: string;
        destination: string;
        bantSummary: string;
    },
    config: SubmitLeadConfig,
    corsHeaders: Record<string, string>,
): Promise<DealCreationResult | Response> {
    try {
        const dealId = await createDeal(hubspotToken, buildDealProperties(payload, config));
        await associateDealToContact(hubspotToken, dealId, contactId);
        return { dealId };
    } catch (dealError: unknown) {
        const message = dealError instanceof Error ? dealError.message : 'Unknown deal error';
        console.error('HUBSPOT: Deal creation/association failed', message);

        if (isUnauthorizedHubSpotError(message)) {
            return buildErrorResponse(
                { ok: false, code: 'HUBSPOT_UNAUTHORIZED', error: 'Erro de integração com o CRM' },
                401,
                corsHeaders,
            );
        }

        const warning = await createFallbackNoteForLead(
            hubspotToken,
            contactId,
            payload,
            'Contato salvo, mas não foi possível criar ou associar o deal automaticamente.',
        );

        return { warning };
    }
}

async function trackLeadConversions(payload: SubmitLeadRequest): Promise<void> {
    const [googleResult, metaResult] = await Promise.all([
        sendGoogleConversion('lead_qualificado', {
            gclid: payload.tracking?.gclid,
            email: payload.email,
            phone: payload.tracking?.extras?.phone,
        }),
        sendMetaConversion({
            eventName: 'Lead',
            email: payload.email,
            phone: payload.tracking?.extras?.phone,
            firstName: payload.firstName,
            lastName: payload.lastName,
            fbclid: payload.tracking?.fbclid,
            fbc: payload.tracking?.fbc,
            contentName: payload.destination,
            contentType: 'destination_interest',
        })
    ]);

    if (!googleResult.success) console.warn('GOOGLE_ADS: Lead conversion failed', googleResult.error);
    if (!metaResult.success) console.warn('META: Lead conversion failed', metaResult.error);
}

/**
 * Main handler for the submit-lead Edge Function.
 */
export default async function handler(request: Request): Promise<Response> {
    const corsHeaders = buildCorsHeaders();

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    const rateLimitResponse = await getRateLimitResponse(request, corsHeaders);
    if (rateLimitResponse) return rateLimitResponse;

    if (request.method !== 'POST') {
        return buildErrorResponse(
            { ok: false, code: 'METHOD_NOT_ALLOWED', error: 'Method not allowed' },
            405,
            corsHeaders,
        );
    }

    const config = getSubmitLeadConfig();
    if (!config) {
        console.error('SERVER_CONFIG_ERROR: Missing required HubSpot environment variables.');
        return buildErrorResponse(
            { ok: false, code: 'SERVER_CONFIG_ERROR', error: 'Erro de configuração do servidor' },
            500,
            corsHeaders,
        );
    }

    try {
        const rawBody = await parseRequestBody(request, corsHeaders);
        if (rawBody instanceof Response) return rawBody;

        const payload = validateRequestPayload(rawBody, corsHeaders);
        if (payload instanceof Response) return payload;
        const contactProperties = buildContactProperties(payload);
        const contactId = await createOrUpdateContact(config.hubspotToken, payload, contactProperties, corsHeaders);
        if (contactId instanceof Response) return contactId;

        const dealResult = await createDealForLead(config.hubspotToken, contactId, payload, config, corsHeaders);
        if (dealResult instanceof Response) return dealResult;

        await trackLeadConversions(payload);

        return buildSuccessResponse(
            {
                ok: true,
                contactId,
                dealId: dealResult.dealId,
                warning: dealResult.warning,
                message: dealResult.dealId
                    ? 'Contato e deal criados com sucesso no HubSpot.'
                    : 'Contato criado com sucesso no HubSpot.',
            } satisfies SubmitLeadResponse,
            201,
            corsHeaders,
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('SERVER: submit-lead unexpected error:', message);

        return buildErrorResponse(
            { ok: false, code: 'HUBSPOT_API_ERROR', error: 'Erro interno ao processar envio do lead.' },
            500,
            corsHeaders,
        );
    }
}
