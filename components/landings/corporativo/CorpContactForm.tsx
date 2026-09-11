import React, { useEffect, useRef } from 'react';
import { m } from 'framer-motion';
import { AirplaneTilt, PaperPlaneTilt, SpinnerGap, WhatsappLogo } from '@phosphor-icons/react';
import { useLeadCapture, createLeadEventId } from '@/hooks/useLeadCapture';
import { useCorpFormReducer, validateCorpForm } from './useCorpFormReducer';
import { buildCorporateLeadDraft } from './CorpLeadDraft';
import { CorpFormFields } from './CorpFormFields';
import { CorpLgpdConsent } from './CorpLgpdConsent';
import { CorpSuccessState } from './CorpSuccessState';
import { fadeUp } from './constants';
import { pushFormAnalyticsEvent } from '@/utils/formAnalytics';
import { isFieldCompleteForAnalytics } from '@/lib/form-v1-validation';

// Falha de envio (API ou rede) é problema nosso, não do cliente: mensagem fixa
// no tom da marca + WhatsApp como saída (docs/marketing/guia-de-voz.md). O texto
// cru do upstream/rede nunca chega à tela.
const SUBMIT_FAILURE_MESSAGE = 'Tivemos um problema do nosso lado ao enviar seus dados. Tente de novo em instantes ou, se preferir, fale com a gente direto no WhatsApp.';

interface CorpContactFormProps {
    whatsappUrl: string;
}

export function CorpContactForm({ whatsappUrl }: CorpContactFormProps) {
    const { submitLead, isSubmitting, honeypotProps } = useLeadCapture();
    const { state, dispatch, isSubmittingRef, handleField, toggleLgpd } = useCorpFormReducer();
    const startedRef = useRef(false);
    const completedFields = useRef<Set<string> | null>(null);

    useEffect(() => {
        pushFormAnalyticsEvent({
            event: 'form_view',
            formType: 'corporate_lead',
            formId: 'corporativo-contact-form',
            destination: 'Corporativo',
        });
    }, []);

    function trackField(fieldName: string, value: string | boolean) {
        if (!startedRef.current) {
            startedRef.current = true;
            pushFormAnalyticsEvent({
                event: 'form_start',
                formType: 'corporate_lead',
                formId: 'corporativo-contact-form',
                destination: 'Corporativo',
            });
        }

        const completed = isFieldCompleteForAnalytics(fieldName, value);
        const trackedFields = completedFields.current ?? (completedFields.current = new Set());
        if (completed && !trackedFields.has(fieldName)) {
            trackedFields.add(fieldName);
            pushFormAnalyticsEvent({
                event: 'field_complete',
                formType: 'corporate_lead',
                formId: 'corporativo-contact-form',
                fieldName,
                destination: 'Corporativo',
            });
        }
    }

    const handleTrackedField = (field: Parameters<typeof handleField>[0]) => {
        const baseHandler = handleField(field);
        return (event: React.ChangeEvent<HTMLInputElement>) => {
            baseHandler(event);
            trackField(field, event.target.value);
        };
    };

    function handleTrackedLgpd(value: boolean) {
        toggleLgpd(value);
        trackField('lgpd', value);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (isSubmittingRef.current) return;
        pushFormAnalyticsEvent({
            event: 'submit_attempt',
            formType: 'corporate_lead',
            formId: 'corporativo-contact-form',
            destination: 'Corporativo',
        });

        const validation = validateCorpForm(state.form, state.acceptedLGPD);
        if (!validation.ok) {
            dispatch({ type: 'submit-error', message: validation.message, field: validation.field });
            pushFormAnalyticsEvent({
                event: 'field_error',
                formType: 'corporate_lead',
                formId: 'corporativo-contact-form',
                fieldName: validation.field,
                errorType: validation.field,
                destination: 'Corporativo',
            });
            return;
        }

        isSubmittingRef.current = true;
        dispatch({ type: 'submit-start' });

        try {
            const eventId = createLeadEventId();

            const result = await submitLead(
                buildCorporateLeadDraft(state.form),
                {
                    eventId,
                    pushDataLayerEvent: true,
                    formType: 'corporate_lead',
                    // Mandatory LGPD checkbox → Odoo x_lgpd_consent on the partner.
                    marketingOptIn: state.acceptedLGPD,
                },
            );

            if (result.ok) {
                pushFormAnalyticsEvent({
                    event: 'submit_success',
                    formType: 'corporate_lead',
                    formId: 'corporativo-contact-form',
                    destination: 'Corporativo',
                });
                dispatch({ type: 'submit-success' });
            } else {
                pushFormAnalyticsEvent({
                    event: 'submit_failure',
                    formType: 'corporate_lead',
                    formId: 'corporativo-contact-form',
                    errorType: result.code,
                    destination: 'Corporativo',
                });
                dispatch({ type: 'submit-error', message: SUBMIT_FAILURE_MESSAGE });
                isSubmittingRef.current = false;
            }
        } catch {
            pushFormAnalyticsEvent({
                event: 'submit_failure',
                formType: 'corporate_lead',
                formId: 'corporativo-contact-form',
                errorType: 'unexpected',
                destination: 'Corporativo',
            });
            dispatch({ type: 'submit-error', message: SUBMIT_FAILURE_MESSAGE });
            isSubmittingRef.current = false;
        }
    }

    const showError = state.phase === 'error' && state.message && (!state.field || state.field === 'lgpd');
    const lgpdError = state.phase === 'error' && state.field === 'lgpd';
    // Erros de validação sempre trazem `field`; sem ele, foi o envio que falhou.
    const submitFailed = state.phase === 'error' && !state.field;
    const busy = state.phase === 'submitting' || isSubmitting;

    return (
        <m.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            custom={1}
            className="bg-white rounded-[2rem] border-2 border-zinc-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden"
        >
            {state.phase === 'success' ? (
                <CorpSuccessState whatsappUrl={whatsappUrl} />
            ) : (
                <form onSubmit={(e) => void handleSubmit(e)} noValidate>
                    {/* Honeypot: hidden from humans, blind form-fillers populate it. */}
                    <input {...honeypotProps} />
                    <div className="flex justify-between items-center px-6 sm:px-8 py-5 border-b-2 border-dashed border-zinc-100 gap-4">
                        <span className="text-brand-cyan font-black tracking-widest text-xs sm:text-sm uppercase flex items-center gap-2 min-w-0">
                            <AirplaneTilt className="size-4 shrink-0" weight="fill" /> Contato
                        </span>
                        <span className="text-zinc-400 font-bold text-xs uppercase shrink-0">Corporativo</span>
                    </div>

                    <div className="p-6 sm:p-8 space-y-5">
                        <CorpFormFields
                            form={state.form}
                            onField={handleTrackedField}
                            errorField={state.phase === 'error' ? state.field : undefined}
                            errorMessage={state.phase === 'error' ? state.message : undefined}
                        />

                        <CorpLgpdConsent
                            checked={state.acceptedLGPD}
                            onChange={handleTrackedLgpd}
                            error={lgpdError}
                        />

                        {showError && (
                            <div className="text-red-500 text-xs font-medium" role="alert">
                                <p>{state.message}</p>
                                {submitFailed && (
                                    <a
                                        href={whatsappUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-whatsapp inline-flex items-center gap-1.5 mt-2 min-h-11 text-sm font-bold text-anhanga-dark underline underline-offset-4 hover:text-anhanga-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action"
                                        data-contact-intent
                                        data-tracking="error-corporativo"
                                    >
                                        <WhatsappLogo className="size-4" weight="fill" />
                                        Falar com a gente no WhatsApp
                                    </a>
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={busy}
                            className="w-full flex items-center justify-center gap-3 bg-brand-dark text-white py-4 rounded-xl font-bold text-base shadow-hard-yellow hover:shadow-[2px_2px_0px_theme(colors.brand.yellow)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition disabled:opacity-60 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action"
                            data-tracking="submit-form-corporativo"
                        >
                            {busy ? (
                                <>
                                    <SpinnerGap className="size-5 animate-spin" weight="bold" />
                                    Enviando…
                                </>
                            ) : (
                                <>
                                    <PaperPlaneTilt className="size-5" weight="fill" />
                                    Quero ser contatado
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </m.div>
    );
}
