import React, { memo, useEffect, useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { createLeadEventId, pushGenerateLeadDataLayerEvent } from '../hooks/useLeadCapture';
import type { SubmitLeadRequest } from '../types/leadCapture';
import { normalizeWhatsappNumber } from '../lib/lead-logic';
import {
  validateLeadForm,
  type FieldErrors,
  type LeadFinalizePayload,
  type LeadFinalizeResult,
} from '../lib/chat-lead-form-logic';
import { triggerHaptic } from '../utils/haptics';
import { trackTraksWhatsAppHandoff } from '../utils/traks';
import { pushFormAnalyticsEvent } from '../utils/formAnalytics';
import { isFieldCompleteForAnalytics } from '../lib/form-v1-validation';
import { ChatLeadFormFields } from './chat-lead-form/ChatLeadFormFields';
import { ChatLeadFormFeedback } from './chat-lead-form/ChatLeadFormFeedback';
import { ChatLeadFormActions } from './chat-lead-form/ChatLeadFormActions';

export { TextField } from './chat-lead-form/TextField';

interface ChatLeadFormProps {
  destination?: string;
  defaultBantSummary?: string;
  getWhatsAppUrl: (payload: LeadFinalizePayload) => string;
  prepareLeadSubmitPayload: (payload: LeadFinalizePayload, eventId: string) => SubmitLeadRequest;
  isSubmittingLead: boolean;
  onFinalizeLead: (payload: SubmitLeadRequest) => Promise<LeadFinalizeResult>;
}

function openWhatsAppWindow(url: string): void {
  const popup = window.open(url, '_blank', 'noopener,noreferrer');
  if (!popup) {
    window.location.assign(url);
  }
}

const ChatLeadFormBase: React.FC<ChatLeadFormProps> = ({
  destination,
  defaultBantSummary,
  getWhatsAppUrl,
  prepareLeadSubmitPayload,
  isSubmittingLead,
  onFinalizeLead,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+55');
  const [whatsapp, setWhatsapp] = useState('');
  const [acceptedLGPD, setAcceptedLGPD] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [localError, setLocalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLocallySubmitting, setIsLocallySubmitting] = useState(false);
  const isProcessingRef = React.useRef(false);
  const startedRef = useRef(false);
  const completedFields = useRef<Set<string> | null>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const whatsappRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    pushFormAnalyticsEvent({
      event: 'form_view',
      formType: 'ai_chatbot_lead',
      formId: 'chat-lead-form',
      destination,
    });
  }, [destination]);

  useEffect(() => {
    const firstError = Object.keys(fieldErrors)[0] as keyof FieldErrors | undefined;
    if (!firstError) return;

    const refs: Partial<Record<keyof FieldErrors, React.RefObject<HTMLInputElement | null>>> = {
      firstName: firstNameRef,
      lastName: lastNameRef,
      email: emailRef,
      whatsapp: whatsappRef,
    };
    refs[firstError]?.current?.focus();
  }, [fieldErrors]);

  function trackField(fieldName: keyof FieldErrors, value: string | boolean) {
    if (!startedRef.current) {
      startedRef.current = true;
      pushFormAnalyticsEvent({
        event: 'form_start',
        formType: 'ai_chatbot_lead',
        formId: 'chat-lead-form',
        destination,
      });
    }

    const completed = isFieldCompleteForAnalytics(fieldName, value);
    const trackedFields = completedFields.current ?? (completedFields.current = new Set());
    if (completed && !trackedFields.has(fieldName)) {
      trackedFields.add(fieldName);
      pushFormAnalyticsEvent({
        event: 'field_complete',
        formType: 'ai_chatbot_lead',
        formId: 'chat-lead-form',
        fieldName,
        destination,
      });
    }
  }

  const buildDirectWhatsAppPayload = (): LeadFinalizePayload => ({
    firstName: firstName.trim() || 'Viajante',
    lastName: lastName.trim(),
    email: email.trim().toLowerCase(),
    whatsapp: normalizeWhatsappNumber(whatsapp, countryCode) ?? '',
    bantSummary: defaultBantSummary || 'Não informado',
    destination: destination?.trim() || 'roteiro personalizado',
  });

  const openDirectWhatsApp = () => {
    void triggerHaptic('light');
    pushFormAnalyticsEvent({
      event: 'whatsapp_opened',
      formType: 'ai_chatbot_direct_whatsapp',
      formId: 'chat-lead-direct-whatsapp',
      destination,
    });
    openWhatsAppWindow(getWhatsAppUrl(buildDirectWhatsAppPayload()));
    trackTraksWhatsAppHandoff();
  };

  const submitLeadForm = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isSubmittingLead || isLocallySubmitting || isProcessingRef.current) return;
    e.preventDefault();
    isProcessingRef.current = true;
    setIsLocallySubmitting(true);
    setLocalError(null);
    setNotice(null);
    setFieldErrors({});
    pushFormAnalyticsEvent({
      event: 'submit_attempt',
      formType: 'ai_chatbot_lead',
      formId: 'chat-lead-form',
      destination,
    });

    const validation = validateLeadForm({
      firstName,
      lastName,
      email,
      whatsapp,
      countryCode,
      acceptedLGPD,
      destination,
      defaultBantSummary,
    });

    if (validation.ok === false) {
      setFieldErrors(validation.fieldErrors || {});
      setLocalError(validation.localError);
      const firstErrorField = validation.fieldErrors
        ? (Object.keys(validation.fieldErrors)[0] as keyof FieldErrors | undefined)
        : undefined;
      pushFormAnalyticsEvent({
        event: 'field_error',
        formType: 'ai_chatbot_lead',
        formId: 'chat-lead-form',
        fieldName: firstErrorField,
        errorType: firstErrorField ?? 'validation',
        destination,
      });
      setIsLocallySubmitting(false);
      isProcessingRef.current = false;
      return;
    }
    const { payload, marketingOptIn } = validation;

    void triggerHaptic('medium');

    const eventId = createLeadEventId();
    // Forward the LGPD/marketing consent so the handler sets x_lgpd_consent on
    // the Odoo res.partner; prepareLeadSubmitPayload only maps draft + tracking.
    const submitPayload: SubmitLeadRequest = {
      ...prepareLeadSubmitPayload(payload, eventId),
      marketingOptIn,
    };
    pushGenerateLeadDataLayerEvent(submitPayload);

    // Open WhatsApp synchronously in the click handler to prevent popup blockers on mobile/Safari
    pushFormAnalyticsEvent({
      event: 'whatsapp_opened',
      formType: 'ai_chatbot_lead',
      formId: 'chat-lead-form',
      destination,
    });
    openWhatsAppWindow(getWhatsAppUrl(payload));

    // Submit lead data in the background — user is already heading to WhatsApp
    try {
      const result = await onFinalizeLead(submitPayload);
      if (!result.ok) {
        pushFormAnalyticsEvent({
          event: 'submit_failure',
          formType: 'ai_chatbot_lead',
          formId: 'chat-lead-form',
          errorType: result.error ? 'api' : 'unknown',
          destination,
        });
        console.warn('Background lead submission failed:', { error: result.error, requestId: result.requestId });
      } else {
        pushFormAnalyticsEvent({
          event: 'submit_success',
          formType: 'ai_chatbot_lead',
          formId: 'chat-lead-form',
          destination,
        });
        if (result.notice) {
          setNotice(result.notice);
        }
      }
    } finally {
      setIsLocallySubmitting(false);
      isProcessingRef.current = false;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-brand-blue/10 shadow-[0_8px_30px_rgb(0,0,0,0.08)] w-full overflow-hidden transform transition hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1">
      <div className="bg-gradient-to-r from-brand-vibrant/10 to-transparent p-3 flex items-center gap-2 border-b border-zinc-100">
        <CheckCircle2 className="size-5 text-green-500" />
        <span className="text-sm font-bold tracking-wide text-brand-dark uppercase">
          Link Gerado
        </span>
      </div>
      <div className="p-5 bg-gradient-to-br from-white to-zinc-50/50">
        <p className="text-sm text-zinc-600 mb-5 font-medium leading-relaxed">
          Sua solicitação para <strong className="font-bold text-brand-vibrant relative px-1"><span className="absolute inset-0 bg-brand-yellow/20 -skew-x-6 rounded"></span><span className="relative">{destination}</span></strong> está pronta. Finalize seus dados:
        </p>

        <ChatLeadFormFields
          firstName={firstName}
          lastName={lastName}
          email={email}
          whatsapp={whatsapp}
          countryCode={countryCode}
          acceptedLGPD={acceptedLGPD}
          fieldErrors={fieldErrors}
          onFirstNameChange={(value) => { setFirstName(value); trackField('firstName', value); }}
          onLastNameChange={(value) => { setLastName(value); trackField('lastName', value); }}
          onEmailChange={(value) => { setEmail(value); trackField('email', value); }}
          onWhatsappChange={(value) => { setWhatsapp(value); trackField('whatsapp', value); }}
          onCountryCodeChange={setCountryCode}
          onLgpdChange={(value) => { setAcceptedLGPD(value); trackField('lgpd', value); }}
          fieldRefs={{
            firstName: firstNameRef,
            lastName: lastNameRef,
            email: emailRef,
            whatsapp: whatsappRef,
          }}
        />

        <ChatLeadFormFeedback localError={localError} notice={notice} />

        <ChatLeadFormActions
          isSubmitting={isSubmittingLead || isLocallySubmitting}
          onSubmit={(e) => void submitLeadForm(e)}
          onOpenDirectWhatsApp={openDirectWhatsApp}
        />
      </div>
    </div>
  );
};

ChatLeadFormBase.displayName = 'ChatLeadForm';

export const ChatLeadForm = memo(ChatLeadFormBase);
