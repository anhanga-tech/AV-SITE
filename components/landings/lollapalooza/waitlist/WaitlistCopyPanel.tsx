import React from 'react';
import { BellRing, TicketX, Zap } from 'lucide-react';
import { m } from 'framer-motion';

const CONTAINER_VARIANTS = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const ITEM_VARIANTS = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } as const }
};

export function WaitlistCopyPanel() {
  return (
    <m.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={CONTAINER_VARIANTS}
      className="flex flex-col items-start text-left"
    >
      <m.div variants={ITEM_VARIANTS} className="inline-flex items-center gap-2 bg-anhanga-yellow text-black px-4 py-1 text-[10px] font-black uppercase tracking-[0.25em] ring-2 ring-anhanga-yellow ring-offset-4 ring-offset-black mb-10">
        <TicketX size={14} strokeWidth={3} aria-hidden="true" />
        Sold Out 2026
      </m.div>

      <m.h2
        variants={ITEM_VARIANTS}
        id="waitlist-heading"
        className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[0.9] uppercase italic tracking-tighter mb-8"
      >
        Não fique de fora do <span className="text-anhanga-yellow">Lolla 2027.</span>
      </m.h2>

      <m.p variants={ITEM_VARIANTS} className="text-lg md:text-xl text-zinc-400 font-medium leading-relaxed max-w-xl mb-12">
        A jornada de 2026 lotou em tempo recorde. Garanta seu lugar na lista de prioridade para a edição 2027 e receba avisos antecipados sobre pacotes, logística e condições exclusivas Anhangá.
      </m.p>

      <div className="grid gap-6 w-full max-w-lg">
        <m.div variants={ITEM_VARIANTS} className="group flex gap-4 p-6 bg-white/[0.03] border border-white/10 hover:border-anhanga-yellow transition-colors duration-300">
          <div className="bg-anhanga-yellow text-black p-3 h-fit">
            <BellRing size={20} strokeWidth={3} aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-black text-white uppercase tracking-wider mb-2">Prioridade Total</h3>
            <p className="text-sm text-zinc-500 leading-relaxed font-medium">Recepção de ofertas antes do lançamento público geral.</p>
          </div>
        </m.div>

        <m.div variants={ITEM_VARIANTS} className="group flex gap-4 p-6 bg-white/[0.03] border border-white/10 hover:border-anhanga-blue transition-colors duration-300">
          <div className="bg-anhanga-blue text-white p-3 h-fit">
            <Zap size={20} strokeWidth={3} aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-black text-white uppercase tracking-wider mb-2">Logística Hardcore</h3>
            <p className="text-sm text-zinc-500 leading-relaxed font-medium">Saiba primeiro os hotéis mais próximos e as rotas mais eficientes.</p>
          </div>
        </m.div>
      </div>
    </m.div>
  );
}
