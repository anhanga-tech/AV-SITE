import React from 'react';
import { m } from 'framer-motion';
import { ShieldCheck, Users, Sparkles } from 'lucide-react';
import { fadeUp } from './aboutMotion';

const EXPERTISE_ITEMS = [
  {
    icon: Users,
    title: 'Atendimento Humano',
    desc: 'O chat com IA no site faz a triagem inicial, mas quem desenha seu roteiro é sempre um especialista humano.',
    color: 'bg-orange-100 text-orange-600',
  },
  {
    icon: Sparkles,
    title: 'Curadoria Premium',
    desc: 'Selecionamos hotéis e experiências que fogem do óbvio, garantindo que sua viagem seja única.',
    color: 'bg-brand-cyan/10 text-brand-cyan',
  },
  {
    icon: ShieldCheck,
    title: 'Suporte 24/7',
    desc: 'Durante sua viagem, nossa equipe está a um WhatsApp de distância para resolver qualquer imprevisto.',
    color: 'bg-emerald-100 text-emerald-600',
  },
];

// Seção "Por que viajar com a Anhangá?": diferenciais em cards.
export const ExpertiseSection: React.FC = () => (
  <section className="mb-32">
    <m.div
      className="text-center mb-16"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      custom={0}
    >
      <h2 className="text-3xl md:text-4xl font-black text-brand-dark mb-4">Por que viajar com a Anhangá?</h2>
      <p className="text-zinc-500 font-medium">O que nos torna diferentes no mercado de turismo.</p>
    </m.div>

    <div className="grid md:grid-cols-3 gap-8">
      {EXPERTISE_ITEMS.map((item, i) => (
        <m.div
          key={item.title}
          className="bg-white p-10 rounded-[2.5rem] border-2 border-zinc-100 shadow-sm hover:shadow-xl transition duration-300"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={i + 1}
        >
          <div className={`size-14 rounded-2xl ${item.color} flex items-center justify-center mb-6`}>
            <item.icon className="size-8" />
          </div>
          <h3 className="text-xl font-black text-brand-dark mb-4">{item.title}</h3>
          <p className="text-zinc-500 font-medium leading-relaxed">{item.desc}</p>
        </m.div>
      ))}
    </div>
  </section>
);
