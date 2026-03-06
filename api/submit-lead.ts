import type { SubmitLeadResponse } from '../types/leadCapture';
import { checkRateLimit as checkRateLimitInternal } from '../lib/rate-limit.ts';
import { buildCorsHeaders, getClientIP } from '../lib/network.ts';
import { cleanString, validatePayload } from '../lib/lead-logic.ts';
import {
    associateDealToContact,
    buildContactProperties,
    createDeal,
    createFallbackNote,
    getContactIdByEmail,
    hubspotRequest,
    updateContactProperties,
    type HubSpotObjectResponse
} from '../services/hubspot.ts';
import { sendGoogleConversion } from '../lib/conversions/google.ts';
import { sendMetaConversion } from '../lib/conversions/meta.ts';

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

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

/**
 * Main handler for the submit-lead Edge Function.
 */
export default async function handler(request: Request): Promise<Response> {
    const corsHeaders = buildCorsHeaders();

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    const clientIP = getClientIP(request);
    const rateLimit = await checkRateLimitInternal(clientIP, {
        limit: RATE_LIMIT_MAX_REQUESTS,
        windowMs: RATE_LIMIT_WINDOW_MS,
        prefix: 'ratelimit:submit-lead',
    });

    if (!rateLimit.allowed) {
        return buildErrorResponse(
            { ok: false, code: 'RATE_LIMIT_EXCEEDED', error: 'Muitas tentativas. Tente novamente em breve.' },
            429,
            { ...corsHeaders, 'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)) },
        );
    }

    if (request.method !== 'POST') {
        return buildErrorResponse(
            { ok: false, code: 'METHOD_NOT_ALLOWED', error: 'Method not allowed' },
            405,
            corsHeaders,
        );
    }

    // Load and validate environment variables
    const hubspotToken = process.env.HUBSPOT_TOKEN;
    const dealPipelineId = cleanString(process.env.HUBSPOT_DEAL_PIPELINE_ID);
    const dealStageId = cleanString(process.env.HUBSPOT_DEAL_STAGE_ID);
    const dealBantProperty = cleanString(process.env.HUBSPOT_DEAL_BANT_PROPERTY) || 'bant_summary';

    if (!hubspotToken || !dealPipelineId || !dealStageId) {
        console.error('SERVER_CONFIG_ERROR: Missing required HubSpot environment variables.');
        return buildErrorResponse(
            { ok: false, code: 'SERVER_CONFIG_ERROR', error: 'Erro de configuração do servidor' },
            500,
            corsHeaders,
        );
    }

    try {
        // Parse request body
        let rawBody: unknown;
        try {
            rawBody = await request.json();
        } catch {
            return buildErrorResponse(
                { ok: false, code: 'VALIDATION_ERROR', error: 'JSON inválido no corpo da requisição.' },
                400,
                corsHeaders,
            );
        }

        // Validate payload
        const validation = validatePayload(rawBody);
        if (validation.valid === false) {
            return buildErrorResponse(
                { ok: false, code: 'VALIDATION_ERROR', error: validation.error },
                400,
                corsHeaders,
            );
        }

        const payload = validation.data;
        const contactProperties = buildContactProperties(payload);

        // --- HubSpot Contact Management ---
        let contactId = '';
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
            // Contact already exists, recover and update
            try {
                const existingContactId = await getContactIdByEmail(hubspotToken, payload.email);
                if (!existingContactId) {
                    throw new Error('Contact ID not found for existing email');
                }

                contactId = existingContactId;
                await updateContactProperties(hubspotToken, contactId, contactProperties);
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : 'Unknown recovery error';
                console.error('HUBSPOT: Duplicate contact recovery failed', message);

                if (message.includes('UNAUTHORIZED')) {
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
        } else if (!createContactResponse.ok) {
            console.error('HUBSPOT: Error creating contact', createContactResponse.status);

            return buildErrorResponse(
                { ok: false, code: 'HUBSPOT_API_ERROR', error: 'Erro de integração com o CRM' },
                502,
                corsHeaders,
            );
        } else {
            const hubspotData = (await createContactResponse.json().catch(() => ({}))) as HubSpotObjectResponse;
            contactId = cleanString(hubspotData.id);
            if (!contactId) {
                return buildErrorResponse(
                    { ok: false, code: 'HUBSPOT_API_ERROR', error: 'Erro de integração com o CRM' },
                    502,
                    corsHeaders,
                );
            }
        }

        // --- HubSpot Deal Management ---
        const rawDealName = `Lead chatbot - ${payload.firstName} ${payload.lastName} - ${payload.destination}`;
        const dealProperties: Record<string, string> = {
            dealname: rawDealName.length > 255 ? rawDealName.substring(0, 252) + '...' : rawDealName,
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
            console.error('HUBSPOT: Deal creation/association failed', message);

            if (message.includes('UNAUTHORIZED')) {
                return buildErrorResponse(
                    { ok: false, code: 'HUBSPOT_UNAUTHORIZED', error: 'Erro de integração com o CRM' },
                    401,
                    corsHeaders,
                );
            }

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
                console.error('HUBSPOT: Note fallback failed', noteError);
            }
        }

        // --- Conversion Tracking (server-side, non-blocking) ---
        const [googleResult, metaResult] = await Promise.allSettled([
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

        if (googleResult.status === 'fulfilled' && !googleResult.value.success) {
            console.warn('GOOGLE_ADS: Lead conversion failed', googleResult.value.error);
        } else if (googleResult.status === 'rejected') {
            console.error('GOOGLE_ADS: Conversion promise rejected', googleResult.reason);
        }

        if (metaResult.status === 'fulfilled' && !metaResult.value.success) {
            console.warn('META: Lead conversion failed', metaResult.value.error);
        } else if (metaResult.status === 'rejected') {
            console.error('META: Conversion promise rejected', metaResult.reason);
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
            { ok: false, code: 'HUBSPOT_API_ERROR', error: 'Erro interno ao processar envio do lead.' },
            500,
            corsHeaders,
        );
    }
}
