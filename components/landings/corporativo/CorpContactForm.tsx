import React from 'react';
import { m } from 'framer-motion';
import { AirplaneTilt, PaperPlaneTilt, SpinnerGap } from '@phosphor-icons/react';
import { useLeadCapture, createLeadEventId } from '@/hooks/useLeadCapture';
import { useCorpFormReducer, validateCorpForm } from './useCorpFormReducer';
import { CorpFormFields } from './CorpFormFields';
import { CorpLgpdConsent } from './CorpLgpdConsent';
import { CorpSuccessState } from './CorpSuccessState';
import { fadeUp } from './constants';

interface CorpContactFormProps {
    whatsappUrl: string;
}

export function CorpContactForm({ whatsappUrl }: CorpContactFormProps) {
    const { submitLead, isSubmitting } = useLeadCapture();
    const { state, dispatch, isSubmittingRef, handleField, toggleLgpd } = useCorpFormReducer();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (isSubmittingRef.current) return;

        const validation = validateCorpForm(state.form, state.acceptedLGPD);
        if (!validation.ok) {
            dispatch({ type: 'submit-error', message: validation.message, field: validation.field });
            return;
        }

        isSubmittingRef.current = true;
        dispatch({ type: 'submit-start' });

        try {
            const eventId = createLeadEventId();
            const empresa = state.form.empresa.trim() || 'Não informado';
            const cargo = state.form.cargo.trim() || 'Não informado';

            const result = await submitLead(
                {
                    firstName: state.form.firstName,
                    lastName: state.form.lastName,
                    email: state.form.email,
                    whatsapp: state.form.whatsapp,
                    destination: 'Corporativo',
                    bantSummary: `Lead corporativo captado via landing /corporativo. Empresa: ${empresa}. Cargo: ${cargo}.`,
                },
                {
                    eventId,
                    pushDataLayerEvent: true,
                    formType: 'corporate_lead',
                },
            );

            if (result.ok) {
                dispatch({ type: 'submit-success' });
            } else {
                dispatch({
                    type: 'submit-error',
                    message: result.error || 'Ocorreu um erro ao enviar. Tente novamente.',
                });
                isSubmittingRef.current = false;
            }
        } catch {
            dispatch({ type: 'submit-error', message: 'Ocorreu um erro inesperado. Tente novamente.' });
            isSubmittingRef.current = false;
        }
    }

    const showError = state.phase === 'error' && state.message;
    const lgpdError = state.phase === 'error' && !state.acceptedLGPD;
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
                <form onSubmit={handleSubmit} noValidate>
                    <div className="flex justify-between items-center px-6 sm:px-8 py-5 border-b-2 border-dashed border-zinc-100 gap-4">
                        <span className="text-brand-cyan font-black tracking-widest text-xs sm:text-sm uppercase flex items-center gap-2 min-w-0">
                            <AirplaneTilt className="size-4 shrink-0" weight="fill" /> Contato
                        </span>
                        <span className="text-zinc-400 font-bold text-xs uppercase shrink-0">Corporativo</span>
                    </div>

                    <div className="p-6 sm:p-8 space-y-5">
                        <CorpFormFields form={state.form} onField={handleField} />

                        <CorpLgpdConsent
                            checked={state.acceptedLGPD}
                            onChange={toggleLgpd}
                            error={lgpdError}
                        />

                        {showError && (
                            <p className="text-red-500 text-xs font-medium" role="alert">
                                {state.message}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={busy}
                            className="w-full flex items-center justify-center gap-3 bg-brand-dark text-white py-4 rounded-xl font-bold text-base shadow-hard-yellow hover:shadow-[2px_2px_0px_theme(colors.brand.yellow)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition disabled:opacity-60 disabled:pointer-events-none focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action"
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
