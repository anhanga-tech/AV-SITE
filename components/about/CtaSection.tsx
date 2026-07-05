import React from 'react';
import { m } from 'framer-motion';
import { Link } from 'react-router-dom';
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
    custom={0}
  >
    <div className="bg-anhanga-action/5 rounded-[3rem] p-12 md:p-20">
      <h2 className="text-3xl md:text-4xl font-black text-anhanga-dark mb-6">Pronto para sua próxima história?</h2>
      <p className="text-zinc-600 text-lg font-medium mb-10 max-w-xl mx-auto">
        Seja para um festival épico ou um refúgio relaxante, nós desenhamos a viagem perfeita para você.
      </p>
      <div className="flex justify-center">
        <Button
          variant="cta"
          size="lg"
          onClick={() => openContactModal({ source: 'about' })}
          className="btn-whatsapp btn-specialist font-black"
          rightIcon={<Sparkles className="size-5" aria-hidden="true" />}
          data-tracking="footer-about"
        >
          Começar Planejamento
        </Button>
      </div>
      <p className="mt-6 text-sm text-zinc-500 font-medium">
        Viagem corporativa ou em grupo?{' '}
        <Link to="/corporativo" className="text-anhanga-action font-bold hover:underline">
          Conheça o atendimento para empresas
        </Link>
      </p>
    </div>
  </m.section>
);
