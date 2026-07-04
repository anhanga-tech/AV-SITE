import React from 'react';
import { m } from 'framer-motion';
import { fadeUp } from './aboutMotion';

interface TrustFaqItem {
  question: string;
  answer: string;
}

interface TrustFaqSectionProps {
  items: TrustFaqItem[];
}

// FAQ de confiança answer-first. Mesma fonte (items) alimenta o FAQPage
// JSON-LD emitido em pages/About.tsx — sem drift entre schema e texto.
export const TrustFaqSection: React.FC<TrustFaqSectionProps> = ({ items }) => (
  <section id="perguntas-frequentes" className="mt-32">
    <m.div
      className="text-center mb-16"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      custom={0}
    >
      <h2 className="text-3xl md:text-4xl font-black text-anhanga-dark mb-4">Perguntas frequentes sobre a Anhangá</h2>
      <p className="text-zinc-500 font-medium max-w-2xl mx-auto">
        Confiança, credenciamentos e como funciona o atendimento — em respostas diretas.
      </p>
    </m.div>

    <div className="max-w-3xl mx-auto space-y-5">
      {items.map((item, i) => (
        <m.div
          key={item.question}
          className="bg-white p-8 rounded-3xl border-2 border-zinc-100 shadow-sm"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={i + 1}
        >
          <h3 className="text-lg md:text-xl font-black text-anhanga-dark mb-3">{item.question}</h3>
          <p className="text-zinc-600 font-medium leading-relaxed">{item.answer}</p>
        </m.div>
      ))}
    </div>
  </section>
);
