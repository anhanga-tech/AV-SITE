import { useEffect, useState } from 'react';
import { getWhatsAppLink } from '../utils/whatsapp';
import type { LeadUtms, SubmitLeadRequest, SubmitLeadResponse } from '../types/leadCapture';

interface LeadDraft {
    firstName: string;
    lastName: string;
    email: string;
    bantSummary: string;
}

type LeadDraftPartial = Partial<LeadDraft>;

type SubmitLeadHookResult =
    | {
        ok: true;
        whatsappUrl: string;
        contactId: string;
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
};

function cleanValue(value: string): string {
    return value.trim();
}

function getQueryFromLocation(): URLSearchParams {
    if (typeof window === 'undefined') return new URLSearchParams();

    let search = window.location.search;

    if (!search && window.location.hash.includes('?')) {
        const [, hashQuery = ''] = window.location.hash.split('?');
        if (hashQuery) {
            search = `?${hashQuery}`;
        }
    }

    if (!search && window.location.href.includes('?')) {
        try {
            search = new URL(window.location.href).search;
        } catch {
            search = '';
        }
    }

    return new URLSearchParams(search);
}

function getNullableParam(params: URLSearchParams, key: keyof LeadUtms): string | null {
    const value = params.get(key);
    if (!value) return null;

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function captureInitialUtms(): LeadUtms {
    const params = getQueryFromLocation();

    return {
        utm_source: getNullableParam(params, 'utm_source'),
        utm_medium: getNullableParam(params, 'utm_medium'),
        utm_campaign: getNullableParam(params, 'utm_campaign'),
        utm_term: getNullableParam(params, 'utm_term'),
        utm_content: getNullableParam(params, 'utm_content'),
    };
}

function buildWhatsAppMessage(lead: LeadDraft): string {
    return [
        'Olá! Finalizei minha qualificação pelo chatbot da Anhangá.',
        '',
        `👤 Nome: ${lead.firstName} ${lead.lastName}`.trim(),
        `📧 E-mail: ${lead.email}`,
        `🎯 Resumo BANT: ${lead.bantSummary}`,
        '',
        'Gostaria de continuar meu atendimento com a equipe.',
    ].join('\n');
}

function resolveSubmitLeadEndpoint(): string {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        return 'http://localhost:3000/api/submit-lead';
    }

    return '/api/submit-lead';
}

export function useLeadCapture() {
    const [utms, setUtms] = useState<LeadUtms>(() => captureInitialUtms());
    const [leadDraft, setLeadDraftState] = useState<LeadDraft>(EMPTY_LEAD_DRAFT);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setUtms(captureInitialUtms());
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

        const merged: LeadDraft = {
            ...leadDraft,
            ...overrides,
        };

        const payload: SubmitLeadRequest = {
            firstName: cleanValue(merged.firstName),
            lastName: cleanValue(merged.lastName),
            email: cleanValue(merged.email).toLowerCase(),
            bantSummary: cleanValue(merged.bantSummary),
            utms: { ...utms } || EMPTY_UTMS,
        };

        if (!payload.firstName || !payload.lastName || !payload.email || !payload.bantSummary) {
            setIsSubmitting(false);
            const validationError = 'Preencha firstName, lastName, email e bantSummary antes de enviar.';
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

            const responseData = (await response.json().catch(() => ({}))) as Partial<SubmitLeadResponse>;

            if (!response.ok) {
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

            const contactId = typeof responseData.contactId === 'string' ? responseData.contactId : 'unknown';
            const whatsappUrl = getWhatsAppLink(buildWhatsAppMessage(payload));

            setIsSubmitting(false);

            return {
                ok: true,
                contactId,
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
        leadDraft,
        isSubmitting,
        error,
        setLeadDraft,
        resetLeadDraft,
        submitLead,
    };
}

export type { LeadDraft, LeadDraftPartial, SubmitLeadHookResult };
