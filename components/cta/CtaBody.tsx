import { useState } from 'react';
import { WhatsappLogo, SpinnerGap, CheckCircle } from '@phosphor-icons/react';
import { useContactForm } from '../../hooks/useContactForm';
import { pushFormAnalyticsEvent } from '../../utils/formAnalytics';

export function CtaBody() {
  const [formOpen, setFormOpen] = useState(false);
  const { fields, setField, canAttemptSubmit, isSubmitting, error, fieldErrors, submitted, lastAction, submit, honeypotProps } =
    useContactForm({ source: 'cta-homepage' });

  if (submitted && formOpen) {
    return (
      <output className="flex flex-col gap-3" aria-live="polite">
          <p className="flex items-center gap-2 text-green-600 text-sm font-bold">
            <CheckCircle className="size-5" weight="fill" />
          {lastAction === 'callback'
            ? 'Recebemos! Nossa equipe chama você em breve.'
            : 'Recebemos! Abrimos o WhatsApp para continuar por lá.'}
          </p>
      </output>
    );
  }

  if (formOpen) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit('whatsapp');
        }}
        className="flex flex-col gap-3 w-full"
        noValidate
      >
        {/* Honeypot: hidden from humans, blind form-fillers populate it. */}
        <input {...honeypotProps} />
        <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">
          Seus dados para contato
        </p>

        <div>
          <label htmlFor="cta-firstName" className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-500">
            Nome *
          </label>
          <input
            id="cta-firstName"
            type="text"
            placeholder="ex: João Silva"
            autoComplete="name"
            value={fields.firstName}
            onChange={(event) => setField('firstName', event.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-xl border-2 border-zinc-200 text-sm font-medium text-zinc-800 outline-none focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan transition-colors placeholder-zinc-400"
            aria-invalid={fieldErrors.firstName ? true : undefined}
            aria-describedby={fieldErrors.firstName ? 'cta-firstName-error' : undefined}
          />
          {fieldErrors.firstName && (
            <p id="cta-firstName-error" className="mt-1 text-xs font-semibold text-red-500" role="alert">{fieldErrors.firstName}</p>
          )}
        </div>

        <div>
          <label htmlFor="cta-whatsapp" className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-500">
            WhatsApp *
          </label>
          <input
            id="cta-whatsapp"
            type="tel"
            placeholder="(11) 99999-9999"
            value={fields.whatsapp}
            onChange={(event) => setField('whatsapp', event.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-xl border-2 border-zinc-200 text-sm font-medium text-zinc-800 outline-none focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan transition-colors placeholder-zinc-400"
            aria-invalid={fieldErrors.whatsapp ? true : undefined}
            aria-describedby={fieldErrors.whatsapp ? 'cta-whatsapp-error' : undefined}
          />
          {fieldErrors.whatsapp && (
            <p id="cta-whatsapp-error" className="mt-1 text-xs font-semibold text-red-500" role="alert">{fieldErrors.whatsapp}</p>
          )}
        </div>

        <div>
          <label htmlFor="cta-email" className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-500">
            E-mail
          </label>
          <input
            id="cta-email"
            type="email"
            placeholder="voce@email.com (opcional)"
            value={fields.email}
            onChange={(event) => setField('email', event.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border-2 border-zinc-200 text-sm font-medium text-zinc-800 outline-none focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan transition-colors placeholder-zinc-400"
            aria-invalid={fieldErrors.email ? true : undefined}
            aria-describedby={fieldErrors.email ? 'cta-email-error' : undefined}
          />
          {fieldErrors.email && (
            <p id="cta-email-error" className="mt-1 text-xs font-semibold text-red-500" role="alert">{fieldErrors.email}</p>
          )}
        </div>

        <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-50 rounded-xl border border-blue-100">
          <input
            id="cta-optIn"
            type="checkbox"
            checked={fields.emailOptIn}
            onChange={(event) => setField('emailOptIn', event.target.checked)}
            className="mt-0.5 size-4 rounded border-2 border-brand-vibrant accent-brand-vibrant cursor-pointer flex-shrink-0"
          />
          <label htmlFor="cta-optIn" className="text-xs text-blue-700 leading-relaxed cursor-pointer">
            Quero receber novidades por e-mail.
          </label>
        </div>

        <p className="text-xs text-zinc-500 leading-relaxed">
          Seus dados serão usados para retornar seu contato.{' '}
          <a href="/politica-privacidade/" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-700">
            Política de Privacidade
          </a>.
        </p>

        {error && (
          <p className="text-red-500 text-xs font-medium" role="alert">{error}</p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={!canAttemptSubmit || isSubmitting}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-[#1fba59] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <SpinnerGap className="size-4 animate-spin" weight="bold" />
            ) : (
              <WhatsappLogo className="size-4" weight="fill" />
            )}
            Chamar no WhatsApp
          </button>
          <button
            type="button"
            onClick={() => void submit('callback')}
            disabled={!canAttemptSubmit || isSubmitting}
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
        onClick={() => {
          setFormOpen(true);
          pushFormAnalyticsEvent({
            event: 'form_view',
            formType: 'contact_modal',
            formId: 'cta-homepage',
          });
        }}
        className="btn-specialist flex items-center gap-3 bg-brand-dark text-white text-lg font-bold px-8 py-4 rounded-xl shadow-hard-yellow hover:shadow-[2px_2px_0px_theme(colors.brand.yellow)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition self-start"
        data-tracking="cta-home-footer"
      >
        Solicitar meu Orçamento
      </button>
    </>
  );
}
