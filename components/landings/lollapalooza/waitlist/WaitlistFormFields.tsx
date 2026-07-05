import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface WaitlistFormFieldsProps {
  name: string;
  email: string;
  acceptedLgpd: boolean;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onLgpdChange: (value: boolean) => void;
}

export function WaitlistFormFields({
  name,
  email,
  acceptedLgpd,
  onNameChange,
  onEmailChange,
  onLgpdChange,
}: WaitlistFormFieldsProps) {
  return (
    <>
      <div className="group relative space-y-2">
        <label htmlFor="lolla-waitlist-name" className="block text-[10px] font-black text-anhanga-yellow uppercase tracking-[0.2em] transition-colors group-focus-within:text-white">
          Nome completo
        </label>
        <div className="relative">
          <input
            id="lolla-waitlist-name"
            type="text"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            className="peer w-full bg-anhanga-darkBlue/80 border-l-2 border-white/10 px-6 py-4 text-white placeholder-white/50 outline-none transition duration-300 focus:border-anhanga-yellow focus:bg-anhanga-yellow/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-anhanga-yellow focus-visible:outline-offset-2"
            placeholder="EX: SABRINA CARPENTER"
            autoComplete="name"
          />
          {/* Focus geometric accent */}
          <div className="absolute left-0 bottom-0 h-0.5 w-0 bg-anhanga-yellow transition-[width] duration-500 peer-focus:w-full" />
          <div className="absolute -left-[2px] top-0 h-0 w-2.5 bg-anhanga-yellow transition-[height] duration-500 peer-focus:h-full" />
        </div>
      </div>

      <div className="group relative space-y-2">
        <label htmlFor="lolla-waitlist-email" className="block text-[10px] font-black text-anhanga-blue uppercase tracking-[0.2em] transition-colors group-focus-within:text-white">
          Seu melhor E-mail
        </label>
        <div className="relative">
          <input
            id="lolla-waitlist-email"
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            className="peer w-full bg-anhanga-darkBlue/80 border-l-2 border-white/10 px-6 py-4 text-white placeholder-white/50 outline-none transition duration-300 focus:border-anhanga-blue focus:bg-anhanga-blue/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-anhanga-blue focus-visible:outline-offset-2"
            placeholder="VOICE@EXEMPLO.COM"
            autoComplete="email"
          />
          {/* Focus geometric accent */}
          <div className="absolute left-0 bottom-0 h-0.5 w-0 bg-anhanga-blue transition-[width] duration-500 peer-focus:w-full" />
          <div className="absolute -left-[2px] top-0 h-0 w-2.5 bg-anhanga-blue transition-[height] duration-500 peer-focus:h-full" />
        </div>
      </div>

      <label className="flex items-start gap-4 cursor-pointer group pt-4">
        <div className="relative flex items-center justify-center">
          <input
            id="lolla-waitlist-lgpd"
            type="checkbox"
            checked={acceptedLgpd}
            onChange={(event) => onLgpdChange(event.target.checked)}
            className="peer sr-only"
          />
          <div className="size-5 border-2 border-white/20 peer-checked:border-anhanga-yellow peer-checked:bg-anhanga-yellow transition duration-200 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-anhanga-yellow peer-focus-visible:outline-offset-2" />
          <CheckCircle2 size={12} className="absolute text-black opacity-0 peer-checked:opacity-100 transition-opacity" />
        </div>
        <span className="text-xs text-zinc-400 leading-snug group-hover:text-zinc-300 transition-colors">
          Quero receber novidades exclusivas da Anhangá por e-mail.
        </span>
      </label>

      <p className="text-xs text-zinc-500 leading-relaxed">
        Ao entrar na lista, seus dados serão usados para avisos sobre pacotes do Lollapalooza. Consulte a{' '}
          <a
            href="/politica-privacidade/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-anhanga-yellow underline underline-offset-4"
          >
            Política de Privacidade
          </a>.
      </p>
    </>
  );
}
