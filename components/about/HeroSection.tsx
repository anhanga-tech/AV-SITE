import React from 'react';
import { m } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { openContactModal } from '../../utils/contactForm';
import { fadeUp } from './aboutMotion';

// Hero da página /sobre: proposta de valor + CTA de orçamento.
export const HeroSection: React.FC = () => (
  <m.section
    className="text-center mb-24"
    initial="hidden"
    animate="visible"
    variants={fadeUp}
    custom={0}
  >
    <div className="inline-block relative mb-6">
      <span className="absolute inset-0 bg-brand-cyan/20 transform -skew-x-12 rounded-lg"></span>
      <span className="relative px-4 py-1 text-brand-dark font-black uppercase tracking-widest text-sm flex items-center gap-2">
        <Sparkles className="size-4 text-brand-cyan" /> Nossa Essência
      </span>
    </div>
    <h1 className="text-5xl md:text-6xl font-black text-brand-dark mb-6 leading-tight">
      Viagens com alma, <br />
      <span className="text-brand-cyan">
        design e zero estresse.
      </span>
    </h1>
    <p className="max-w-2xl mx-auto text-zinc-600 text-lg md:text-xl font-medium leading-relaxed mb-8">
      Na Anhangá Viagens, acreditamos que viajar é mais do que carimbar um passaporte: é sobre colecionar histórias que valem a pena ser contadas.
    </p>
    <div className="flex justify-center">
      <button
        type="button"
        onClick={() => openContactModal({ source: 'about' })}
        className="btn-whatsapp btn-specialist bg-brand-vibrant text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl shadow-brand-vibrant/20 hover:scale-105 transition-transform active:scale-95 flex items-center gap-3"
        data-tracking="hero-about"
      >
        Solicitar Orçamento
        <Sparkles className="size-5" />
      </button>
    </div>
  </m.section>
);
