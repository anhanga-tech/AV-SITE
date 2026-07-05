import React from 'react';
import { m } from 'framer-motion';
import { Award, Anchor, MapPin } from 'lucide-react';
import { fadeUp } from './aboutMotion';

const CREDENTIAL_BADGES = [
  { icon: Award, title: 'Beto Carrero World', subtitle: 'Agente credenciado' },
  { icon: Award, title: 'Hopi Hari', subtitle: 'Agente credenciado' },
  { icon: Anchor, title: 'Norwegian Cruise Line', subtitle: 'Parceira (NCL)' },
  { icon: MapPin, title: 'São Paulo - SP', subtitle: 'Atendimento presencial' },
];

// Seção "Agência Certificada": credenciamentos como fatos verificáveis em texto
// (Cadastur, Beto Carrero, Hopi Hari, NCL) — os mesmos sinais que o JSON-LD de
// entidade em pages/About.tsx expõe para motores de resposta. Sem cards
// isolados em contexto dark (DESIGN.md): os badges vivem direto no fundo da
// seção, sem card individual próprio.
export const TrustSection: React.FC = () => (
  <section id="certificacoes" className="bg-anhanga-dark rounded-[3rem] p-12 md:p-20 text-white/90">
    <m.div
      className="flex flex-col lg:flex-row gap-16 items-center"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      custom={0}
    >
      <div className="w-full lg:w-1/2">
        <div className="inline-flex items-center gap-2 px-4 py-1 bg-white/10 rounded-full text-anhanga-action text-sm font-bold mb-6">
          <Award className="size-4" aria-hidden="true" /> Credibilidade & Confiança
        </div>
        <h2 className="text-3xl md:text-4xl font-black mb-6">Agência Certificada</h2>
        <p className="text-white/70 text-lg font-medium leading-relaxed mb-8">
          Sua segurança é nossa prioridade. A Anhangá Viagens é uma empresa devidamente registrada nos órgãos competentes, garantindo total conformidade legal para suas férias.
        </p>

        <ul className="space-y-6">
          <li className="flex items-start gap-4">
            <div className="size-6 rounded-full bg-anhanga-action/20 flex items-center justify-center shrink-0 mt-1">
              <div className="size-2 rounded-full bg-anhanga-action"></div>
            </div>
            <div>
              <p className="font-bold text-lg leading-none mb-1">Cadastur Oficial</p>
              <p className="text-white/60">Registro MTUR: 37.036.732/0001-41</p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <div className="size-6 rounded-full bg-anhanga-action/20 flex items-center justify-center shrink-0 mt-1">
              <div className="size-2 rounded-full bg-anhanga-action"></div>
            </div>
            <div>
              <p className="font-bold text-lg leading-none mb-1">Sede Própria em São Paulo</p>
              <p className="text-white/60">Av. Dom Pedro I, 773 - Vila Monumento, CEP 01552-001</p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <div className="size-6 rounded-full bg-anhanga-action/20 flex items-center justify-center shrink-0 mt-1">
              <div className="size-2 rounded-full bg-anhanga-action"></div>
            </div>
            <div>
              <p className="font-bold text-lg leading-none mb-1">Agente Credenciado</p>
              <p className="text-white/60">Beto Carrero World e Hopi Hari</p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <div className="size-6 rounded-full bg-anhanga-action/20 flex items-center justify-center shrink-0 mt-1">
              <div className="size-2 rounded-full bg-anhanga-action"></div>
            </div>
            <div>
              <p className="font-bold text-lg leading-none mb-1">Parceira Norwegian Cruise Line</p>
              <p className="text-white/60">Cruzeiros nacionais e internacionais (NCL)</p>
            </div>
          </li>
        </ul>
      </div>

      <div className="w-full lg:w-1/2 grid grid-cols-2 gap-x-6 gap-y-8">
        {CREDENTIAL_BADGES.map((badge) => (
          <div key={badge.title} className="flex flex-col items-center text-center">
            <badge.icon className="size-10 text-anhanga-action mb-3" aria-hidden="true" />
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/50 mb-1">{badge.subtitle}</p>
            <p className="font-black text-lg leading-tight">{badge.title}</p>
          </div>
        ))}
      </div>
    </m.div>
  </section>
);
