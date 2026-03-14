import type { SubmitLeadRequest, SubmitLeadResponse } from '../types/leadCapture';
import { buildCorsHeaders, getClientIP } from '../lib/network.js';
import { cleanString, validatePayload } from '../lib/lead-logic.js';
import {
    associateDealToContact,
    buildAdditionalContactProperties,
    buildCoreContactProperties,
    createDeal,
    createFallbackNote,
    getContactIdByEmail,
    hubspotRequest,
    updateContactProperties,
    type HubSpotObjectResponse,
} from '../services/hubspot.js';
import { sendGoogleConversion } from '../lib/conversions/google.js';
import { sendMetaConversion } from '../lib/conversions/meta.js';

export const config = {
    runtime: 'edge',
};

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const SUBMIT_LEAD_RATE_LIMIT_MAX_ENTRIES = 1000;

interface SubmitLeadRateLimitEntry {
    count: number;
    resetTime: number;
}

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

interface ParsedHubSpotError {
    status?: number;
    detail?: string;
    isUnauthorized: boolean;
    isPropertyError: boolean;
}

interface FailedContactPropertyBatch {
    properties: Record<string, string>;
    status?: number;
    code: 'HUBSPOT_UNAUTHORIZED' | 'HUBSPOT_PROPERTY_ERROR' | 'HUBSPOT_API_ERROR';
    detail?: string;
}

type LeadLogLevel = 'info' | 'warn' | 'error';

const submitLeadRateLimitStore = new Map<string, SubmitLeadRateLimitEntry>();

function createRequestId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `lead_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function truncateDetail(detail: string): string | undefined {
    const normalized = detail.trim();
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

function buildErrorResponse(
    body: SubmitLeadResponse,
    status: number,
    corsHeaders: Record<string, string>,
): Response {
    const requestId = typeof body === 'object' && body && 'requestId' in body && typeof body.requestId === 'string'
        ? body.requestId
        : undefined;

    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...(requestId ? { 'X-Request-Id': requestId } : {}), ...corsHeaders },
    });
}

function buildSuccessResponse(
    body: SubmitLeadResponse,
    status: number,
    corsHeaders: Record<string, string>,
): Response {
    const requestId = typeof body === 'object' && body && 'requestId' in body && typeof body.requestId === 'string'
        ? body.requestId
        : undefined;

    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...(requestId ? { 'X-Request-Id': requestId } : {}), ...corsHeaders },
    });
}

function isHubSpotPropertyStatus(status: number): boolean {
    return status === 400 || status === 422;
}

function parseHubSpotErrorMessage(message: string): ParsedHubSpotError {
    if (message.includes('UNAUTHORIZED')) {
        return {
            isUnauthorized: true,
            isPropertyError: false,
        };
    }

    const match = message.match(/^[A-Z_]+:(\d+):(.*)$/s);
    if (!match) {
        return {
            detail: truncateDetail(message),
            isUnauthorized: false,
            isPropertyError: false,
        };
    }

    const status = Number(match[1]);
    const detail = truncateDetail(match[2] || '');

    return {
        status: Number.isFinite(status) ? status : undefined,
        detail,
        isUnauthorized: false,
        isPropertyError: Number.isFinite(status) ? isHubSpotPropertyStatus(status) : false,
    };
}

function appendWarning(existing: string | undefined, next: string | undefined): string | undefined {
    if (!existing) return next;
    if (!next) return existing;
    return `${existing} ${next}`;
}

function checkSubmitLeadRateLimit(clientIP: string): { allowed: boolean; resetIn: number } {
    const now = Date.now();
    const entry = submitLeadRateLimitStore.get(clientIP);

    if (submitLeadRateLimitStore.size >= SUBMIT_LEAD_RATE_LIMIT_MAX_ENTRIES && !entry) {
        for (const [key, value] of submitLeadRateLimitStore.entries()) {
            if (now > value.resetTime) {
                submitLeadRateLimitStore.delete(key);
            }

            if (submitLeadRateLimitStore.size < SUBMIT_LEAD_RATE_LIMIT_MAX_ENTRIES) {
                break;
            }
        }
    }

    if (!entry || now > entry.resetTime) {
        submitLeadRateLimitStore.set(clientIP, {
            count: 1,
            resetTime: now + RATE_LIMIT_WINDOW_MS,
        });

        return {
            allowed: true,
            resetIn: RATE_LIMIT_WINDOW_MS,
        };
    }

    entry.count += 1;
    return {
        allowed: entry.count <= RATE_LIMIT_MAX_REQUESTS,
        resetIn: entry.resetTime - now,
    };
}

function shouldAttemptFallbackNote(parsedError: ParsedHubSpotError): boolean {
    return !parsedError.isUnauthorized && parsedError.status !== 504;
}

async function getRateLimitResponse(
    request: Request,
    corsHeaders: Record<string, string>,
    requestId: string,
): Promise<Response | null> {
    const clientIP = getClientIP(request);
    const rateLimit = checkSubmitLeadRateLimit(clientIP);

    if (rateLimit.allowed) return null;

    emitLeadLog('warn', requestId, 'rate_limited', {
        clientIP,
        retryAfterSeconds: Math.ceil(rateLimit.resetIn / 1000),
    });

    return buildErrorResponse(
        {
            ok: false,
            requestId,
            code: 'RATE_LIMIT_EXCEEDED',
            error: 'Muitas tentativas. Tente novamente em breve.',
        },
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
    requestId: string,
): Promise<unknown | Response> {
    try {
        return await request.json();
    } catch {
        return buildErrorResponse(
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
        return buildErrorResponse(
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

async function recoverDuplicateContact(
    hubspotToken: string,
    email: string,
    coreContactProperties: Record<string, string>,
): Promise<string> {
    const existingContactId = await getContactIdByEmail(hubspotToken, email);
    if (!existingContactId) {
        throw new Error('CONTACT_SEARCH_FAILED:404:Contact ID not found for existing email');
    }

    await updateContactProperties(hubspotToken, existingContactId, coreContactProperties);
    return existingContactId;
}

async function createOrUpdateContact(
    hubspotToken: string,
    payload: { email: string },
    coreContactProperties: Record<string, string>,
    corsHeaders: Record<string, string>,
    requestId: string,
): Promise<string | Response> {
    emitLeadLog('info', requestId, 'contact_create_or_update', {
        email: maskEmail(payload.email),
        propertyCount: Object.keys(coreContactProperties).length,
    });

    const createContactResponse = await hubspotRequest(hubspotToken, '/crm/v3/objects/contacts', {
        method: 'POST',
        body: JSON.stringify({ properties: coreContactProperties }),
    });

    if (createContactResponse.status === 401 || createContactResponse.status === 403) {
        emitLeadLog('error', requestId, 'contact_create_or_update_failed', {
            code: 'HUBSPOT_UNAUTHORIZED',
            status: createContactResponse.status,
        });

        return buildErrorResponse(
            {
                ok: false,
                requestId,
                code: 'HUBSPOT_UNAUTHORIZED',
                error: 'Erro de integração com o CRM',
            },
            createContactResponse.status,
            corsHeaders,
        );
    }

    if (createContactResponse.status === 409) {
        emitLeadLog('warn', requestId, 'contact_duplicate_detected', {
            email: maskEmail(payload.email),
        });

        try {
            const existingContactId = await recoverDuplicateContact(hubspotToken, payload.email, coreContactProperties);

            emitLeadLog('info', requestId, 'contact_create_or_update_success', {
                mode: 'updated_existing',
                contactId: existingContactId,
            });

            return existingContactId;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown recovery error';
            const parsedError = parseHubSpotErrorMessage(message);
            const errorCode = parsedError.isUnauthorized
                ? 'HUBSPOT_UNAUTHORIZED'
                : parsedError.isPropertyError
                    ? 'HUBSPOT_PROPERTY_ERROR'
                    : 'HUBSPOT_API_ERROR';

            emitLeadLog('error', requestId, 'contact_create_or_update_failed', {
                phase: 'duplicate_recovery',
                code: errorCode,
                status: parsedError.status,
                detail: parsedError.detail,
            });

            if (parsedError.isUnauthorized) {
                return buildErrorResponse(
                    {
                        ok: false,
                        requestId,
                        code: 'HUBSPOT_UNAUTHORIZED',
                        error: 'Erro de integração com o CRM',
                    },
                    401,
                    corsHeaders,
                );
            }

            if (parsedError.isPropertyError) {
                return buildErrorResponse(
                    {
                        ok: false,
                        requestId,
                        code: 'HUBSPOT_PROPERTY_ERROR',
                        error: 'Erro de integração com o CRM: propriedades do contato inválidas ou não configuradas.',
                    },
                    502,
                    corsHeaders,
                );
            }

            return buildErrorResponse(
                {
                    ok: false,
                    requestId,
                    code: 'HUBSPOT_API_ERROR',
                    error: 'Erro ao processar contato',
                },
                502,
                corsHeaders,
            );
        }
    }

    if (!createContactResponse.ok) {
        const hubspotErrorText = await createContactResponse.text().catch(() => '');
        const errorCode = isHubSpotPropertyStatus(createContactResponse.status)
            ? 'HUBSPOT_PROPERTY_ERROR'
            : 'HUBSPOT_API_ERROR';

        emitLeadLog('error', requestId, 'contact_create_or_update_failed', {
            code: errorCode,
            status: createContactResponse.status,
            detail: truncateDetail(hubspotErrorText),
        });

        return buildErrorResponse(
            {
                ok: false,
                requestId,
                code: errorCode,
                error: errorCode === 'HUBSPOT_PROPERTY_ERROR'
                    ? 'Erro de integração com o CRM: propriedades do contato inválidas ou não configuradas.'
                    : 'Erro de integração com o CRM',
            },
            502,
            corsHeaders,
        );
    }

    const hubspotData = (await createContactResponse.json().catch(() => ({}))) as HubSpotObjectResponse;
    const contactId = cleanString(hubspotData.id);
    if (!contactId) {
        emitLeadLog('error', requestId, 'contact_create_or_update_failed', {
            code: 'HUBSPOT_API_ERROR',
            detail: 'missing_contact_id',
        });

        return buildErrorResponse(
            {
                ok: false,
                requestId,
                code: 'HUBSPOT_API_ERROR',
                error: 'Erro de integração com o CRM',
            },
            502,
            corsHeaders,
        );
    }

    emitLeadLog('info', requestId, 'contact_create_or_update_success', {
        mode: 'created',
        contactId,
    });

    return contactId;
}

async function syncAdditionalContactProperties(
    hubspotToken: string,
    contactId: string,
    additionalProperties: Record<string, string>,
    payload: {
        firstName: string;
        lastName: string;
        email: string;
        bantSummary: string;
    },
    requestId: string,
): Promise<string | undefined> {
    const propertyEntries = Object.entries(additionalProperties);
    if (propertyEntries.length === 0) {
        return undefined;
    }

    emitLeadLog('info', requestId, 'contact_enrichment_start', {
        contactId,
        propertyCount: propertyEntries.length,
    });

    try {
        await updateContactProperties(hubspotToken, contactId, additionalProperties);
        emitLeadLog('info', requestId, 'contact_enrichment_success', {
            contactId,
            propertyCount: propertyEntries.length,
        });
        return undefined;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown property sync error';
        const parsedError = parseHubSpotErrorMessage(message);
        const failedBatch: FailedContactPropertyBatch = {
            properties: additionalProperties,
            status: parsedError.status,
            code: parsedError.isUnauthorized
                ? 'HUBSPOT_UNAUTHORIZED'
                : parsedError.isPropertyError
                    ? 'HUBSPOT_PROPERTY_ERROR'
                    : 'HUBSPOT_API_ERROR',
            detail: parsedError.detail,
        };

        emitLeadLog(parsedError.isPropertyError ? 'warn' : 'error', requestId, 'contact_enrichment_failed', {
            contactId,
            propertyCount: propertyEntries.length,
            code: failedBatch.code,
            status: parsedError.status,
            detail: parsedError.detail,
        });

        const warningBase = 'Contato salvo, mas alguns dados de rastreamento/UTM não puderam ser gravados automaticamente no HubSpot.';
        const warningContext = [
            `Contato HubSpot: ${contactId}`,
            `Falha do enrichment: batch [${failedBatch.code}${failedBatch.status ? ` ${failedBatch.status}` : ''}]`,
            `Payload não persistido: ${JSON.stringify(failedBatch.properties)}`,
        ];

        if (!shouldAttemptFallbackNote(parsedError)) {
            emitLeadLog('warn', requestId, 'fallback_note_skipped', {
                contactId,
                phase: 'contact_enrichment',
                code: failedBatch.code,
                status: failedBatch.status,
            });
            return warningBase;
        }

        return await createFallbackNoteForLead(
            hubspotToken,
            contactId,
            payload,
            warningBase,
            requestId,
            warningContext,
        );
    }
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
    requestId: string,
    extraContext: string[] = [],
): Promise<string> {
    try {
        const noteBody = [
            'Fallback automático do chatbot:',
            baseWarning,
            `Lead: ${payload.firstName} ${payload.lastName} <${payload.email}>`,
            `BANT: ${payload.bantSummary}`,
            ...extraContext,
        ].join('\n');

        await createFallbackNote(hubspotToken, contactId, noteBody);
        return `${baseWarning} Uma nota foi registrada no contato para acompanhamento manual.`;
    } catch (noteError: unknown) {
        emitLeadLog('error', requestId, 'fallback_note_failed', {
            contactId,
            detail: truncateDetail(noteError instanceof Error ? noteError.message : String(noteError)),
        });

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
    requestId: string,
): Promise<DealCreationResult | Response> {
    emitLeadLog('info', requestId, 'deal_create', {
        contactId,
        destination: payload.destination,
    });

    try {
        const dealId = await createDeal(hubspotToken, buildDealProperties(payload, config));
        await associateDealToContact(hubspotToken, dealId, contactId);

        emitLeadLog('info', requestId, 'deal_associate', {
            contactId,
            dealId,
        });

        return { dealId };
    } catch (dealError: unknown) {
        const message = dealError instanceof Error ? dealError.message : 'Unknown deal error';
        const parsedError = parseHubSpotErrorMessage(message);

        emitLeadLog(parsedError.isPropertyError ? 'warn' : 'error', requestId, 'deal_create_failed', {
            contactId,
            code: parsedError.isUnauthorized
                ? 'HUBSPOT_UNAUTHORIZED'
                : parsedError.isPropertyError
                    ? 'HUBSPOT_PROPERTY_ERROR'
                    : 'HUBSPOT_API_ERROR',
            status: parsedError.status,
            detail: parsedError.detail,
        });

        if (parsedError.isUnauthorized) {
            return buildErrorResponse(
                {
                    ok: false,
                    requestId,
                    code: 'HUBSPOT_UNAUTHORIZED',
                    error: 'Erro de integração com o CRM',
                },
                401,
                corsHeaders,
            );
        }

        const warningBase = parsedError.isPropertyError
            ? 'Contato salvo, mas o deal não foi criado automaticamente por erro de propriedade no HubSpot.'
            : 'Contato salvo, mas não foi possível criar ou associar o deal automaticamente.';
        if (!shouldAttemptFallbackNote(parsedError)) {
            emitLeadLog('warn', requestId, 'fallback_note_skipped', {
                contactId,
                phase: 'deal_create',
                status: parsedError.status,
                detail: parsedError.detail,
            });
            return { warning: warningBase };
        }

        const warning = await createFallbackNoteForLead(
            hubspotToken,
            contactId,
            payload,
            warningBase,
            requestId,
        );

        return { warning };
    }
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

        const rateLimitResponse = await getRateLimitResponse(request, corsHeaders, requestId);
        if (rateLimitResponse) return rateLimitResponse;

        if (request.method !== 'POST') {
            return buildErrorResponse(
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
                hasHubSpotToken: Boolean(process.env.HUBSPOT_TOKEN),
                hasPipelineId: Boolean(cleanString(process.env.HUBSPOT_DEAL_PIPELINE_ID)),
                hasDealStageId: Boolean(cleanString(process.env.HUBSPOT_DEAL_STAGE_ID)),
            });

            return buildErrorResponse(
                {
                    ok: false,
                    requestId,
                    code: 'SERVER_CONFIG_ERROR',
                    error: 'Erro de configuração do servidor',
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

        const coreContactProperties = buildCoreContactProperties(payload);
        const contactId = await createOrUpdateContact(
            config.hubspotToken,
            payload,
            coreContactProperties,
            corsHeaders,
            requestId,
        );
        if (contactId instanceof Response) return contactId;

        const additionalContactProperties = buildAdditionalContactProperties(payload);
        const [contactWarning, dealResult] = await Promise.all([
            syncAdditionalContactProperties(
                config.hubspotToken,
                contactId,
                additionalContactProperties,
                payload,
                requestId,
            ),
            createDealForLead(
                config.hubspotToken,
                contactId,
                payload,
                config,
                corsHeaders,
                requestId,
            ),
        ]);
        if (dealResult instanceof Response) return dealResult;

        const response = buildSuccessResponse(
            {
                ok: true,
                requestId,
                contactId,
                dealId: dealResult.dealId,
                warning: appendWarning(contactWarning, dealResult.warning),
                message: dealResult.dealId
                    ? 'Contato e deal criados com sucesso no HubSpot.'
                    : 'Contato criado com sucesso no HubSpot.',
            } satisfies SubmitLeadResponse,
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
        const message = error instanceof Error ? error.message : 'Unknown error';

        emitLeadLog('error', requestId, 'unexpected', {
            code: 'HUBSPOT_API_ERROR',
            detail: truncateDetail(message),
        });

        return buildErrorResponse(
            {
                ok: false,
                requestId,
                code: 'HUBSPOT_API_ERROR',
                error: 'Erro interno ao processar envio do lead.',
            },
            500,
            corsHeaders,
        );
    }
}
