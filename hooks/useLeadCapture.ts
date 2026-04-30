import { useEffect, useState } from 'react';
import { getTrackingDataObject, getWhatsAppLink } from '../utils/whatsapp';
import type { LeadTracking, LeadUtms, SubmitLeadRequest } from '../types/leadCapture';
import { cleanString, normalizeWhatsappNumber } from '../lib/lead-logic';

export interface LeadDraft {
    firstName: string;
    lastName: string;
    email: string;
    whatsapp: string;
    bantSummary: string;
    origin: string;
    destination: string;
    dates: string;
    baggagePreference: string;
}

export type LeadDraftPartial = Partial<LeadDraft>;

type SubmitLeadResponseData = {
    error?: string;
    code?: string;
    requestId?: string;
    warning?: string;
};

export type SubmitLeadHookResult =
    | {
        ok: true;
        requestId: string;
        warning?: string;
    }
    | {
        ok: false;
        requestId?: string;
        error: string;
        code: string;
        status?: number;
    };

type SubmitLeadSuccessResult = Extract<SubmitLeadHookResult, { ok: true }>;
type SubmitLeadFailureResult = Extract<SubmitLeadHookResult, { ok: false }>;

const EMPTY_LEAD_DRAFT: LeadDraft = {
    firstName: '',
    lastName: '',
    email: '',
    whatsapp: '',
    bantSummary: '',
    origin: '',
    destination: '',
    dates: '',
    baggagePreference: '',
};

function cleanValue(value: string): string {
    return cleanString(value);
}

function mergeLeadDraft(base: LeadDraft, overrides: LeadDraftPartial): LeadDraft {
    return {
        ...base,
        ...overrides,
    };
}

function asResponseData(value: unknown): SubmitLeadResponseData {
    if (!value || typeof value !== 'object') {
        return {};
    }

    return value as SubmitLeadResponseData;
}

function parseResponseData(value: string): SubmitLeadResponseData {
    if (!value) return {};

    try {
        return asResponseData(JSON.parse(value));
    } catch {
        return {};
    }
}

function toNullable(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
}

function extractUtms(tracking: LeadTracking): LeadUtms {
    return {
        utm_source: tracking.utm_source ?? null,
        utm_medium: tracking.utm_medium ?? null,
        utm_campaign: tracking.utm_campaign ?? null,
        utm_term: tracking.utm_term ?? null,
        utm_content: tracking.utm_content ?? null,
    };
}

function captureInitialTracking(): LeadTracking {
    const source = getTrackingDataObject() || {};

    const knownKeys = new Set([
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
        'fbp',
    ]);

    const extras: Record<string, string> = {};

    for (const [key, value] of Object.entries(source)) {
        if (knownKeys.has(key)) continue;
        if (typeof value !== 'string') continue;

        const normalized = value.trim();
        if (!normalized) continue;

        extras[key] = normalized;
    }

    return {
        utm_source: toNullable(source.utm_source),
        utm_medium: toNullable(source.utm_medium),
        utm_campaign: toNullable(source.utm_campaign),
        utm_term: toNullable(source.utm_term),
        utm_content: toNullable(source.utm_content),
        cid: toNullable(source.cid),
        sid: toNullable(source.sid),
        gclid: toNullable(source.gclid),
        fbclid: toNullable(source.fbclid),
        msclkid: toNullable(source.msclkid),
        ttclid: toNullable(source.ttclid),
        wbraid: toNullable(source.wbraid),
        gbraid: toNullable(source.gbraid),
        fbc: toNullable(source.fbc),
        fbp: toNullable(source.fbp),
        extras: Object.keys(extras).length > 0 ? extras : undefined,
    };
}

export function buildLeadWhatsAppMessage(lead: LeadDraft): string {
    const origin = cleanValue(lead.origin) || 'A definir';
    const destination = cleanValue(lead.destination) || 'A definir';
    const dates = cleanValue(lead.dates) || 'A definir';
    const baggagePreference = cleanValue(lead.baggagePreference);
    const email = cleanValue(lead.email);

    const lines = [
        'Olá! Vim pelo chatbot da Anhangá e gostaria de continuar meu atendimento.',
        '',
        `🛫 Origem: ${origin}`,
        `📍 Destino: ${destination}`,
        `📅 Datas: ${dates}`,
    ];

    if (baggagePreference) {
        lines.push(`🧳 Bagagem: ${baggagePreference}`);
    }

    if (email) {
        lines.push(`📧 E-mail: ${email}`);
    }

    return lines.join('\n');
}

export function buildLeadWhatsAppUrl(lead: LeadDraft): string {
    return getWhatsAppLink(buildLeadWhatsAppMessage(lead), { appendTrackingRef: true });
}

function resolveSubmitLeadEndpoint(): string {
    return '/api/submit-lead';
}

function isHtmlPayload(value: string): boolean {
    const normalized = value.trim().toLowerCase();
    return normalized.startsWith('<!doctype html') || normalized.startsWith('<html');
}

function truncateResponseText(value: string): string {
    const normalized = value.trim().replace(/\s+/g, ' ');
    return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized;
}

export function createLeadEventId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `lead_${crypto.randomUUID()}`;
    }

    return `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function buildSubmitLeadPayload(
    leadDraft: LeadDraft,
    overrides: LeadDraftPartial,
    latestTracking: LeadTracking,
    latestUtms: LeadUtms,
    eventId?: string,
): SubmitLeadRequest {
    const merged = mergeLeadDraft(leadDraft, overrides);

    return {
        firstName: cleanValue(merged.firstName),
        lastName: cleanValue(merged.lastName),
        email: cleanValue(merged.email).toLowerCase(),
        whatsapp: normalizeWhatsappNumber(merged.whatsapp) ?? '',
        event_id: eventId,
        bantSummary: cleanValue(merged.bantSummary),
        destination: cleanValue(merged.destination),
        utms: latestUtms,
        tracking: {
            ...latestTracking,
            ...latestUtms,
        },
    };
}

function isPreparedSubmitLeadRequest(value: LeadDraftPartial | SubmitLeadRequest): value is SubmitLeadRequest {
    const candidate = value as Partial<SubmitLeadRequest>;

    return Boolean(
        candidate
        && typeof candidate.firstName === 'string'
        && typeof candidate.lastName === 'string'
        && typeof candidate.email === 'string'
        && typeof candidate.whatsapp === 'string'
        && typeof candidate.bantSummary === 'string'
        && typeof candidate.destination === 'string'
        && candidate.utms
        && typeof candidate.utms === 'object',
    );
}

export type LeadFormType = 'ai_chatbot_lead' | 'event_lead';

export function pushGenerateLeadDataLayerEvent(
    payload: SubmitLeadRequest,
    formType: LeadFormType = 'ai_chatbot_lead',
): void {
    if (typeof window === 'undefined' || !window.dataLayer || !payload.event_id) {
        return;
    }

    // 1. Internal generation event
    window.dataLayer.push({
        event: 'generate_lead',
        event_id: payload.event_id,
        destination: payload.destination,
        utm_source: payload.utms.utm_source,
        utm_medium: payload.utms.utm_medium,
        utm_campaign: payload.utms.utm_campaign,
        ga_client_id: payload.tracking?.cid,
        ga_session_id: payload.tracking?.sid,
    });

    // 2. Unified form submission event for GA4/Ads
    window.dataLayer.push({
        event: 'form_submission',
        form_type: formType,
        form_id: payload.event_id,
        destination: 'whatsapp',
        page_location: window.location.href,
    });
}

function getSubmitLeadValidationError(payload: SubmitLeadRequest): string | null {
    if (!payload.firstName || !payload.lastName || !payload.email || !payload.whatsapp || !payload.bantSummary || !payload.destination) {
        return 'Preencha todos os campos obrigatórios (incluindo destino) antes de enviar.';
    }

    return null;
}

type ParsedSubmitLeadResponse = {
    responseRequestId?: string;
    responseText: string;
    rawData: SubmitLeadResponseData;
};

async function parseSubmitLeadResponse(response: Response): Promise<ParsedSubmitLeadResponse> {
    const responseText = await response.text();

    return {
        responseText,
        rawData: parseResponseData(responseText),
        responseRequestId: response.headers.get('x-request-id') || undefined,
    };
}

function buildSubmitLeadErrorResult(
    status: number,
    parsed: ParsedSubmitLeadResponse,
): SubmitLeadFailureResult {
    const apiError = typeof parsed.rawData.error === 'string'
        ? parsed.rawData.error
        : parsed.responseText && !isHtmlPayload(parsed.responseText)
            ? truncateResponseText(parsed.responseText)
            : `Falha ao enviar lead (status ${status}).`;
    const apiCode = typeof parsed.rawData.code === 'string'
        ? parsed.rawData.code
        : 'API_ERROR';

    return {
        ok: false,
        requestId: parsed.rawData.requestId || parsed.responseRequestId,
        error: apiError,
        code: apiCode,
        status,
    };
}

function buildSubmitLeadSuccessResult(parsed: ParsedSubmitLeadResponse): SubmitLeadSuccessResult {
    return {
        ok: true,
        requestId: typeof parsed.rawData.requestId === 'string'
            ? parsed.rawData.requestId
            : (parsed.responseRequestId || 'unknown'),
        warning: typeof parsed.rawData.warning === 'string' ? parsed.rawData.warning : undefined,
    };
}

function buildNetworkErrorResult(requestError: unknown): SubmitLeadFailureResult {
    const message = requestError instanceof Error
        ? requestError.message
        : 'Falha de rede ao enviar lead.';

    return {
        ok: false,
        error: message,
        code: 'NETWORK_ERROR',
    };
}

export function useLeadCapture() {
    const [tracking, setTracking] = useState<LeadTracking>(() => captureInitialTracking());
    const [utms, setUtms] = useState<LeadUtms>(() => extractUtms(captureInitialTracking()));
    const [leadDraft, setLeadDraftState] = useState<LeadDraft>(EMPTY_LEAD_DRAFT);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const captured = captureInitialTracking();
        setTracking(captured);
        setUtms(extractUtms(captured));
    }, []);

    const refreshTrackingState = (): { tracking: LeadTracking; utms: LeadUtms } => {
        const latestTracking = captureInitialTracking();
        const latestUtms = extractUtms(latestTracking);
        setTracking(latestTracking);
        setUtms(latestUtms);

        return { tracking: latestTracking, utms: latestUtms };
    };

    const setLeadDraft = (partial: LeadDraftPartial): void => {
        setLeadDraftState((prev) => mergeLeadDraft(prev, partial));
    };

    const resetLeadDraft = (): void => {
        setLeadDraftState(EMPTY_LEAD_DRAFT);
        setError(null);
    };

    const getLeadWhatsAppUrl = (overrides: LeadDraftPartial = {}): string => {
        refreshTrackingState();
        return buildLeadWhatsAppUrl(mergeLeadDraft(leadDraft, overrides));
    };

    const prepareLeadSubmitPayload = (
        overrides: LeadDraftPartial = {},
        eventId: string = createLeadEventId(),
    ): SubmitLeadRequest => {
        const { tracking: latestTracking, utms: latestUtms } = refreshTrackingState();
        return buildSubmitLeadPayload(leadDraft, overrides, latestTracking, latestUtms, eventId);
    };

    const submitLead = async (
        input: LeadDraftPartial | SubmitLeadRequest = {},
        options: {
            eventId?: string;
            pushDataLayerEvent?: boolean;
            formType?: LeadFormType;
        } = {},
    ): Promise<SubmitLeadHookResult> => {
        setError(null);
        setIsSubmitting(true);

        const payload = isPreparedSubmitLeadRequest(input)
            ? input
            : prepareLeadSubmitPayload(input, options.eventId ?? createLeadEventId());
        const validationError = getSubmitLeadValidationError(payload);

        if (validationError) {
            setIsSubmitting(false);
            setError(validationError);

            return {
                ok: false,
                error: validationError,
                code: 'VALIDATION_ERROR',
            };
        }

        try {
            const response = await fetch(resolveSubmitLeadEndpoint(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const parsed = await parseSubmitLeadResponse(response);

            if (!response.ok) {
                const failure = buildSubmitLeadErrorResult(response.status, parsed);
                setError(failure.error);
                setIsSubmitting(false);
                return failure;
            }

            if (options.pushDataLayerEvent !== false) {
                pushGenerateLeadDataLayerEvent(payload, options.formType);
            }
            setIsSubmitting(false);
            return buildSubmitLeadSuccessResult(parsed);
        } catch (requestError: unknown) {
            const failure = buildNetworkErrorResult(requestError);
            setError(failure.error);
            setIsSubmitting(false);
            return failure;
        }
    };

    return {
        utms,
        tracking,
        leadDraft,
        isSubmitting,
        error,
        getLeadWhatsAppUrl,
        prepareLeadSubmitPayload,
        setLeadDraft,
        resetLeadDraft,
        submitLead,
    };
}
