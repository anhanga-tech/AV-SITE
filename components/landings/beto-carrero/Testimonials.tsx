import React from 'react';
import SectionTitle from './SectionTitle';
import { Star, Quote, CheckCircle2 } from 'lucide-react';
import { Testimonial } from './types';
import { optimizeRemoteImageUrl } from '../../../data/mediaConfig';

export const BETO_TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: "Família Souza",
    quote: "Foi a melhor viagem da nossa família. Não tivemos dor de cabeça com nada, o hotel era do lado do parque!",
    avatar: optimizeRemoteImageUrl('images/beto-carrero/testimonials/familia-souza.jpg', 100, 100)
  },
  {
    id: 2,
    name: "Roberto & Ana",
    quote: "Tudo chegou certinho no WhatsApp, só tivemos o trabalho de ir pro aeroporto. Recomendo demais.",
    avatar: optimizeRemoteImageUrl('images/beto-carrero/testimonials/roberto-ana.jpg', 100, 100)
  },
  {
    id: 3,
    name: "Carla Dias",
    quote: "Eu estava perdida com tanta informação na internet. A Anhangá resolveu em 10 minutos de conversa.",
    avatar: optimizeRemoteImageUrl('images/beto-carrero/testimonials/carla-dias.jpg', 100, 100)
  }
];

const Testimonials: React.FC = () => {
  return (
    <section className="py-24 bg-fun-dark text-white border-y-4 border-black relative overflow-hidden">
      
      {/* Background Pattern (White Dots on Dark) */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#F8FAFC 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <SectionTitle 
          title="Quem já viajou recomenda" 
          subtitle="Histórias reais de quem trocou o estresse pela diversão."
          color="white"
        />

        <div className="grid md:grid-cols-3 gap-12 lg:gap-8 mt-20 px-4">
          {BETO_TESTIMONIALS.map((t, idx) => {
             // Rotation logic to make it look organic
             const rotationClasses = [
                'rotate-2 lg:rotate-2 hover:rotate-0 translate-y-4', // Card 1
                '-rotate-1 lg:-rotate-2 hover:rotate-0 -translate-y-4', // Card 2
                'rotate-3 lg:rotate-3 hover:rotate-0 translate-y-2'  // Card 3
             ];
             
             // Tape colors variation
             const tapeColors = ['bg-fun-pink/90', 'bg-fun-yellow/90', 'bg-fun-green/90'];

             return (
              <div 
                key={t.id} 
                className={`bg-white text-fun-dark p-8 rounded-sm shadow-hard border-4 border-white transition-all duration-300 group hover:scale-105 hover:z-20 relative flex flex-col ${rotationClasses[idx % 3]}`}
              >
                 {/* Tape Effect (Top Center) */}
                 <div className={`absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-10 ${tapeColors[idx % 3]} backdrop-blur-sm shadow-sm transform -rotate-1 border-l-2 border-r-2 border-white/20 z-20`}></div>

                 {/* Giant Quote Icon Background */}
                 <Quote className="absolute top-8 left-6 text-gray-100 w-24 h-24 rotate-12 z-0 pointer-events-none" />

                 {/* Stars */}
                 <div className="flex gap-1 mb-6 text-fun-yellow relative z-10">
                   {[...Array(5)].map((_, i) => <Star key={`star-${i}`} fill="currentColor" size={24} strokeWidth={2} className="drop-shadow-sm" />)}
                 </div>

                 {/* Quote Content */}
                 <p className="text-xl md:text-2xl font-sans font-bold leading-snug mb-8 relative z-10 flex-grow">
                   "{t.quote}"
                 </p>

                 {/* Author & Verification */}
                 <div className="flex items-center gap-4 border-t-2 border-dashed border-gray-200 pt-6 mt-auto relative z-10">
                   <div className="relative">
                      <img src={t.avatar} alt={t.name} width="56" height="56" loading="lazy" className="w-14 h-14 rounded-full border-2 border-fun-dark shadow-sm" />
                      <div className="absolute -bottom-1 -right-1 bg-fun-blue text-white rounded-full p-0.5 border border-white">
                        <CheckCircle2 size={12} strokeWidth={4} />
                      </div>
                   </div>
                   
                   <div>
                     <span className="font-sans font-bold text-lg block leading-none mb-1">{t.name}</span>
                     <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full inline-block border border-green-200 uppercase tracking-wide">
                        Viagem Verificada
                     </span>
                   </div>
                 </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
