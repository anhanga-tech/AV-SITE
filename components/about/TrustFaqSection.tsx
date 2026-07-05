import React from 'react';
import { m } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
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
        <m.details
          key={item.question}
          className="group bg-white rounded-2xl shadow-float [&_summary::-webkit-details-marker]:hidden"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={i + 1}
        >
          <summary className="flex items-center justify-between gap-4 p-8 cursor-pointer list-none font-black text-lg md:text-xl text-anhanga-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action rounded-2xl">
            {item.question}
            <ChevronDown className="size-5 shrink-0 text-anhanga-action transition-transform duration-300 group-open:rotate-180" aria-hidden="true" />
          </summary>
          <p className="px-8 pb-8 -mt-2 text-zinc-600 font-medium leading-relaxed">{item.answer}</p>
        </m.details>
      ))}
    </div>
  </section>
);
