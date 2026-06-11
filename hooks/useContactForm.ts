import { useCallback, useState, useRef } from 'react';
import { cleanString } from '../lib/lead-logic';
import { getTrackingDataObject, getWhatsAppLink } from '../utils/whatsapp';
import { sendLeadToSalesforce } from '../utils/salesforce-lead';
import { createLeadEventId, extractUtms } from './useLeadCapture';
import type { ContactFormFields, SubmitContactRequest, SubmitContactResponse } from '../types/contactCapture';
import type { LeadTracking } from '../types/leadCapture';
import type { ContactModalOptions } from '../utils/contactForm';

const EMPTY_FIELDS: ContactFormFields = {
    firstName: '',
    lastName: '',
    whatsapp: '',
    email: '',
    emailOptIn: false,
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
    'fbp',
]);

function toNullable(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const normalized = cleanString(value);
    return normalized.length > 0 ? normalized : null;
}

function collectTracking(): { tracking: LeadTracking; utms: SubmitContactRequest['utms'] } {
    const raw = getTrackingDataObject() ?? {};
    const extras: Record<string, string> = {};

    for (const [key, value] of Object.entries(raw)) {
        if (KNOWN_TRACKING_KEYS.has(key)) continue;
        const normalized = toNullable(value);
        if (normalized) extras[key] = normalized;
    }

    const tracking: LeadTracking = {
        utm_source: toNullable(raw.utm_source),
        utm_medium: toNullable(raw.utm_medium),
        utm_campaign: toNullable(raw.utm_campaign),
        utm_term: toNullable(raw.utm_term),
        utm_content: toNullable(raw.utm_content),
        cid: toNullable(raw.cid),
        sid: toNullable(raw.sid),
        gclid: toNullable(raw.gclid),
        fbclid: toNullable(raw.fbclid),
        msclkid: toNullable(raw.msclkid),
        ttclid: toNullable(raw.ttclid),
        wbraid: toNullable(raw.wbraid),
        gbraid: toNullable(raw.gbraid),
        fbc: toNullable(raw.fbc),
        fbp: toNullable(raw.fbp),
        extras: Object.keys(extras).length > 0 ? extras : undefined,
    };

    return { tracking, utms: extractUtms(tracking) };
}

function pushContactDataLayerEvent(
    eventId: string,
    action: 'whatsapp' | 'callback',
    source?: string,
): void {
    if (typeof window === 'undefined' || !window.dataLayer) return;

    // 1. Internal contact event
    window.dataLayer.push({
        event: 'contact_form_submission',
        event_id: eventId,
        form_action: action,
        cta_source: source ?? null,
        page_location: window.location.href,
    });

    // 2. Unified form submission event for GA4/Ads
    window.dataLayer.push({
        event: 'form_submission',
        form_type: 'contact_modal',
        form_id: eventId,
        destination: action,
        page_location: window.location.href,
    });
}

export function useContactForm(options: ContactModalOptions = {}) {
    const [fields, setFieldsState] = useState<ContactFormFields>(EMPTY_FIELDS);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isLocallySubmitting = useRef(false);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const isValid = Boolean(fields.firstName.trim() && fields.whatsapp.trim());

    const setField = useCallback(
        (key: keyof ContactFormFields, value: string | boolean) => {
            setFieldsState((prev) => ({ ...prev, [key]: value }));
            setError(null);
        },
        [],
    );

    const reset = useCallback(() => {
        setFieldsState(EMPTY_FIELDS);
        setIsSubmitting(false);
        setError(null);
        setSubmitted(false);
    }, []);

    const submit = useCallback(
        async (action: 'whatsapp' | 'callback'): Promise<void> => {
            if (!isValid || isLocallySubmitting.current) return;

            isLocallySubmitting.current = true;
            setIsSubmitting(true);
            setError(null);

            const eventId = createLeadEventId();
            const { tracking, utms } = collectTracking();
            const whatsappMessage =
                options.message
                ?? `Olá! Meu nome é ${fields.firstName.trim()}. Gostaria de saber mais sobre viagens.`;
            const whatsappUrl = getWhatsAppLink(whatsappMessage, { appendTrackingRef: true });

            if (action === 'whatsapp') {
                window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
            }

            const requestBody: SubmitContactRequest = {
                firstName: cleanString(fields.firstName),
                lastName: cleanString(fields.lastName) || undefined,
                whatsapp: cleanString(fields.whatsapp),
                email: cleanString(fields.email) || undefined,
                emailOptIn: fields.emailOptIn,
                source: options.source,
                destination: options.destination,
                eventId,
                utms,
                tracking,
            };

            sendLeadToSalesforce({
                firstName: requestBody.firstName,
                lastName: requestBody.lastName || '-',
                email: requestBody.email,
                whatsapp: requestBody.whatsapp,
                leadSource: 'Web',
                description: [
                    `Contato rápido via site (${options.source ?? 'modal'}). Ação: ${action}.`,
                    options.destination ? `Destino de interesse: ${options.destination}.` : '',
                    `Newsletter: ${fields.emailOptIn ? 'Sim' : 'Não'}.`,
                ].filter(Boolean).join(' '),
                utms,
            });

            try {
                const response = await fetch('/api/submit-contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody),
                    keepalive: true,
                });

                const data = (await response.json()) as SubmitContactResponse;

                if (!response.ok || !data.ok) {
                    const errData = data as Extract<SubmitContactResponse, { ok: false }>;
                    if (action === 'whatsapp') {
                        console.warn('[submit-contact] tracking failed:', errData.code);
                        setSubmitted(true);
                    } else {
                        setError(errData.error || 'Não foi possível enviar. Tente novamente.');
                    }
                    return;
                }

                pushContactDataLayerEvent(eventId, action, options.source);
                setSubmitted(true);
            } catch {
                if (action === 'whatsapp') {
                    console.warn('[submit-contact] fetch failed after opening WhatsApp');
                    setSubmitted(true);
                } else {
                    setError('Erro de conexão. Verifique sua internet e tente novamente.');
                }
            } finally {
                setIsSubmitting(false);
                isLocallySubmitting.current = false;
            }
        },
        [fields, isValid, options],
    );

    return { fields, setField, isValid, isSubmitting, error, submitted, submit, reset };
}
