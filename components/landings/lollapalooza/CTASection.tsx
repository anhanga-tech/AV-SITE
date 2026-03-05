import React from 'react';
import Button from './Button';
import { ExternalLink } from 'lucide-react';
import useIntersectionObserver from './hooks/useIntersectionObserver';

const CTASection: React.FC = () => {
  const { elementRef, isVisible } = useIntersectionObserver(0.2);

  return (
    <section className="py-24 bg-anhanga-blue relative overflow-hidden" ref={elementRef}>
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      
      <div className={`container mx-auto px-4 text-center relative z-10 animate-on-scroll ${isVisible ? 'is-visible' : ''}`}>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-8 leading-tight">
          Fale com um especialista e <br className="hidden md:block"/> personalize sua experiência agora!
        </h2>
        <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
          Não deixe para a última hora. Garanta as melhores opções de hospedagem e transporte para o Lolla 2026.
        </p>
        
        <div className="flex flex-col items-center gap-8">
          {/* Wrapper ajustado para evitar conflito de animação com o Button */}
          <div className="w-full max-w-md mx-auto">
            <Button text="Quero meu pacote para o Lolla 2026" className="text-xl px-12 py-5 shadow-2xl w-full md:w-auto" dataWhatsappLocation="cta_section_main_button" dataTracking="footer-lolla" />
          </div>

          <div className="flex flex-col items-center gap-3 mt-4">
             <p className="text-blue-100/80 text-sm max-w-md mx-auto">
               <strong>Nota importante:</strong> A Anhangá Viagens não realiza a venda de ingressos.
             </p>
             <a 
               href="https://www.ticketmaster.com.br/event/lollapaloozabr?utm_source=site&utm_medium=site_festival&utm_campaign=ll-ingressos2026&utm_id=header&utm_term=botao_compreagora&utm_content=site_site_festival_header_ll-ingressos2026_botao_compreagora_contlol01090"
               target="_blank"
               rel="noopener noreferrer"
               className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-white/30 text-white text-sm font-semibold hover:bg-white hover:text-anhanga-blue transition-all duration-300 hover:border-transparent group"
             >
               Comprar ingresso no site oficial Ticketmaster
               <ExternalLink size={14} className="group-hover:stroke-anhanga-blue" />
             </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;