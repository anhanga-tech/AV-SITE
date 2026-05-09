import React from 'react';
import { UserCheck, ShieldCheck, HeartHandshake } from 'lucide-react';
import useIntersectionObserver from './hooks/useIntersectionObserver';
import { getMediaUrl } from '../../../data/mediaConfig';

const WhyUs: React.FC = () => {
  const { elementRef, isVisible } = useIntersectionObserver(0.2);

  return (
    <section id="diferenciais" className="py-20 bg-white" aria-labelledby="why-us-heading" ref={elementRef}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Static Image Column */}
          <div className={`w-full lg:w-1/2 animate-on-scroll ${isVisible ? 'is-visible' : ''}`}>
            <div className="relative group">
              {/* Image Display */}
              <div className="relative overflow-hidden rounded-3xl shadow-2xl rotate-2 group-hover:rotate-0 transition-all duration-500 w-full aspect-[4/3] bg-gray-100">
                 <img 
                    src={getMediaUrl('images/lollapalooza/why-us/multidao-festival.jpg')} 
                    alt="Multidão feliz em um festival de música com confetes e luzes" 
                    width="1155"
                    height="770"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-anhanga-darkBlue/80 via-transparent to-transparent opacity-60"></div>
                  
                  <div className="absolute bottom-6 left-6 text-white max-w-xs">
                     <p className="font-bold text-lg mb-1">A vibe é sua.</p>
                     <p className="text-sm text-gray-200">A logística é nossa.</p>
                  </div>
              </div>
              
              {/* Decorative blob behind */}
              <div className="absolute -z-10 -bottom-6 -right-6 w-full h-full bg-anhanga-yellow rounded-3xl opacity-20 transform rotate-6 transition-transform group-hover:rotate-3"></div>
            </div>
          </div>
          
          <div className={`w-full lg:w-1/2 animate-on-scroll ${isVisible ? 'is-visible' : ''}`} style={{ transitionDelay: '200ms' }}>
            <h2 id="why-us-heading" className="text-3xl md:text-5xl font-black text-gray-900 mb-8 leading-tight">
              Você cuida da setlist.<br /><span className="text-anhanga-blue">A gente cuida do resto.</span>
            </h2>

            <div className="space-y-8">
              {[
                { Icon: UserCheck, title: "Gente de verdade, não robô", text: "Você fala com quem já organizou centenas de pacotes para o Lolla. Especialistas que sabem o que faz diferença no evento.", color: "yellow" },
                { Icon: ShieldCheck, title: "Cada detalhe no lugar", text: "Hotel a distância do autódromo, transfer no horário certo, ingresso em mãos. Sem táxi às 23h. Sem susto na chegada.", color: "blue" },
                { Icon: HeartHandshake, title: "WhatsApp aberto durante o festival", text: "Se surgir qualquer problema durante os três dias, estamos disponíveis. Você curte os shows, a gente resolve o resto.", color: "green" }
              ].map((item) => (
                <div key={item.title} className="flex gap-4 group">
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-12 h-12 ${item.color === 'yellow' ? 'bg-yellow-100 text-anhanga-darkBlue group-hover:bg-anhanga-yellow' : item.color === 'blue' ? 'bg-blue-100 text-anhanga-blue group-hover:bg-anhanga-blue group-hover:text-white' : 'bg-green-100 text-green-600 group-hover:bg-green-500 group-hover:text-white'} transition-colors duration-300 rounded-full flex items-center justify-center`}>
                      <item.Icon size={24} aria-hidden="true" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyUs;
