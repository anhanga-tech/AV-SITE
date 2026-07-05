import React from 'react';
import { m } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { openContactModal } from '../../utils/contactForm';
import { Button } from '../ui/Button';
import { fadeUp } from './aboutMotion';

// CTA final da página /sobre.
export const CtaSection: React.FC = () => (
  <m.section
    className="mt-32 text-center"
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    variants={fadeUp}
  >
    <div className="bg-brand-cyan/5 rounded-[3rem] p-12 md:p-20 border-2 border-dashed border-brand-cyan/20">
      <h2 className="text-3xl md:text-4xl font-black text-brand-dark mb-6">Pronto para sua próxima história?</h2>
      <p className="text-zinc-600 text-lg font-medium mb-10 max-w-xl mx-auto">
        Seja para um festival épico ou um refúgio relaxante, nós desenhamos a viagem perfeita para você.
      </p>
      <div className="flex justify-center">
        <Button
          variant="cta"
          size="lg"
          onClick={() => openContactModal({ source: 'about' })}
          className="btn-whatsapp btn-specialist font-black"
          rightIcon={<Sparkles className="size-5" />}
          data-tracking="footer-about"
        >
          Começar Planejamento
        </Button>
      </div>
    </div>
  </m.section>
);
