import type { SubmitLeadRequest } from '../types/leadCapture';
import type { SubmitWaitlistResponse } from '../types/waitlist';
import { buildCorsHeaders, getClientIP } from '../lib/network';
import { checkRateLimit } from '../lib/rate-limit';
import { cleanString } from '../lib/lead-logic';
import { buildWaitlistNoteBody, splitWaitlistName, validateWaitlistPayload } from '../lib/waitlist-logic';
import {
    addContactToList,
    buildAdditionalContactProperties,
    buildCoreContactProperties,
    createContactNote,
    getContactIdByEmail,
    hubspotRequest,
    type HubSpotObjectResponse,
    updateContactProperties,
} from '../services/hubspot';

export const config = {
    runtime: 'edge',
};

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

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

function parseHubSpotError(error: unknown): { code: 'HUBSPOT_UNAUTHORIZED' | 'HUBSPOT_PROPERTY_ERROR' | 'HUBSPOT_API_ERROR'; status: number } {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('UNAUTHORIZED')) {
        return { code: 'HUBSPOT_UNAUTHORIZED', status: 401 };
    }

    const match = message.match(/^[A-Z_]+:(\d+):(.*)$/s);
    const status = match ? Number(match[1]) : 502;

    if (status === 400 || status === 422) {
        return { code: 'HUBSPOT_PROPERTY_ERROR', status: 502 };
    }

    return { code: 'HUBSPOT_API_ERROR', status: 502 };
}

async function createOrUpdateContact(
    token: string,
    coreProperties: Record<string, string>,
    email: string,
): Promise<string> {
    const createContactResponse = await hubspotRequest(token, '/crm/v3/objects/contacts', {
        method: 'POST',
        body: JSON.stringify({ properties: coreProperties }),
    });

    if (createContactResponse.status === 401 || createContactResponse.status === 403) {
        throw new Error('UNAUTHORIZED');
    }

    if (createContactResponse.status === 409) {
        const existingContactId = await getContactIdByEmail(token, email);
        if (!existingContactId) {
            throw new Error('CONTACT_SEARCH_FAILED:404:Contact ID not found for existing email');
        }

        await updateContactProperties(token, existingContactId, coreProperties);
        return existingContactId;
    }

    if (!createContactResponse.ok) {
        const detail = await createContactResponse.text().catch(() => '');
        throw new Error(`CONTACT_CREATE_FAILED:${createContactResponse.status}:${detail}`);
    }

    const data = (await createContactResponse.json().catch(() => ({}))) as HubSpotObjectResponse;
    if (!data.id) {
        throw new Error('CONTACT_CREATE_FAILED:502:missing_contact_id');
    }

    return data.id;
}

export default async function handler(request: Request): Promise<Response> {
    const corsHeaders = buildCorsHeaders(request.headers.get('origin') || undefined);
    const requestId = createRequestId();

    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: corsHeaders,
        });
    }

    const clientIP = getClientIP(request);
    const rateLimit = await checkRateLimit(clientIP, {
        limit: RATE_LIMIT_MAX_REQUESTS,
        windowMs: RATE_LIMIT_WINDOW_MS,
        prefix: 'ratelimit:submit-waitlist',
    });

    if (!rateLimit.allowed) {
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

    let rawPayload: unknown;

    try {
        rawPayload = await request.json();
    } catch {
        return buildJsonResponse(
            {
                ok: false,
                requestId,
                code: 'VALIDATION_ERROR',
                error: 'Payload inválido.',
            },
            400,
            corsHeaders,
        );
    }

    const validation = validateWaitlistPayload(rawPayload);
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

    if (!process.env.HUBSPOT_TOKEN) {
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

    const hubspotToken = process.env.HUBSPOT_TOKEN;
    const payload = validation.data;
    const { firstName, lastName } = splitWaitlistName(payload.name);
    const enrichmentPayload: SubmitLeadRequest = {
        firstName,
        lastName,
        email: payload.email,
        bantSummary: 'Lista de Espera Lollapalooza 2027',
        destination: 'Lollapalooza Brasil',
        utms: payload.utms,
        tracking: payload.tracking,
    };

    const coreContactProperties = buildCoreContactProperties(enrichmentPayload);
    const additionalContactProperties = buildAdditionalContactProperties(enrichmentPayload);

    try {
        const contactId = await createOrUpdateContact(hubspotToken, coreContactProperties, payload.email);
        let warning: string | undefined;
        const lollapaloozaListId = cleanString(process.env.HUBSPOT_LOLLAPALOOZA_LIST_ID);

        if (Object.keys(additionalContactProperties).length > 0) {
            try {
                await updateContactProperties(hubspotToken, contactId, additionalContactProperties);
            } catch (trackingError: unknown) {
                console.error('submit-waitlist: failed to update additional contact properties', trackingError);
                warning = 'Contato salvo, mas alguns dados de rastreamento não puderam ser gravados.';
            }
        }

        if (!lollapaloozaListId) {
            console.info('submit-waitlist: lollapalooza waitlist list id is not configured');
        } else {
            try {
                await addContactToList(hubspotToken, lollapaloozaListId, contactId);
            } catch (listError: unknown) {
                console.error('submit-waitlist: failed to add contact to lollapalooza list', listError);
            }
        }

        try {
            await createContactNote(hubspotToken, contactId, buildWaitlistNoteBody(payload));
        } catch (noteError: unknown) {
            console.error('submit-waitlist: failed to create waitlist note', noteError);
            warning = warning || 'Contato salvo, mas a anotação de waitlist não pôde ser registrada automaticamente.';
        }

        return buildJsonResponse(
            {
                ok: true,
                requestId,
                contactId,
                warning,
                message: 'Cadastro realizado com sucesso na lista de espera.',
            },
            201,
            corsHeaders,
        );
    } catch (error: unknown) {
        const parsed = parseHubSpotError(error);

        return buildJsonResponse(
            {
                ok: false,
                requestId,
                code: parsed.code,
                error: parsed.code === 'HUBSPOT_UNAUTHORIZED'
                    ? 'Erro de integração com o CRM.'
                    : 'Erro ao salvar sua inscrição na lista de espera.',
            },
            parsed.status,
            corsHeaders,
        );
    }
}
