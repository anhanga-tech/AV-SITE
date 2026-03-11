import React, { memo, useState } from 'react';
import { CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export interface LeadFinalizePayload {
  firstName: string;
  lastName: string;
  email: string;
  bantSummary: string;
  destination: string;
}

export interface LeadFinalizeResult {
  notice?: string;
}

interface ChatLeadFormProps {
  destination?: string;
  defaultBantSummary?: string;
  getWhatsAppUrl: (payload: LeadFinalizePayload) => string;
  isSubmittingLead: boolean;
  onFinalizeLead: (payload: LeadFinalizePayload) => Promise<LeadFinalizeResult>;
}

const ChatLeadFormBase: React.FC<ChatLeadFormProps> = ({
  destination,
  defaultBantSummary,
  getWhatsAppUrl,
  isSubmittingLead,
  onFinalizeLead,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [acceptedLGPD, setAcceptedLGPD] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    lgpd?: string;
  }>({});

  const [localError, setLocalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLocalError(null);
    setNotice(null);
    setFieldErrors({});

    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedDestination = destination?.trim() || '';

    const errors: typeof fieldErrors = {};
    if (!normalizedFirstName) errors.firstName = 'Campo obrigatório';
    if (!normalizedLastName) errors.lastName = 'Campo obrigatório';
    if (!normalizedEmail) {
      errors.email = 'Campo obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      errors.email = 'E-mail inválido';
    }

    if (!acceptedLGPD) {
      errors.lgpd = 'Você deve aceitar os termos';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLocalError('Por favor, corrija os erros no formulário.');
      return;
    }

    if (!normalizedDestination) {
      setLocalError('Não conseguimos identificar o destino da sua viagem. Gere o link novamente pelo chat.');
      return;
    }

    const payload: LeadFinalizePayload = {
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
      email: normalizedEmail,
      bantSummary: defaultBantSummary || 'Não informado',
      destination: normalizedDestination,
    };

    void triggerHaptic('medium');

    const whatsappUrl = getWhatsAppUrl(payload);
    const popup = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    const finalizePromise = onFinalizeLead(payload);

    if (!popup) {
      window.location.assign(whatsappUrl);
    }

    const result = await finalizePromise;
    if (result.notice) {
      setNotice(result.notice);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-brand-blue/10 shadow-[0_8px_30px_rgb(0,0,0,0.08)] w-full overflow-hidden transform transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1">
      <div className="bg-gradient-to-r from-brand-vibrant/10 to-transparent p-3 flex items-center gap-2 border-b border-gray-100">
        <CheckCircle2 className="w-5 h-5 text-green-500" />
        <span className="text-sm font-bold tracking-wide text-brand-dark uppercase">
          Link Gerado
        </span>
      </div>
      <div className="p-5 bg-gradient-to-br from-white to-slate-50/50">
        <p className="text-sm text-gray-600 mb-5 font-medium leading-relaxed">
          Sua solicitação para <strong className="font-bold text-brand-vibrant relative px-1"><span className="absolute inset-0 bg-brand-yellow/20 -skew-x-6 rounded"></span><span className="relative">{destination}</span></strong> está pronta. Finalize seus dados:
        </p>

        <div className="space-y-3 mb-5">
          <div className="space-y-1">
            <label htmlFor="lead-first-name" className="sr-only">Nome</label>
            <input
              id="lead-first-name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Nome"
              className={`w-full bg-white border ${fieldErrors.firstName ? 'border-red-500' : 'border-gray-200'} rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-vibrant/30 focus:border-brand-vibrant transition-all shadow-sm`}
            />
            {fieldErrors.firstName && <span className="text-[10px] text-red-500 font-bold ml-1 uppercase">{fieldErrors.firstName}</span>}
          </div>

          <div className="space-y-1">
            <label htmlFor="lead-last-name" className="sr-only">Sobrenome</label>
            <input
              id="lead-last-name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Sobrenome"
              className={`w-full bg-white border ${fieldErrors.lastName ? 'border-red-500' : 'border-gray-200'} rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-vibrant/30 focus:border-brand-vibrant transition-all shadow-sm`}
            />
            {fieldErrors.lastName && <span className="text-[10px] text-red-500 font-bold ml-1 uppercase">{fieldErrors.lastName}</span>}
          </div>

          <div className="space-y-1">
            <label htmlFor="lead-email" className="sr-only">E-mail</label>
            <input
              id="lead-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              className={`w-full bg-white border ${fieldErrors.email ? 'border-red-500' : 'border-gray-200'} rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-vibrant/30 focus:border-brand-vibrant transition-all shadow-sm`}
            />
            {fieldErrors.email && <span className="text-[10px] text-red-500 font-bold ml-1 uppercase">{fieldErrors.email}</span>}
          </div>

          <div className="flex flex-col gap-1 mt-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center mt-0.5">
                <input
                  type="checkbox"
                  checked={acceptedLGPD}
                  onChange={(e) => setAcceptedLGPD(e.target.checked)}
                  className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 bg-white checked:bg-brand-vibrant checked:border-brand-vibrant transition-all focus:ring-2 focus:ring-brand-vibrant/20"
                />
                <CheckCircle2 className="absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100 left-0.5 pointer-events-none transition-opacity" />
              </div>
              <span className="text-[11px] text-gray-500 leading-tight">
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
          disabled={isSubmittingLead}
          className={`group flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all ${isSubmittingLead ? 'opacity-90 cursor-wait' : ''}`}
        >
          {isSubmittingLead ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <span>Abrir WhatsApp</span>
              <ExternalLink className="w-4 h-4 group-hover:scale-110 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

ChatLeadFormBase.displayName = 'ChatLeadForm';

export const ChatLeadForm = memo(ChatLeadFormBase);
