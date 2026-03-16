import React, { useState } from 'react';
import { BellRing, CheckCircle2, Loader2, Mail, TicketX } from 'lucide-react';
import { useWaitlistCapture } from '../../../hooks/useWaitlistCapture';
import { WAITLIST_SECTION_ID } from './constants';

const WaitlistSection: React.FC = () => {
  const { submitWaitlist, isSubmitting, error } = useWaitlistCapture();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [acceptedLgpd, setAcceptedLgpd] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);
    setWarningMessage(null);

    if (!name.trim() || !email.trim()) {
      setLocalError('Preencha nome completo e e-mail para entrar na lista.');
      return;
    }

    if (!acceptedLgpd) {
      setLocalError('Você precisa aceitar a política de privacidade para continuar.');
      return;
    }

    const result = await submitWaitlist({
      name,
      email,
      sourcePage: typeof window !== 'undefined' ? window.location.pathname : '/lollapalooza',
    });

    if (result.ok === false) {
      setLocalError(result.error);
      return;
    }

    setSuccessMessage('Você entrou na lista de espera para o Lollapalooza 2027.');
    setWarningMessage(result.warning || null);
    setName('');
    setEmail('');
    setAcceptedLgpd(false);
  };

  return (
    <section
      id={WAITLIST_SECTION_ID}
      className="scroll-mt-28 bg-[#fff7dc] border-y border-anhanga-yellow/30 py-20"
      aria-labelledby="waitlist-heading"
    >
      <div className="container mx-auto px-4">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,460px)] items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/60 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-amber-700 shadow-sm">
              <TicketX size={16} aria-hidden="true" />
              Pacotes 2026 esgotados
            </div>

            <h2 id="waitlist-heading" className="mt-5 text-4xl md:text-5xl font-black text-anhanga-darkBlue leading-tight">
              Pacotes 2026 esgotados. A lista de espera 2027 já está aberta.
            </h2>

            <p className="mt-5 text-lg text-slate-700 leading-relaxed max-w-2xl">
              A campanha do Lollapalooza 2026 foi encerrada com todos os pacotes vendidos. Para não perder a próxima abertura,
              deixe seu contato e a Anhangá avisa você primeiro sobre condições, logística e prioridade para 2027.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/80 border border-white px-5 py-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3 text-anhanga-blue">
                  <BellRing size={20} aria-hidden="true" />
                  <p className="font-bold text-anhanga-darkBlue">Prioridade na abertura</p>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Você entra no radar antes da próxima campanha ficar pública.
                </p>
              </div>

              <div className="rounded-3xl bg-white/80 border border-white px-5 py-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3 text-anhanga-blue">
                  <Mail size={20} aria-hidden="true" />
                  <p className="font-bold text-anhanga-darkBlue">Contato sem ruído</p>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Só usamos esse cadastro para novidades do Lolla e comunicação da Anhangá sobre a próxima edição.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] bg-white border border-slate-200 shadow-[0_24px_70px_rgba(15,23,42,0.12)] overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-anhanga-blue">Lista de Espera Lolla 2027</p>
              <p className="mt-2 text-sm text-slate-600">Preencha os dados abaixo para receber o aviso de abertura.</p>
            </div>

            <form className="px-6 py-6 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="lolla-waitlist-name" className="block text-sm font-bold text-slate-800">
                  Nome completo
                </label>
                <input
                  id="lolla-waitlist-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-800 outline-none transition focus:border-anhanga-blue focus:ring-4 focus:ring-anhanga-blue/10"
                  placeholder="Seu nome"
                  autoComplete="name"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="lolla-waitlist-email" className="block text-sm font-bold text-slate-800">
                  E-mail
                </label>
                <input
                  id="lolla-waitlist-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-800 outline-none transition focus:border-anhanga-blue focus:ring-4 focus:ring-anhanga-blue/10"
                  placeholder="voce@email.com"
                  autoComplete="email"
                />
              </div>

              <label className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={acceptedLgpd}
                  onChange={(event) => setAcceptedLgpd(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-anhanga-blue focus:ring-anhanga-blue"
                />
                <span>
                  Aceito receber comunicações da Anhangá Viagens conforme a{' '}
                  <a
                    href="https://www.anhanga.tur.br/politica-privacidade/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-anhanga-blue underline"
                  >
                    Política de Privacidade
                  </a>.
                </span>
              </label>

              {(localError || error) && (
                <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {localError || error}
                </div>
              )}

              {successMessage && (
                <div role="status" className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  {successMessage}
                </div>
              )}

              {warningMessage && (
                <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                  {warningMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-anhanga-blue px-6 py-4 text-base font-black text-white transition hover:bg-anhanga-darkBlue disabled:cursor-wait disabled:opacity-80"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} aria-hidden="true" />
                    Entrar na lista
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WaitlistSection;
