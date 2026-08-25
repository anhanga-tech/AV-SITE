import { useCallback, useState, useRef } from 'react';
import { useAntiBot } from './useAntiBot';
import { cleanString, splitFullName } from '../lib/lead-logic';
import {
    isFieldCompleteForAnalytics,
    validateContactFormFields,
    type ContactFormFieldErrors,
} from '../lib/form-v1-validation';
import { getTrackingDataObject, getWhatsAppLink } from '../utils/whatsapp';
import { createLeadEventId } from './useLeadCapture';
import { extractUtms, normalizeLeadTracking } from '../lib/tracking-normalization';
import type { ContactFormFields, SubmitContactRequest, SubmitContactResponse } from '../types/contactCapture';
import type { LeadTracking } from '../types/leadCapture';
import type { ContactModalOptions } from '../utils/contactForm';
import { pushFormAnalyticsEvent } from '../utils/formAnalytics';
import { pushGenerateLeadConversionEvent } from '../utils/generate-lead-analytics';
import { trackTraksWhatsAppHandoff } from '../utils/traks';
import { reserveWhatsAppWindow } from '../utils/whatsappHandoff';

const EMPTY_FIELDS: ContactFormFields = {
    firstName: '',
    lastName: '',
    whatsapp: '',
    email: '',
    emailOptIn: false,
};

function collectTracking(): { tracking: LeadTracking; utms: SubmitContactRequest['utms'] } {
    const tracking = normalizeLeadTracking(getTrackingDataObject());
    return { tracking, utms: extractUtms(tracking) };
}

function pushContactDataLayerEvent(
    eventId: string,
    action: 'whatsapp' | 'callback',
    source?: string,
    tracking?: LeadTracking,
    utms?: SubmitContactRequest['utms'],
    destination?: string,
): void {
    if (typeof window === 'undefined' || !window.dataLayer) return;

    // 1. Canonical conversion event consumed by GTM web and sGTM.
    pushGenerateLeadConversionEvent({
        eventId,
        destination: destination ?? action,
        utms,
        tracking,
    });

    // 2. Internal contact event
    window.dataLayer.push({
        event: 'contact_form_submission',
        event_id: eventId,
        form_action: action,
        cta_source: source ?? null,
        page_location: window.location.href,
    });

    // 3. Unified form submission event for GA4/Ads
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
    const submissionTokenRef = useRef(0);
    const eventIdRef = useRef<string | null>(null);
    const hasStarted = useRef(false);
    const completedFields = useRef<Set<keyof ContactFormFields> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<ContactFormFieldErrors>({});
    const [submitted, setSubmitted] = useState(false);
    const [lastAction, setLastAction] = useState<'whatsapp' | 'callback' | null>(null);
    const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

    const canAttemptSubmit = Boolean(fields.firstName.trim() && fields.whatsapp.trim());
    const formId = options.source ?? 'contact-modal';

    const setField = useCallback(
        (key: keyof ContactFormFields, value: string | boolean) => {
            setFieldsState((prev) => ({ ...prev, [key]: value }));
            setError(null);
            setFieldErrors((prev) => (key in prev ? { ...prev, [key]: undefined } : prev));
            // Any edit after a failed submit invalidates the retry key preserved
            // for that failure — otherwise a retry could resend corrected data
            // under the stale event_id, and the Odoo dedup would return the
            // already-created lead without applying the edit.
            eventIdRef.current = null;

            if (!hasStarted.current) {
                hasStarted.current = true;
                pushFormAnalyticsEvent({
                    event: 'form_start',
                    formType: 'contact_modal',
                    formId,
                });
            }

            const completed = isFieldCompleteForAnalytics(key, value);
            const trackedFields = completedFields.current ?? (completedFields.current = new Set());
            if (completed && !trackedFields.has(key)) {
                trackedFields.add(key);
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
        submissionTokenRef.current += 1;
        eventIdRef.current = null;
        isLocallySubmitting.current = false;
        setFieldsState(EMPTY_FIELDS);
        setIsSubmitting(false);
        setError(null);
        setFieldErrors({});
        setSubmitted(false);
        setLastAction(null);
        setWhatsappUrl(null);
        hasStarted.current = false;
        completedFields.current = null;
    }, []);

    const submit = useCallback(
        async (action: 'whatsapp' | 'callback'): Promise<void> => {
            if (isLocallySubmitting.current) return;

            const validation = validateContactFormFields(fields);
            if (!validation.valid) {
                setFieldErrors(validation.errors);
                const firstErrorField = Object.keys(validation.errors)[0] as keyof ContactFormFieldErrors | undefined;
                pushFormAnalyticsEvent({
                    event: 'field_error',
                    formType: 'contact_modal',
                    formId,
                    fieldName: firstErrorField,
                    errorType: firstErrorField ?? 'validation',
                    destination: action,
                });
                return;
            }

            isLocallySubmitting.current = true;
            const submissionToken = ++submissionTokenRef.current;
            setIsSubmitting(true);
            setError(null);
            setFieldErrors({});
            setWhatsappUrl(null);
            pushFormAnalyticsEvent({
                event: 'submit_attempt',
                formType: 'contact_modal',
                formId,
                destination: action,
            });

            const eventId = eventIdRef.current ?? createLeadEventId();
            eventIdRef.current = eventId;
            const { tracking, utms } = collectTracking();
            const whatsappMessage =
                options.message
                ?? `Olá! Meu nome é ${validation.normalized.firstName}. Gostaria de saber mais sobre viagens.`;
            const whatsappLink = getWhatsAppLink(whatsappMessage);
            // Reserve the tab synchronously — before the network round-trip
            // below — so Safari still treats the navigation as a direct
            // result of this click (see utils/whatsappHandoff.ts).
            const whatsappHandoff = action === 'whatsapp' ? reserveWhatsAppWindow() : null;

            // The UI dropped the separate sobrenome input (ContactModal/CtaBody now
            // ask for the full name in `firstName`), so split it here to keep the
            // last name flowing into the CRM instead of leaving it empty.
            const { firstName, lastName } = splitFullName(validation.normalized.firstName, fields.lastName);
            const requestBody: SubmitContactRequest = {
                firstName: cleanString(firstName),
                lastName: cleanString(lastName) || undefined,
                whatsapp: validation.normalized.whatsapp,
                email: validation.normalized.email,
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
                if (submissionTokenRef.current !== submissionToken) {
                    whatsappHandoff?.cancel();
                    return;
                }

                if (!response.ok || !data.ok) {
                    whatsappHandoff?.cancel();
                    const errData = data as Extract<SubmitContactResponse, { ok: false }>;
                    const retryableFailure = !response.ok && response.status >= 500;
                    if (!retryableFailure) eventIdRef.current = null;
                    if (action === 'whatsapp') {
                        console.warn('[submit-contact] tracking failed:', errData.code);
                        pushFormAnalyticsEvent({
                            event: 'submit_failure',
                            formType: 'contact_modal',
                            formId,
                            errorType: errData.code,
                            destination: action,
                        });
                        setError(errData.error || 'Não foi possível registrar seu contato. Tente novamente.');
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

                if (action === 'whatsapp') {
                    // CRM confirmation comes first. Opening WhatsApp before this
                    // request made it possible to lose the lead silently. The tab
                    // itself was already reserved synchronously above; if it never
                    // opened (blocked) or can't be navigated, keep the URL as an
                    // explicit fallback link in the success state.
                    const opened = whatsappHandoff?.open(whatsappLink) ?? false;

                    if (!opened) {
                        setWhatsappUrl(whatsappLink);
                    }

                    // The lead is confirmed at this point. Record the handoff
                    // even when the browser blocks the popup, because the
                    // success state exposes the same WhatsApp URL as a link.
                    pushFormAnalyticsEvent({
                        event: 'whatsapp_opened',
                        formType: 'contact_modal',
                        formId,
                        destination: action,
                    });
                    // Only when the tab actually navigated — when it falls back to
                    // the rendered link instead, the global `<a href="wa.me/...">`
                    // click listener (utils/traks.ts) already tracks it if/when the
                    // visitor clicks it, so tracking it here too would double-count
                    // the handoff.
                    if (opened) {
                        trackTraksWhatsAppHandoff();
                    }
                }

                pushContactDataLayerEvent(
                    eventId,
                    action,
                    options.source,
                    tracking,
                    utms,
                    options.destination,
                );
                pushFormAnalyticsEvent({
                    event: 'submit_success',
                    formType: 'contact_modal',
                    formId,
                    destination: action,
                });
                setLastAction(action);
                setSubmitted(true);
                eventIdRef.current = null;
            } catch {
                whatsappHandoff?.cancel();
                if (submissionTokenRef.current !== submissionToken) return;
                if (action === 'whatsapp') {
                    console.warn('[submit-contact] fetch failed before opening WhatsApp');
                    pushFormAnalyticsEvent({
                        event: 'submit_failure',
                        formType: 'contact_modal',
                        formId,
                        errorType: 'network',
                        destination: action,
                    });
                    setError('Não foi possível registrar seu contato. Tente novamente.');
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
                if (submissionTokenRef.current === submissionToken) {
                    setIsSubmitting(false);
                    isLocallySubmitting.current = false;
                }
            }
        },
        [fields, options.destination, options.message, options.source, getAntiBotFields, formId],
    );

    return { fields, setField, canAttemptSubmit, isSubmitting, error, fieldErrors, submitted, lastAction, whatsappUrl, submit, reset, honeypotProps };
}
