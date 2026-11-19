import React, { memo } from 'react';

const TRUST_ITEMS: { title: string; description?: string }[] = [
  {
    title: 'Agência credenciada',
    description: 'Certificado Cadastur',
  },
  {
    title: 'Sem compromisso',
  },
  {
    title: 'Atendimento humano',
  },
  {
    title: 'Suporte na viagem',
    description: 'Acompanhamento pelo WhatsApp',
  },
];

const TrustBar = memo(() => (
  <section className="bg-white border-y border-zinc-100" aria-label="Sinais de confiança">
    <div className="container mx-auto px-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100">
        {TRUST_ITEMS.map(({ title, description }) => (
          <div key={title} className="py-5 sm:px-5 lg:px-6 first:sm:pl-0 last:sm:pr-0">
            <p className="text-sm font-black uppercase tracking-wide text-anhanga-dark">
              {title}
            </p>
            {description ? (
              <p className="mt-1 text-sm font-medium leading-snug text-zinc-500">
                {description}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  </section>
));

TrustBar.displayName = 'TrustBar';

export default TrustBar;
