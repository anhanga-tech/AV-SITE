import React, { useState } from 'react';
import { BellRing } from 'lucide-react';
import { useWaitlistCapture, type WaitlistAnalyticsLabels } from '../../hooks/useWaitlistCapture';
import { validateWaitlistFormFields, type WaitlistFormFieldErrors } from '../../lib/form-v1-validation';
import { useCacauWaitlistAnalytics } from './useCacauWaitlistAnalytics';

/*
  "Me avise quando abrir" do Cacau Park. Era a única seção do hub sem captura:
  quem chega pesquisando o parque saía sem deixar contato. Usa a mesma rota da
  lista do Lollapalooza (/api/submit-waitlist → Odoo res.partner, sem
  oportunidade); o `sourcePage` com âncora é o que separa as duas listas no CRM.
*/

export const CACAU_WAITLIST_SOURCE = '/parques-brasil#cacau-park';

// Constante de módulo: o hook usa os rótulos como dependência do callback.
const ANALYTICS_LABELS: WaitlistAnalyticsLabels = {
  destination: 'Cacau Park',
  interestYear: '2027',
  formId: 'cacau_park_waitlist',
};
// Em falha de rede o hook devolve a mensagem crua do navegador ("Failed to
// fetch"); só a resposta do servidor chega saneada e em português.
const NETWORK_ERROR_MESSAGE = 'Não conseguimos enviar agora. Confira sua conexão e tente de novo.';

const inputClass =
  'mt-1.5 block w-full min-h-[44px] rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-white/90 placeholder-white/40 outline-none transition-colors focus:border-anhanga-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action';

interface WaitlistInputProps {
  field: 'name' | 'email';
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

const WaitlistInput: React.FC<WaitlistInputProps> = ({ field, label, value, error, onChange }) => {
  const id = `cacau-waitlist-${field}`;
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="text-sm text-white/70">
        {label}
      </label>
      <input
        id={id}
        type={field === 'email' ? 'email' : 'text'}
        autoComplete={field}
        inputMode={field === 'email' ? 'email' : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={inputClass}
      />
    </div>
  );
};

const ErrorLine: React.FC<{ id?: string; message?: string | null }> = ({ id, message }) =>
  message ? (
    <p id={id} role="alert" className="mt-2 text-sm text-red-300">
      {message}
    </p>
  ) : null;

export const CacauWaitlist: React.FC = () => {
  const { submitWaitlist, isSubmitting, honeypotProps } = useWaitlistCapture(ANALYTICS_LABELS);
  const { track, trackField, markStarted } = useCacauWaitlistAnalytics();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [optIn, setOptIn] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<WaitlistFormFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Corrigir um campo tira o erro só dele; o outro segue apontado.
  const changeField = (field: 'name' | 'email', value: string) => {
    (field === 'name' ? setName : setEmail)(value);
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    trackField(field, value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    markStarted();
    track('submit_attempt');

    const validation = validateWaitlistFormFields({ name, email });
    setFieldErrors(validation.errors);
    if (!validation.valid) {
      // Sem este evento, a tentativa barrada na validação aparece no funil
      // como abandono.
      const firstErrorField = Object.keys(validation.errors)[0];
      track('field_error', { fieldName: firstErrorField, errorType: firstErrorField ?? 'validation' });
      return;
    }

    const result = await submitWaitlist({
      name: validation.normalized.name,
      email: validation.normalized.email,
      sourcePage: CACAU_WAITLIST_SOURCE,
      emailOptIn: optIn,
    });

    if (result.ok === false) {
      // O WhatsApp do CTA final segue como saída para quem não conseguir se cadastrar.
      setFormError(result.code === 'NETWORK_ERROR' ? NETWORK_ERROR_MESSAGE : result.error);
      track('submit_failure', { errorType: result.code });
      return;
    }

    track('submit_success');
    setDone(true);
  };

  // A região de status fica montada desde o início e só ganha texto no
  // sucesso: alguns leitores de tela não anunciam uma live region que já
  // entra no DOM com conteúdo.
  return (
    <div className="mt-8">
      <div role="status">
        {done ? (
          <p className="inline-flex items-start gap-3 rounded-2xl border border-white/20 px-5 py-4 text-base text-white/90">
            <BellRing className="mt-0.5 size-5 shrink-0 text-anhanga-action" aria-hidden="true" />
            Pronto. Você recebe um e-mail quando o Cacau Park abrir a venda.
          </p>
        ) : null}
      </div>
      {done ? null : (
        <form
          onSubmit={(event) => void handleSubmit(event)}
          noValidate
          aria-labelledby="cacau-waitlist-title"
          className="max-w-2xl"
        >
          <p id="cacau-waitlist-title" className="font-display text-sm font-bold text-white/90">
            Quer saber quando abrir a venda?
          </p>
          {/* Honeypot: invisível para pessoas, preenchido por robô. */}
          <input {...honeypotProps} />

          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <WaitlistInput
              field="name"
              label="Nome"
              value={name}
              error={fieldErrors.name}
              onChange={(value) => changeField('name', value)}
            />
            <WaitlistInput
              field="email"
              label="E-mail"
              value={email}
              error={fieldErrors.email}
              onChange={(value) => changeField('email', value)}
            />
            {/* Branco rebaixado, não Âmbar: o amarelo da página é só do CTA final. */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-white/90 px-6 py-2.5 font-semibold text-anhanga-dark transition-colors hover:bg-white disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action"
            >
              <BellRing className="size-4" aria-hidden="true" />
              {isSubmitting ? 'Enviando…' : 'Me avise'}
            </button>
          </div>

          <ErrorLine id="cacau-waitlist-name-error" message={fieldErrors.name} />
          <ErrorLine id="cacau-waitlist-email-error" message={fieldErrors.email} />
          <ErrorLine message={formError} />

          <label className="mt-4 flex min-h-[44px] cursor-pointer items-start gap-3 text-sm text-white/70">
            <input
              id="cacau-waitlist-optin"
              type="checkbox"
              checked={optIn}
              onChange={(event) => {
                setOptIn(event.target.checked);
                trackField('emailOptIn', event.target.checked);
              }}
              className="mt-0.5 size-4 shrink-0 accent-anhanga-action"
            />
            Também quero receber outras novidades e ofertas da Anhangá por e-mail.
          </label>
          <p className="mt-2 text-xs leading-relaxed text-white/55">
            Usamos seu nome e e-mail para avisar quando o Cacau Park abrir a venda. A caixa
            acima é opcional. Veja a{' '}
            <a href="/politica-privacidade/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-white/90">
              Política de Privacidade
            </a>
            .
          </p>
        </form>
      )}
    </div>
  );
};
