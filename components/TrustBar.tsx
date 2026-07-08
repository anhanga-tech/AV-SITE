import React, { memo } from 'react';
import { BadgeCheck, ClipboardCheck, MessageCircle, Users } from 'lucide-react';

const TRUST_ITEMS = [
  {
    icon: BadgeCheck,
    title: 'Agência credenciada',
    description: 'Cadastur e atendimento formal',
  },
  {
    icon: ClipboardCheck,
    title: 'Sem compromisso',
    description: 'Você avalia a proposta antes de decidir',
  },
  {
    icon: Users,
    title: 'Atendimento humano',
    description: 'Especialistas montam seu planejamento',
  },
  {
    icon: MessageCircle,
    title: 'Suporte na viagem',
    description: 'Acompanhamento pelo WhatsApp',
  },
];

const TrustBar = memo(() => (
  <section className="bg-white border-y border-zinc-100" aria-label="Sinais de confiança">
    <div className="container mx-auto px-6">
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100">
        {TRUST_ITEMS.map((item) => (
          <div key={item.title} className="flex items-start gap-3 py-5 sm:px-5 lg:px-6 first:sm:pl-0 last:sm:pr-0">
            <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand-cyan">
              <item.icon className="size-5" strokeWidth={2.4} aria-hidden="true" />
            </div>
            <div>
              <dt className="text-sm font-black uppercase tracking-wide text-brand-dark">
                {item.title}
              </dt>
              <dd className="mt-1 text-sm font-medium leading-snug text-zinc-500">
                {item.description}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  </section>
));

TrustBar.displayName = 'TrustBar';

export default TrustBar;
