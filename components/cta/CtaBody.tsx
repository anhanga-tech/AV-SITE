import { useEffect, useState } from 'react';
import { WhatsappLogo, SpinnerGap, CheckCircle } from '@phosphor-icons/react';
import { useContactForm } from '../../hooks/useContactForm';

type FormState = 'closed' | 'open' | 'submitted';

export function CtaBody() {
  const [formState, setFormState] = useState<FormState>('closed');
  const { fields, setField, isValid, isSubmitting, error, submitted, submit } =
    useContactForm({ source: 'cta-homepage' });

  useEffect(() => {
    if (submitted && formState === 'open') {
      setFormState('submitted');
    }
  }, [formState, submitted]);

  if (formState === 'submitted') {
    return (
      <div className="flex flex-col gap-3" role="status" aria-live="polite">
        <p className="flex items-center gap-2 text-green-600 text-sm font-bold">
          <CheckCircle className="w-5 h-5" weight="fill" />
          Recebemos! Nossa equipe entra em contato em breve.
        </p>
      </div>
    );
  }

  if (formState === 'open') {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit('whatsapp');
        }}
        className="flex flex-col gap-3 w-full"
        noValidate
      >
        <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">
          Seus dados para contato
        </p>

        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="cta-firstName" className="sr-only">Nome</label>
            <input
              id="cta-firstName"
              type="text"
              placeholder="Nome *"
              value={fields.firstName}
              onChange={(event) => setField('firstName', event.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border-2 border-zinc-200 text-sm font-medium text-zinc-800 outline-none focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan transition-colors placeholder-zinc-400"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="cta-lastName" className="sr-only">Sobrenome</label>
            <input
              id="cta-lastName"
              type="text"
              placeholder="Sobrenome"
              value={fields.lastName}
              onChange={(event) => setField('lastName', event.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-zinc-200 text-sm font-medium text-zinc-800 outline-none focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan transition-colors placeholder-zinc-400"
            />
          </div>
        </div>

        <div>
          <label htmlFor="cta-whatsapp" className="sr-only">WhatsApp</label>
          <input
            id="cta-whatsapp"
            type="tel"
            placeholder="WhatsApp *"
            value={fields.whatsapp}
            onChange={(event) => setField('whatsapp', event.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-xl border-2 border-zinc-200 text-sm font-medium text-zinc-800 outline-none focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan transition-colors placeholder-zinc-400"
          />
        </div>

        <div>
          <label htmlFor="cta-email" className="sr-only">E-mail</label>
          <input
            id="cta-email"
            type="email"
            placeholder="E-mail (opcional)"
            value={fields.email}
            onChange={(event) => setField('email', event.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border-2 border-zinc-200 text-sm font-medium text-zinc-800 outline-none focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan transition-colors placeholder-zinc-400"
          />
        </div>

        <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-50 rounded-xl border border-blue-100">
          <input
            id="cta-optIn"
            type="checkbox"
            checked={fields.emailOptIn}
            onChange={(event) => setField('emailOptIn', event.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-2 border-brand-vibrant accent-brand-vibrant cursor-pointer flex-shrink-0"
          />
          <label htmlFor="cta-optIn" className="text-xs text-blue-700 leading-relaxed cursor-pointer">
            Quero receber novidades por e-mail.{' '}
            <a href="/politica-privacidade" target="_blank" rel="noopener noreferrer" className="underline">
              Política de Privacidade
            </a>
          </label>
        </div>

        {error && (
          <p className="text-red-500 text-xs font-medium" role="alert">{error}</p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-[#1fba59] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <SpinnerGap className="w-4 h-4 animate-spin" weight="bold" />
            ) : (
              <WhatsappLogo className="w-4 h-4" weight="fill" />
            )}
            Chamar no WhatsApp
          </button>
          <button
            type="button"
            onClick={() => void submit('callback')}
            disabled={!isValid || isSubmitting}
            className="w-full sm:flex-1 bg-brand-dark text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-brand-vibrant disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Me chamem
          </button>
        </div>
      </form>
    );
  }

  // formState === 'closed'
  return (
    <>
      <div className="mb-8">
        <h2 className="text-4xl md:text-5xl font-black text-brand-dark mb-4 leading-tight">
          Próxima parada: <br />
          <span className="text-brand-vibrant">aquele lugar que você sempre adiou.</span>
        </h2>
        <p className="text-zinc-500 font-medium text-lg max-w-md">
          Orçamento gratuito. Roteiro feito do zero, só pra você.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setFormState('open')}
        className="btn-specialist flex items-center gap-3 bg-brand-dark text-white text-lg font-bold px-8 py-4 rounded-xl shadow-[4px_4px_0px_#fbbf24] hover:shadow-[2px_2px_0px_#fbbf24] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition self-start"
        data-tracking="cta-home-footer"
      >
        Solicitar meu Orçamento
      </button>
    </>
  );
}
