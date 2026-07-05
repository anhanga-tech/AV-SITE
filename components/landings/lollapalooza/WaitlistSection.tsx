import React, { useEffect, useReducer, useRef } from 'react';
import { m } from 'framer-motion';
import { useWaitlistCapture } from '../../../hooks/useWaitlistCapture';
import { WAITLIST_SECTION_ID } from './constants';
import { pushFormAnalyticsEvent } from '../../../utils/formAnalytics';
import { WaitlistCopyPanel } from './waitlist/WaitlistCopyPanel';
import { WaitlistFormFields } from './waitlist/WaitlistFormFields';
import { WaitlistFormMessages } from './waitlist/WaitlistFormMessages';
import { WaitlistSubmitButton } from './waitlist/WaitlistSubmitButton';

interface WaitlistFormState {
  name: string;
  email: string;
  acceptedLgpd: boolean;
  localError: string | null;
  successMessage: string | null;
  warningMessage: string | null;
}

type WaitlistFormAction =
  | { type: 'SET_NAME'; value: string }
  | { type: 'SET_EMAIL'; value: string }
  | { type: 'SET_LGPD'; value: boolean }
  | { type: 'SET_ERROR'; value: string }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'SUBMIT_SUCCESS'; success: string; warning: string | null }
  | { type: 'RESET_FORM' };

const WAITLIST_INITIAL_STATE: WaitlistFormState = {
  name: '',
  email: '',
  acceptedLgpd: false,
  localError: null,
  successMessage: null,
  warningMessage: null,
};

function waitlistReducer(state: WaitlistFormState, action: WaitlistFormAction): WaitlistFormState {
  switch (action.type) {
    case 'SET_NAME': return { ...state, name: action.value };
    case 'SET_EMAIL': return { ...state, email: action.value };
    case 'SET_LGPD': return { ...state, acceptedLgpd: action.value };
    case 'SET_ERROR': return { ...state, localError: action.value };
    case 'CLEAR_MESSAGES': return { ...state, localError: null, successMessage: null, warningMessage: null };
    case 'SUBMIT_SUCCESS': return { ...WAITLIST_INITIAL_STATE, successMessage: action.success, warningMessage: action.warning };
    case 'RESET_FORM': return WAITLIST_INITIAL_STATE;
  }
}

const WaitlistSection: React.FC = () => {
  const { submitWaitlist, isSubmitting, error, honeypotProps } = useWaitlistCapture();
  const [state, dispatch] = useReducer(waitlistReducer, WAITLIST_INITIAL_STATE);
  const { name, email, acceptedLgpd, localError, successMessage, warningMessage } = state;
  const startedRef = useRef(false);
  const completedFields = useRef<Set<string> | null>(null);

  useEffect(() => {
    pushFormAnalyticsEvent({
      event: 'form_view',
      formType: 'waitlist',
      formId: 'lolla-waitlist-2027',
      destination: 'Lollapalooza Brasil',
    });
  }, []);

  function trackField(fieldName: 'name' | 'email' | 'marketingOptIn', value: string | boolean) {
    if (!startedRef.current) {
      startedRef.current = true;
      pushFormAnalyticsEvent({
        event: 'form_start',
        formType: 'waitlist',
        formId: 'lolla-waitlist-2027',
        destination: 'Lollapalooza Brasil',
      });
    }

    const completed = typeof value === 'boolean' ? value : value.trim().length > 0;
    const trackedFields = completedFields.current ?? (completedFields.current = new Set());
    if (completed && !trackedFields.has(fieldName)) {
      trackedFields.add(fieldName);
      pushFormAnalyticsEvent({
        event: 'field_complete',
        formType: 'waitlist',
        formId: 'lolla-waitlist-2027',
        fieldName,
        destination: 'Lollapalooza Brasil',
      });
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch({ type: 'CLEAR_MESSAGES' });
    pushFormAnalyticsEvent({
      event: 'submit_attempt',
      formType: 'waitlist',
      formId: 'lolla-waitlist-2027',
      destination: 'Lollapalooza Brasil',
    });

    if (!name.trim() || !email.trim()) {
      dispatch({ type: 'SET_ERROR', value: 'Preencha nome completo e e-mail para entrar na lista.' });
      pushFormAnalyticsEvent({
        event: 'field_error',
        formType: 'waitlist',
        formId: 'lolla-waitlist-2027',
        errorType: 'required',
        destination: 'Lollapalooza Brasil',
      });
      return;
    }

    const result = await submitWaitlist({
      name,
      email,
      sourcePage: typeof window !== 'undefined' ? window.location.pathname : '/lollapalooza',
      // The checkbox copy ("Autorizo a Anhangá a me enviar novidades") is a
      // marketing opt-in → feeds Odoo x_lgpd_consent.
      emailOptIn: acceptedLgpd,
    });

    if (result.ok === false) {
      dispatch({ type: 'SET_ERROR', value: result.error });
      pushFormAnalyticsEvent({
        event: 'submit_failure',
        formType: 'waitlist',
        formId: 'lolla-waitlist-2027',
        errorType: result.code,
        destination: 'Lollapalooza Brasil',
      });
      return;
    }

    pushFormAnalyticsEvent({
      event: 'submit_success',
      formType: 'waitlist',
      formId: 'lolla-waitlist-2027',
      destination: 'Lollapalooza Brasil',
    });
    dispatch({ type: 'SUBMIT_SUCCESS', success: 'Você entrou na lista de espera para o Lollapalooza 2027.', warning: result.warning || null });
  };

  return (
    <section
      id={WAITLIST_SECTION_ID}
      className="relative scroll-mt-28 bg-zinc-950 py-24 sm:py-32 overflow-hidden"
      aria-labelledby="waitlist-heading"
    >
      {/* Background Graphic Elements */}
      <div className="absolute top-0 right-0 w-full h-full pointer-events-none select-none overflow-hidden" aria-hidden="true">
        <span className="absolute -top-10 -right-20 text-[20vw] font-black italic text-white/5 leading-none select-none">
          2027
        </span>
        <div className="absolute top-1/4 left-0 w-px h-64 bg-gradient-to-b from-transparent via-anhanga-yellow/20 to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid gap-12 lg:grid-cols-[1fr_minmax(400px,500px)] items-center">

          <WaitlistCopyPanel />

          {/* Form Block - The Asymmetric Tension */}
          <m.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative lg:mt-0 mt-12"
          >
            {/* Geometric Accent Decoration */}
            <div className="absolute -top-6 -left-6 size-24 border-t-2 border-l-2 border-anhanga-yellow z-0 opacity-50" />
            <div className="absolute -bottom-6 -right-6 size-24 border-b-2 border-r-2 border-anhanga-blue z-0 opacity-50" />

            <div className="relative z-10 flex flex-col bg-anhanga-darkBlue/50 backdrop-blur-xl border border-white/10 ring-1 ring-white/5 p-8 md:p-10">
              <div className="mb-10 text-center lg:text-left">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">Waiting List 2027</h3>
                <div className="h-1 w-20 bg-anhanga-yellow mt-4 mx-auto lg:mx-0" />
              </div>

              <form className="space-y-8" onSubmit={handleSubmit}>
                {/* Honeypot: hidden from humans, blind form-fillers populate it. */}
                <input {...honeypotProps} />

                <WaitlistFormFields
                  name={name}
                  email={email}
                  acceptedLgpd={acceptedLgpd}
                  onNameChange={(value) => {
                    dispatch({ type: 'SET_NAME', value });
                    trackField('name', value);
                  }}
                  onEmailChange={(value) => {
                    dispatch({ type: 'SET_EMAIL', value });
                    trackField('email', value);
                  }}
                  onLgpdChange={(value) => {
                    dispatch({ type: 'SET_LGPD', value });
                    trackField('marketingOptIn', value);
                  }}
                />

                <WaitlistFormMessages
                  localError={localError}
                  error={error}
                  successMessage={successMessage}
                  warningMessage={warningMessage}
                />

                <WaitlistSubmitButton isSubmitting={isSubmitting} />
              </form>
            </div>
          </m.div>
        </div>
      </div>
    </section>
  );
};

export default WaitlistSection;
