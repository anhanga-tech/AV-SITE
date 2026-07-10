import { useState, useRef, useCallback } from 'react';
import { useAntiBot } from './useAntiBot';
import { cleanString } from '../lib/lead-logic';
import { getTrackingDataObject } from '../utils/whatsapp';
import { extractUtms, normalizeLeadTracking } from '../lib/tracking-normalization';
import type { LeadTracking, LeadUtms } from '../types/leadCapture';
import type { SubmitWaitlistRequest, SubmitWaitlistResponse } from '../types/waitlist';

type SubmitWaitlistResult =
    | {
        ok: true;
        requestId: string;
        warning?: string;
        message: string;
    }
    | {
        ok: false;
        requestId?: string;
        error: string;
        code: string;
        status?: number;
    };

type SubmitWaitlistFailure = Extract<SubmitWaitlistResult, { ok: false }>;

function captureTrackingState(): { tracking: LeadTracking; utms: LeadUtms } {
    const tracking = normalizeLeadTracking(getTrackingDataObject());
    return { tracking, utms: extractUtms(tracking) };
}

function buildSubmitWaitlistError(
    response: Response,
    payload: Partial<SubmitWaitlistResponse> & Record<string, unknown>,
): SubmitWaitlistFailure {
    return {
        ok: false,
        requestId: typeof payload.requestId === 'string' ? payload.requestId : response.headers.get('X-Request-Id') || undefined,
        error: typeof payload.error === 'string' ? payload.error : `Falha ao enviar cadastro (status ${response.status}).`,
        code: typeof payload.code === 'string' ? payload.code : 'API_ERROR',
        status: response.status,
    };
}

function pushWaitlistSignupDataLayerEvent(payload: SubmitWaitlistRequest): void {
    if (typeof window === 'undefined' || !window.dataLayer) {
        return;
    }

    // 1. Internal waitlist event
    window.dataLayer.push({
        event: 'waitlist_signup',
        destination: 'Lollapalooza Brasil',
        interest_year: '2027',
        source_page: payload.sourcePage,
        utm_source: payload.utms.utm_source,
        utm_medium: payload.utms.utm_medium,
        utm_campaign: payload.utms.utm_campaign,
        ga_client_id: payload.tracking?.cid,
        ga_session_id: payload.tracking?.sid,
        page_location: window.location.href,
    });

    // 2. Unified form submission event
    window.dataLayer.push({
        event: 'form_submission',
        form_type: 'waitlist',
        form_id: 'lolla_waitlist_2027',
        page_location: window.location.href,
    });
}

export function useWaitlistCapture() {
    const { getAntiBotFields, honeypotProps } = useAntiBot();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isLocallySubmitting = useRef(false);
    const [error, setError] = useState<string | null>(null);
    const [trackingState, setTrackingState] = useState(() => captureTrackingState());

    const refreshTrackingState = useCallback((): { tracking: LeadTracking; utms: LeadUtms } => {
        const latest = captureTrackingState();
        setTrackingState(latest);
        return latest;
    }, []);

    const submitWaitlist = useCallback(async (
        input: Pick<SubmitWaitlistRequest, 'name' | 'email' | 'sourcePage' | 'emailOptIn'>,
    ): Promise<SubmitWaitlistResult> => {
        if (isLocallySubmitting.current) {
            return { ok: false, error: 'Submissão em andamento', code: 'ALREADY_SUBMITTING' };
        }

        setError(null);
        setIsSubmitting(true);
        isLocallySubmitting.current = true;

        const { tracking, utms } = refreshTrackingState();
        const payload: SubmitWaitlistRequest = {
            ...input,
            email: cleanString(input.email).toLowerCase(),
            name: cleanString(input.name),
            sourcePage: cleanString(input.sourcePage),
            tracking,
            utms,
        };

        try {
            const response = await fetch('/api/submit-waitlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...payload, ...getAntiBotFields() }),
            });

            const responsePayload = await response.json().catch(() => ({})) as Partial<SubmitWaitlistResponse> & Record<string, unknown>;

            if (!response.ok) {
                const failure = buildSubmitWaitlistError(response, responsePayload);
                setError(failure.error);
                return failure;
            }

            pushWaitlistSignupDataLayerEvent(payload);

            return {
                ok: true,
                requestId: String(responsePayload.requestId || response.headers.get('X-Request-Id') || 'unknown'),
                warning: typeof responsePayload.warning === 'string' ? responsePayload.warning : undefined,
                message: typeof responsePayload.message === 'string'
                    ? responsePayload.message
                    : 'Cadastro recebido com sucesso.',
            };
        } catch (requestError: unknown) {
            const message = requestError instanceof Error ? requestError.message : 'Falha de rede ao enviar cadastro.';
            setError(message);

            return {
                ok: false,
                error: message,
                code: 'NETWORK_ERROR',
            };
        } finally {
            setIsSubmitting(false);
            isLocallySubmitting.current = false;
        }
    }, [refreshTrackingState, getAntiBotFields]);

    return {
        tracking: trackingState.tracking,
        utms: trackingState.utms,
        isSubmitting,
        error,
        honeypotProps,
        submitWaitlist,
    };
}
