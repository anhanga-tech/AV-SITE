import { useEffect, useState } from 'react';
import { getTrackingDataObject } from '../utils/whatsapp';
import type { LeadTracking, LeadUtms } from '../types/leadCapture';
import type { SubmitQuizRequest, SubmitQuizResponse } from '../types/quiz';

export type SubmitQuizResult =
    | { ok: true; requestId: string; warning?: string }
    | { ok: false; requestId?: string; error: string; code: string; status?: number };

function toNullable(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
}

function captureTrackingState(): { tracking: LeadTracking; utms: LeadUtms } {
    const source = getTrackingDataObject() || {};
    const extras: Record<string, string> = {};
    const knownKeys = new Set([
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'cid', 'sid', 'gclid', 'fbclid', 'msclkid', 'ttclid', 'wbraid', 'gbraid', 'fbc', 'fbp',
    ]);

    for (const [key, value] of Object.entries(source)) {
        if (knownKeys.has(key) || typeof value !== 'string') continue;
        const normalized = value.trim();
        if (!normalized) continue;
        extras[key] = normalized;
    }

    const utms: LeadUtms = {
        utm_source: toNullable(source.utm_source),
        utm_medium: toNullable(source.utm_medium),
        utm_campaign: toNullable(source.utm_campaign),
        utm_term: toNullable(source.utm_term),
        utm_content: toNullable(source.utm_content),
    };

    return {
        utms,
        tracking: {
            ...utms,
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
        },
    };
}

function pushQuizDataLayerEvent(payload: SubmitQuizRequest): void {
    if (typeof window === 'undefined' || !window.dataLayer) return;

    window.dataLayer.push({
        event: 'quiz_lead',
        quiz_profile: payload.profileKey,
        quiz_profile_name: payload.profileName,
        utm_source: payload.utms.utm_source,
        utm_medium: payload.utms.utm_medium,
        utm_campaign: payload.utms.utm_campaign,
        ga_client_id: payload.tracking?.cid,
        ga_session_id: payload.tracking?.sid,
        page_location: window.location.href,
    });

    window.dataLayer.push({
        event: 'form_submission',
        form_type: 'quiz_lead',
        form_id: 'quiz_anhanga',
        page_location: window.location.href,
    });
}

export function useQuizCapture() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [trackingState, setTrackingState] = useState(() => captureTrackingState());

    useEffect(() => {
        setTrackingState(captureTrackingState());
    }, []);

    const submitQuiz = async (
        input: Pick<SubmitQuizRequest, 'firstName' | 'email' | 'whatsapp' | 'profileKey' | 'profileName' | 'bantSummary'>,
    ): Promise<SubmitQuizResult> => {
        setError(null);
        setIsSubmitting(true);

        const latest = captureTrackingState();
        setTrackingState(latest);

        const payload: SubmitQuizRequest = {
            ...input,
            email: input.email.trim().toLowerCase(),
            firstName: input.firstName.trim(),
            sourcePage: typeof window !== 'undefined' ? window.location.pathname : '/quiz',
            utms: latest.utms,
            tracking: latest.tracking,
        };

        try {
            const response = await fetch('/api/submit-quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json().catch(() => ({})) as Partial<SubmitQuizResponse> & Record<string, unknown>;

            if (!response.ok) {
                const errMsg = typeof data.error === 'string'
                    ? data.error
                    : `Falha ao registrar (status ${response.status}).`;
                const errCode = typeof data.code === 'string' ? data.code : 'API_ERROR';
                setError(errMsg);
                setIsSubmitting(false);
                return { ok: false, error: errMsg, code: errCode, status: response.status };
            }

            pushQuizDataLayerEvent(payload);
            setIsSubmitting(false);

            return {
                ok: true,
                requestId: String(data.requestId || response.headers.get('X-Request-Id') || 'unknown'),
                warning: typeof data.warning === 'string' ? data.warning : undefined,
            };
        } catch (requestError: unknown) {
            const message = requestError instanceof Error
                ? requestError.message
                : 'Falha de rede ao enviar resultado.';
            setError(message);
            setIsSubmitting(false);
            return { ok: false, error: message, code: 'NETWORK_ERROR' };
        }
    };

    return {
        tracking: trackingState.tracking,
        utms: trackingState.utms,
        isSubmitting,
        error,
        submitQuiz,
    };
}
