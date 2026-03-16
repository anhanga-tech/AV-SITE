import React from 'react';
import Button from './Button';
import { BellRing } from 'lucide-react';
import useIntersectionObserver from './hooks/useIntersectionObserver';
import { WAITLIST_CTA_LABEL, WAITLIST_SECTION_ID } from './constants';

const CTASection: React.FC = () => {
  const { elementRef, isVisible } = useIntersectionObserver(0.2);

  return (
    <section className="py-24 bg-anhanga-blue relative overflow-hidden" ref={elementRef}>
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      
      <div className={`container mx-auto px-4 text-center relative z-10 animate-on-scroll ${isVisible ? 'is-visible' : ''}`}>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-8 leading-tight">
          2026 esgotou. <br className="hidden md:block"/> 2027 começa aqui.
        </h2>
        <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
          Entre na lista de espera e receba prioridade quando a próxima campanha do Lollapalooza abrir.
        </p>
        
        <div className="flex flex-col items-center gap-8">
          <div className="w-full max-w-md mx-auto">
            <Button
              text={WAITLIST_CTA_LABEL}
              href={`#${WAITLIST_SECTION_ID}`}
              className="text-xl px-12 py-5 shadow-2xl w-full md:w-auto"
              dataTracking="footer-lolla-waitlist"
              id="btn-lolla-waitlist-footer"
            />
          </div>

          <div className="flex flex-col items-center gap-3 mt-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white">
              <BellRing size={16} aria-hidden="true" />
              Sem venda ativa de pacotes. Só lista de espera e aviso antecipado.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
