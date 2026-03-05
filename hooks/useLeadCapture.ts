import { useEffect, useState } from 'react';
import { getTrackingDataObject, getWhatsAppLink } from '../utils/whatsapp';
import type { LeadTracking, LeadUtms, SubmitLeadRequest, SubmitLeadResponse } from '../types/leadCapture';

interface LeadDraft {
    firstName: string;
    lastName: string;
    email: string;
    bantSummary: string;
    origin: string;
    destination: string;
    dates: string;
    baggagePreference: string;
}

type LeadDraftPartial = Partial<LeadDraft>;

type SubmitLeadHookResult =
    | {
        ok: true;
        whatsappUrl: string;
        contactId: string;
        dealId?: string;
        warning?: string;
    }
    | {
        ok: false;
        error: string;
        code: string;
        status?: number;
    };

const EMPTY_UTMS: LeadUtms = {
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_term: null,
    utm_content: null,
};

const EMPTY_LEAD_DRAFT: LeadDraft = {
    firstName: '',
    lastName: '',
    email: '',
    bantSummary: '',
    origin: '',
    destination: '',
    dates: '',
    baggagePreference: '',
};

function cleanValue(value: string): string {
    return value.trim();
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
        extras: Object.keys(extras).length > 0 ? extras : undefined,
    };
}

function buildWhatsAppMessage(lead: LeadDraft): string {
    const origin = cleanValue(lead.origin) || 'A definir';
    const destination = cleanValue(lead.destination) || 'A definir';
    const dates = cleanValue(lead.dates) || 'A definir';
    const baggagePreference = cleanValue(lead.baggagePreference);

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

    return lines.join('\n');
}

function resolveSubmitLeadEndpoint(): string {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        return 'http://localhost:3000/api/submit-lead';
    }

    return '/api/submit-lead';
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

    const setLeadDraft = (partial: LeadDraftPartial): void => {
        setLeadDraftState((prev) => ({
            ...prev,
            ...partial,
        }));
    };

    const resetLeadDraft = (): void => {
        setLeadDraftState(EMPTY_LEAD_DRAFT);
        setError(null);
    };

    const submitLead = async (overrides: LeadDraftPartial = {}): Promise<SubmitLeadHookResult> => {
        setError(null);
        setIsSubmitting(true);

        const latestTracking = captureInitialTracking();
        const latestUtms = extractUtms(latestTracking);
        setTracking(latestTracking);
        setUtms(latestUtms);

        const merged: LeadDraft = {
            ...leadDraft,
            ...overrides,
        };

        const payload: SubmitLeadRequest = {
            firstName: cleanValue(merged.firstName),
            lastName: cleanValue(merged.lastName),
            email: cleanValue(merged.email).toLowerCase(),
            bantSummary: cleanValue(merged.bantSummary),
            destination: cleanValue(merged.destination),
            utms: latestUtms,
            tracking: {
                ...latestTracking,
                ...latestUtms,
            },
        };

        if (!payload.firstName || !payload.lastName || !payload.email || !payload.bantSummary || !payload.destination) {
            setIsSubmitting(false);
            const validationError = 'Preencha todos os campos obrigatórios (incluindo destino) antes de enviar.';
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

            const rawData = await response.json().catch(() => ({}));

            if (!response.ok) {
                const responseData = rawData as any;
                const apiError = typeof responseData.error === 'string'
                    ? responseData.error
                    : 'Falha ao enviar lead para o HubSpot.';
                const apiCode = typeof responseData.code === 'string'
                    ? responseData.code
                    : 'HUBSPOT_API_ERROR';

                setError(apiError);
                setIsSubmitting(false);

                return {
                    ok: false,
                    error: apiError,
                    code: apiCode,
                    status: response.status,
                };
            }

            const contactId = typeof (rawData as any).contactId === 'string' ? (rawData as any).contactId : 'unknown';
            const dealId = typeof (rawData as any).dealId === 'string' ? (rawData as any).dealId : undefined;
            const warning = typeof (rawData as any).warning === 'string' ? (rawData as any).warning : undefined;
            const whatsappUrl = getWhatsAppLink(buildWhatsAppMessage(merged), { appendTrackingRef: true });

            setIsSubmitting(false);

            return {
                ok: true,
                contactId,
                dealId,
                warning,
                whatsappUrl,
            };
        } catch (requestError: unknown) {
            const message = requestError instanceof Error
                ? requestError.message
                : 'Falha de rede ao enviar lead.';

            setError(message);
            setIsSubmitting(false);

            return {
                ok: false,
                error: message,
                code: 'NETWORK_ERROR',
            };
        }
    };

    return {
        utms,
        tracking,
        leadDraft,
        isSubmitting,
        error,
        setLeadDraft,
        resetLeadDraft,
        submitLead,
    };
}

export type { LeadDraft, LeadDraftPartial, SubmitLeadHookResult };
