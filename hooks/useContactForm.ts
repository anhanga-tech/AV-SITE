import { useCallback, useState, useRef } from 'react';
import { useAntiBot } from './useAntiBot';
import { cleanString, splitFullName } from '../lib/lead-logic';
import { getTrackingDataObject, getWhatsAppLink } from '../utils/whatsapp';
import { createLeadEventId, extractUtms } from './useLeadCapture';
import type { ContactFormFields, SubmitContactRequest, SubmitContactResponse } from '../types/contactCapture';
import type { LeadTracking } from '../types/leadCapture';
import type { ContactModalOptions } from '../utils/contactForm';
import { pushFormAnalyticsEvent } from '../utils/formAnalytics';

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
    const { getAntiBotFields, honeypotProps } = useAntiBot();
    const [fields, setFieldsState] = useState<ContactFormFields>(EMPTY_FIELDS);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isLocallySubmitting = useRef(false);
    const hasStarted = useRef(false);
    const completedFields = useRef<Set<keyof ContactFormFields>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const isValid = Boolean(fields.firstName.trim() && fields.whatsapp.trim());
    const formId = options.source ?? 'contact-modal';

    const setField = useCallback(
        (key: keyof ContactFormFields, value: string | boolean) => {
            setFieldsState((prev) => ({ ...prev, [key]: value }));
            setError(null);

            if (!hasStarted.current) {
                hasStarted.current = true;
                pushFormAnalyticsEvent({
                    event: 'form_start',
                    formType: 'contact_modal',
                    formId,
                });
            }

            const completed = typeof value === 'boolean' ? value : value.trim().length > 0;
            if (completed && !completedFields.current.has(key)) {
                completedFields.current.add(key);
                pushFormAnalyticsEvent({
                    event: 'field_complete',
                    formType: 'contact_modal',
                    formId,
                    fieldName: key,
                });
            }
        },
        [formId],
    );

    const reset = useCallback(() => {
        setFieldsState(EMPTY_FIELDS);
        setIsSubmitting(false);
        setError(null);
        setSubmitted(false);
        hasStarted.current = false;
        completedFields.current.clear();
    }, []);

    const submit = useCallback(
        async (action: 'whatsapp' | 'callback'): Promise<void> => {
            if (!isValid || isLocallySubmitting.current) return;

            isLocallySubmitting.current = true;
            setIsSubmitting(true);
            setError(null);
            pushFormAnalyticsEvent({
                event: 'submit_attempt',
                formType: 'contact_modal',
                formId,
                destination: action,
            });

            const eventId = createLeadEventId();
            const { tracking, utms } = collectTracking();
            const whatsappMessage =
                options.message
                ?? `Olá! Meu nome é ${fields.firstName.trim()}. Gostaria de saber mais sobre viagens.`;
            const whatsappUrl = getWhatsAppLink(whatsappMessage, { appendTrackingRef: true });

            if (action === 'whatsapp') {
                pushFormAnalyticsEvent({
                    event: 'whatsapp_opened',
                    formType: 'contact_modal',
                    formId,
                    destination: action,
                });
                window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
            }

            // The UI dropped the separate sobrenome input (ContactModal/CtaBody now
            // ask for the full name in `firstName`), so split it here to keep the
            // last name flowing into the CRM instead of leaving it empty.
            const { firstName, lastName } = splitFullName(fields.firstName, fields.lastName);
            const requestBody: SubmitContactRequest = {
                firstName: cleanString(firstName),
                lastName: cleanString(lastName) || undefined,
                whatsapp: cleanString(fields.whatsapp),
                email: cleanString(fields.email) || undefined,
                emailOptIn: fields.emailOptIn,
                source: options.source,
                destination: options.destination,
                eventId,
                utms,
                tracking,
            };

            try {
                const response = await fetch('/api/submit-contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...requestBody, ...getAntiBotFields() }),
                    keepalive: true,
                });

                const data = (await response.json()) as SubmitContactResponse;

                if (!response.ok || !data.ok) {
                    const errData = data as Extract<SubmitContactResponse, { ok: false }>;
                    if (action === 'whatsapp') {
                        console.warn('[submit-contact] tracking failed:', errData.code);
                        pushFormAnalyticsEvent({
                            event: 'submit_failure',
                            formType: 'contact_modal',
                            formId,
                            errorType: errData.code,
                            destination: action,
                        });
                        setSubmitted(true);
                    } else {
                        setError(errData.error || 'Não foi possível enviar. Tente novamente.');
                        pushFormAnalyticsEvent({
                            event: 'submit_failure',
                            formType: 'contact_modal',
                            formId,
                            errorType: errData.code,
                            destination: action,
                        });
                    }
                    return;
                }

                pushContactDataLayerEvent(eventId, action, options.source);
                pushFormAnalyticsEvent({
                    event: 'submit_success',
                    formType: 'contact_modal',
                    formId,
                    destination: action,
                });
                setSubmitted(true);
            } catch {
                if (action === 'whatsapp') {
                    console.warn('[submit-contact] fetch failed after opening WhatsApp');
                    pushFormAnalyticsEvent({
                        event: 'submit_failure',
                        formType: 'contact_modal',
                        formId,
                        errorType: 'network',
                        destination: action,
                    });
                    setSubmitted(true);
                } else {
                    setError('Erro de conexão. Verifique sua internet e tente novamente.');
                    pushFormAnalyticsEvent({
                        event: 'submit_failure',
                        formType: 'contact_modal',
                        formId,
                        errorType: 'network',
                        destination: action,
                    });
                }
            } finally {
                setIsSubmitting(false);
                isLocallySubmitting.current = false;
            }
        },
        [fields, isValid, options, getAntiBotFields, formId],
    );

    return { fields, setField, isValid, isSubmitting, error, submitted, submit, reset, honeypotProps };
}
