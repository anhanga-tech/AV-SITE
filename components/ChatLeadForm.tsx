import React, { memo, useEffect, useRef, useState } from 'react';
import { CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
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
import { pushFormAnalyticsEvent } from '../utils/formAnalytics';

interface ChatLeadFormProps {
  destination?: string;
  defaultBantSummary?: string;
  getWhatsAppUrl: (payload: LeadFinalizePayload) => string;
  prepareLeadSubmitPayload: (payload: LeadFinalizePayload, eventId: string) => SubmitLeadRequest;
  isSubmittingLead: boolean;
  onFinalizeLead: (payload: SubmitLeadRequest) => Promise<LeadFinalizeResult>;
}

type TextFieldProps = {
  id: string;
  label: string;
  type: 'text' | 'email' | 'tel';
  value: string;
  placeholder: string;
  error?: string;
  onChange: (value: string) => void;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
};

function openWhatsAppWindow(url: string): void {
  const popup = window.open(url, '_blank', 'noopener,noreferrer');
  if (!popup) {
    window.location.assign(url);
  }
}

export function TextField({
  id,
  label,
  type,
  value,
  placeholder,
  error,
  onChange,
  inputMode,
}: TextFieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="sr-only">{label}</label>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full bg-white border ${error ? 'border-red-500' : 'border-zinc-200'} rounded-xl px-4 py-3 text-sm text-zinc-700 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-vibrant/30 focus:border-brand-vibrant transition shadow-sm`}
      />
      {error && <span id={errorId} role="alert" className="text-[10px] text-red-500 font-bold ml-1 uppercase">{error}</span>}
    </div>
  );
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

  useEffect(() => {
    pushFormAnalyticsEvent({
      event: 'form_view',
      formType: 'ai_chatbot_lead',
      formId: 'chat-lead-form',
      destination,
    });
  }, [destination]);

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

    const completed = typeof value === 'boolean' ? value : value.trim().length > 0;
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

        <div className="space-y-3 mb-5">
          <TextField
            id="lead-first-name"
            label="Nome"
            type="text"
            value={firstName}
            placeholder="Nome"
            error={fieldErrors.firstName}
            onChange={(value) => {
              setFirstName(value);
              trackField('firstName', value);
            }}
          />

          <TextField
            id="lead-last-name"
            label="Sobrenome"
            type="text"
            value={lastName}
            placeholder="Sobrenome"
            error={fieldErrors.lastName}
            onChange={(value) => {
              setLastName(value);
              trackField('lastName', value);
            }}
          />

          <TextField
            id="lead-email"
            label="E-mail"
            type="email"
            value={email}
            placeholder="E-mail"
            error={fieldErrors.email}
            onChange={(value) => {
              setEmail(value);
              trackField('email', value);
            }}
          />

          <div className="space-y-1">
            <label htmlFor="lead-whatsapp" className="sr-only">WhatsApp</label>
            <div className="flex gap-2">
              <label htmlFor="lead-country-code" className="sr-only">Código do país</label>
              <select
                id="lead-country-code"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-[112px] shrink-0 bg-white border border-zinc-200 rounded-xl p-3 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand-vibrant/30 focus:border-brand-vibrant transition shadow-sm"
              >
                <option value="+55">+55 BR</option>
                <option value="+1">+1 US/CA</option>
                <option value="+351">+351 PT</option>
              </select>
              <TextField
                id="lead-whatsapp"
                label="WhatsApp"
                type="tel"
                inputMode="tel"
                value={whatsapp}
                placeholder="WhatsApp"
                error={fieldErrors.whatsapp}
                onChange={(value) => {
                  setWhatsapp(value);
                  trackField('whatsapp', value);
                }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 mt-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center mt-0.5">
                <input
                  type="checkbox"
                  checked={acceptedLGPD}
                  onChange={(e) => {
                    setAcceptedLGPD(e.target.checked);
                    trackField('lgpd', e.target.checked);
                  }}
                  aria-invalid={fieldErrors.lgpd ? true : undefined}
                  aria-describedby={fieldErrors.lgpd ? 'lead-lgpd-error' : undefined}
                  className="peer size-4 cursor-pointer appearance-none rounded border border-zinc-300 bg-white checked:bg-brand-vibrant checked:border-brand-vibrant transition focus:ring-2 focus:ring-brand-vibrant/20"
                />
                <CheckCircle2 className="absolute size-3 text-white opacity-0 peer-checked:opacity-100 left-0.5 pointer-events-none transition-opacity" />
              </div>
              <span className="text-xs text-zinc-500 leading-tight">
                Aceito receber comunicações e autorizo o tratamento dos meus dados conforme a <a href="/politica-privacidade/" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-vibrant">Política de Privacidade</a>.
              </span>
            </label>
            {fieldErrors.lgpd && <span id="lead-lgpd-error" role="alert" className="text-[10px] text-red-500 font-bold ml-7 uppercase">{fieldErrors.lgpd}</span>}
          </div>
        </div>

        {localError && (
          <div role="alert" className="bg-red-50/80 text-red-600 px-4 py-3 text-xs font-medium rounded-xl mb-4 border border-red-100 animate-in fade-in slide-in-from-top-1">
            {localError}
          </div>
        )}
        {notice && (
          <div className="bg-amber-50/80 text-amber-700 px-4 py-3 text-xs font-medium rounded-xl mb-4 border border-amber-100">
            {notice}
          </div>
        )}

        <button
          type="button"
          onClick={submitLeadForm}
          disabled={isSubmittingLead || isLocallySubmitting}
          className={`group flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition ${isSubmittingLead || isLocallySubmitting ? 'opacity-90 cursor-wait' : ''}`}
        >
          {isSubmittingLead || isLocallySubmitting ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              <span>Salvando…</span>
            </>
          ) : (
            <>
              <span>Salvar e abrir WhatsApp</span>
              <ExternalLink className="size-4 group-hover:scale-110 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
        <button
          type="button"
          onClick={openDirectWhatsApp}
          className="mt-3 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-700 transition hover:border-brand-vibrant hover:text-brand-vibrant focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vibrant/30"
        >
          Ir direto para o WhatsApp
        </button>
      </div>
    </div>
  );
};

ChatLeadFormBase.displayName = 'ChatLeadForm';

export const ChatLeadForm = memo(ChatLeadFormBase);
