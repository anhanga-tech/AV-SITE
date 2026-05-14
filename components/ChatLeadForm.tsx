import React, { memo, useState } from 'react';
import { CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
import { createLeadEventId, pushGenerateLeadDataLayerEvent } from '../hooks/useLeadCapture';
import type { SubmitLeadRequest } from '../types/leadCapture';
import { normalizeWhatsappNumber } from '../lib/lead-logic';
import { triggerHaptic } from '../utils/haptics';

export interface LeadFinalizePayload {
  firstName: string;
  lastName: string;
  email: string;
  whatsapp: string;
  bantSummary: string;
  destination: string;
}

export interface LeadFinalizeResult {
  ok: boolean;
  notice?: string;
  error?: string;
  requestId?: string;
}

interface ChatLeadFormProps {
  destination?: string;
  defaultBantSummary?: string;
  getWhatsAppUrl: (payload: LeadFinalizePayload) => string;
  prepareLeadSubmitPayload: (payload: LeadFinalizePayload, eventId: string) => SubmitLeadRequest;
  isSubmittingLead: boolean;
  onFinalizeLead: (payload: SubmitLeadRequest) => Promise<LeadFinalizeResult>;
}

type FieldErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  whatsapp?: string;
  lgpd?: string;
};

type LeadFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  whatsapp: string;
  countryCode: string;
  acceptedLGPD: boolean;
  destination?: string;
  defaultBantSummary?: string;
};

type ValidationResult =
  | {
      ok: true;
      payload: LeadFinalizePayload;
    }
  | {
      ok: false;
      fieldErrors?: FieldErrors;
      localError: string;
    };

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

function validateLeadForm(values: LeadFormValues): ValidationResult {
  const normalizedFirstName = values.firstName.trim();
  const normalizedLastName = values.lastName.trim();
  const normalizedEmail = values.email.trim().toLowerCase();
  const normalizedWhatsapp = normalizeWhatsappNumber(values.whatsapp, values.countryCode);
  const normalizedDestination = values.destination?.trim() || '';

  const errors: FieldErrors = {};
  if (!normalizedFirstName) errors.firstName = 'Campo obrigatório';
  if (!normalizedLastName) errors.lastName = 'Campo obrigatório';
  if (!normalizedEmail) {
    errors.email = 'Campo obrigatório';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    errors.email = 'E-mail inválido';
  }

  if (!values.whatsapp.trim()) {
    errors.whatsapp = 'Campo obrigatório';
  } else if (!normalizedWhatsapp) {
    errors.whatsapp = 'WhatsApp inválido';
  }

  if (!values.acceptedLGPD) {
    errors.lgpd = 'Você deve aceitar os termos';
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      fieldErrors: errors,
      localError: 'Por favor, corrija os erros no formulário.',
    };
  }

  if (!normalizedDestination) {
    return {
      ok: false,
      localError: 'Não conseguimos identificar o destino da sua viagem. Gere o link novamente pelo chat.',
    };
  }

  return {
    ok: true,
    payload: {
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
      email: normalizedEmail,
      whatsapp: normalizedWhatsapp!,
      bantSummary: values.defaultBantSummary || 'Não informado',
      destination: normalizedDestination,
    },
  };
}

function openWhatsAppWindow(url: string): void {
  const popup = window.open(url, '_blank', 'noopener,noreferrer');
  if (!popup) {
    window.location.assign(url);
  }
}

function TextField({
  id,
  label,
  type,
  value,
  placeholder,
  error,
  onChange,
  inputMode,
}: TextFieldProps) {
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
        className={`w-full bg-white border ${error ? 'border-red-500' : 'border-gray-200'} rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-vibrant/30 focus:border-brand-vibrant transition-all shadow-sm`}
      />
      {error && <span className="text-[10px] text-red-500 font-bold ml-1 uppercase">{error}</span>}
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

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isSubmittingLead || isLocallySubmitting || isProcessingRef.current) return;
    e.preventDefault();
    isProcessingRef.current = true;
    setIsLocallySubmitting(true);
    setLocalError(null);
    setNotice(null);
    setFieldErrors({});

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
      setIsLocallySubmitting(false);
      isProcessingRef.current = false;
      return;
    }
    const { payload } = validation;

    void triggerHaptic('medium');

    const eventId = createLeadEventId();
    const submitPayload = prepareLeadSubmitPayload(payload, eventId);
    pushGenerateLeadDataLayerEvent(submitPayload);

    // Open WhatsApp synchronously in the click handler to prevent popup blockers on mobile/Safari
    openWhatsAppWindow(getWhatsAppUrl(payload));

    // Submit lead data in the background — user is already heading to WhatsApp
    try {
      const result = await onFinalizeLead(submitPayload);
      if (!result.ok) {
        console.warn('Background lead submission failed:', { error: result.error, requestId: result.requestId });
      } else if (result.notice) {
        setNotice(result.notice);
      }
    } finally {
      setIsLocallySubmitting(false);
      isProcessingRef.current = false;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-brand-blue/10 shadow-[0_8px_30px_rgb(0,0,0,0.08)] w-full overflow-hidden transform transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1">
      <div className="bg-gradient-to-r from-brand-vibrant/10 to-transparent p-3 flex items-center gap-2 border-b border-gray-100">
        <CheckCircle2 className="size-5 text-green-500" />
        <span className="text-sm font-bold tracking-wide text-brand-dark uppercase">
          Link Gerado
        </span>
      </div>
      <div className="p-5 bg-gradient-to-br from-white to-slate-50/50">
        <p className="text-sm text-gray-600 mb-5 font-medium leading-relaxed">
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
            onChange={setFirstName}
          />

          <TextField
            id="lead-last-name"
            label="Sobrenome"
            type="text"
            value={lastName}
            placeholder="Sobrenome"
            error={fieldErrors.lastName}
            onChange={setLastName}
          />

          <TextField
            id="lead-email"
            label="E-mail"
            type="email"
            value={email}
            placeholder="E-mail"
            error={fieldErrors.email}
            onChange={setEmail}
          />

          <div className="space-y-1">
            <label htmlFor="lead-whatsapp" className="sr-only">WhatsApp</label>
            <div className="flex gap-2">
              <label htmlFor="lead-country-code" className="sr-only">Código do país</label>
              <select
                id="lead-country-code"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-[112px] shrink-0 bg-white border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-vibrant/30 focus:border-brand-vibrant transition-all shadow-sm"
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
                onChange={setWhatsapp}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 mt-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center mt-0.5">
                <input
                  type="checkbox"
                  checked={acceptedLGPD}
                  onChange={(e) => setAcceptedLGPD(e.target.checked)}
                  className="peer size-4 cursor-pointer appearance-none rounded border border-gray-300 bg-white checked:bg-brand-vibrant checked:border-brand-vibrant transition-all focus:ring-2 focus:ring-brand-vibrant/20"
                />
                <CheckCircle2 className="absolute size-3 text-white opacity-0 peer-checked:opacity-100 left-0.5 pointer-events-none transition-opacity" />
              </div>
              <span className="text-xs text-gray-500 leading-tight">
                Aceito receber comunicações e autorizo o tratamento dos meus dados conforme a <a href="https://www.anhanga.tur.br/politica-privacidade/" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-vibrant">Política de Privacidade</a>.
              </span>
            </label>
            {fieldErrors.lgpd && <span className="text-[10px] text-red-500 font-bold ml-7 uppercase">{fieldErrors.lgpd}</span>}
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
          onClick={handleClick}
          disabled={isSubmittingLead || isLocallySubmitting}
          className={`group flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all ${isSubmittingLead || isLocallySubmitting ? 'opacity-90 cursor-wait' : ''}`}
        >
          {isSubmittingLead || isLocallySubmitting ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <span>Salvar e abrir WhatsApp</span>
              <ExternalLink className="size-4 group-hover:scale-110 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

ChatLeadFormBase.displayName = 'ChatLeadForm';

export const ChatLeadForm = memo(ChatLeadFormBase);
