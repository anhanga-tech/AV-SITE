import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { FieldErrors } from '../../lib/chat-lead-form-logic';
import { TextField } from './TextField';

interface ChatLeadFormFieldsProps {
  firstName: string;
  lastName: string;
  email: string;
  whatsapp: string;
  countryCode: string;
  acceptedLGPD: boolean;
  fieldErrors: FieldErrors;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onWhatsappChange: (value: string) => void;
  onCountryCodeChange: (value: string) => void;
  onLgpdChange: (value: boolean) => void;
  fieldRefs?: Partial<Record<keyof FieldErrors, React.Ref<HTMLInputElement>>>;
}

export function ChatLeadFormFields({
  firstName,
  lastName,
  email,
  whatsapp,
  countryCode,
  acceptedLGPD,
  fieldErrors,
  onFirstNameChange,
  onLastNameChange,
  onEmailChange,
  onWhatsappChange,
  onCountryCodeChange,
  onLgpdChange,
  fieldRefs,
}: ChatLeadFormFieldsProps) {
  return (
    <div className="space-y-3 mb-5">
      <TextField
        id="lead-first-name"
        label="Nome"
        type="text"
        value={firstName}
        placeholder="Nome"
        error={fieldErrors.firstName}
        onChange={onFirstNameChange}
        inputRef={fieldRefs?.firstName}
      />

      <TextField
        id="lead-last-name"
        label="Sobrenome"
        type="text"
        value={lastName}
        placeholder="Sobrenome"
        error={fieldErrors.lastName}
        onChange={onLastNameChange}
        inputRef={fieldRefs?.lastName}
      />

      <TextField
        id="lead-email"
        label="E-mail"
        type="email"
        value={email}
        placeholder="E-mail"
        error={fieldErrors.email}
        onChange={onEmailChange}
        inputRef={fieldRefs?.email}
      />

      <div className="space-y-1">
        <div className="flex gap-2">
          <label htmlFor="lead-country-code" className="sr-only">Código do país</label>
          <select
            id="lead-country-code"
            value={countryCode}
            onChange={(e) => onCountryCodeChange(e.target.value)}
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
            onChange={onWhatsappChange}
            inputRef={fieldRefs?.whatsapp}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1 mt-2">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex items-center mt-0.5">
            <input
              type="checkbox"
              checked={acceptedLGPD}
              onChange={(e) => onLgpdChange(e.target.checked)}
              aria-invalid={fieldErrors.lgpd ? true : undefined}
              aria-describedby={fieldErrors.lgpd ? 'lead-lgpd-error' : undefined}
              className="peer size-4 cursor-pointer appearance-none rounded border border-zinc-300 bg-white checked:bg-brand-vibrant checked:border-brand-vibrant transition focus:ring-2 focus:ring-brand-vibrant/20"
            />
            <CheckCircle2 className="absolute size-3 text-white opacity-0 peer-checked:opacity-100 left-0.5 pointer-events-none transition-opacity" />
          </div>
          <span className="text-xs text-zinc-500 leading-tight">
            Aceito receber comunicações e autorizo o tratamento dos meus dados conforme a <a href="/politica-privacidade/" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="underline hover:text-brand-vibrant">Política de Privacidade</a>.
          </span>
        </label>
        {fieldErrors.lgpd && <span id="lead-lgpd-error" role="alert" className="text-[10px] text-red-500 font-bold ml-7 uppercase">{fieldErrors.lgpd}</span>}
      </div>
    </div>
  );
}
