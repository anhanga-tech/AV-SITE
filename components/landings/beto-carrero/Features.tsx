import React from 'react';
import SectionTitle from './SectionTitle';
import { Clock, Smile, Wallet, Zap, Heart, PiggyBank } from 'lucide-react';
import { Feature } from './types';

const features: Feature[] = [
  {
    icon: <Clock size={48} className="text-fun-dark transition-transform duration-700 ease-in-out group-hover:rotate-[360deg]" />,
    title: "Menos Tempo Perdido",
    description: "Nada de comparar mil opções. A gente já te entrega a melhor combinação de voo e estadia.",
    color: "bg-fun-yellow",
    tooltipText: "Agilidade Total"
  },
  {
    icon: <Smile size={48} className="text-white group-hover:animate-bounce" />,
    title: "Mais Diversão",
    description: "Casais, famílias e grupos. Você aproveita cada momento sem se preocupar com logística.",
    color: "bg-fun-pink",
    tooltipText: "Zero Estresse"
  },
  {
    icon: <Wallet size={48} className="text-white transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-12" />,
    title: "Pacote que faz Sentido",
    description: "Tudo junto sai mais fácil, mais claro e geralmente mais econômico do que comprar picado.",
    color: "bg-fun-green",
    tooltipText: "Economia Inteligente"
  }
];

const Features: React.FC = () => {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#0F172A 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <SectionTitle 
          title="Por que você vai amar" 
          subtitle="Viajar com a Anhangá é viajar leve."
        />

        <div className="grid md:grid-cols-3 gap-10 md:gap-8 mt-16">
          {features.map((feature, idx) => (
            <div 
              key={feature.title}
              className="relative group perspective-1000"
            >
              {/* The Large Number Floating Behind */}
              <div className="absolute -top-10 -left-2 text-[120px] font-sans font-black text-gray-100 select-none z-0 transition-all duration-300 group-hover:text-gray-200 group-hover:-translate-y-4 group-hover:scale-105">
                0{idx + 1}
              </div>

              {/* The Card */}
              <div className="relative z-10 bg-white rounded-2xl border-4 border-fun-dark shadow-hard transition-all duration-300 transform group-hover:-translate-y-3 group-hover:rotate-1 group-hover:shadow-hard-hover h-full flex flex-col overflow-hidden">
                
                {/* Header Bar */}
                <div className={`h-4 w-full border-b-4 border-fun-dark ${feature.color}`}></div>
                
                <div className="p-10 flex-grow flex flex-col relative items-start">
                  
                  {/* Decorative Elements based on index */}
                  {idx === 0 && (
                     <div className="absolute top-4 right-4 opacity-15 transform rotate-12 group-hover:scale-110 transition-transform">
                        <Zap size={90} className="text-fun-yellow fill-current" />
                     </div>
                  )}
                  {idx === 1 && (
                     <div className="absolute top-4 right-4 opacity-15 group-hover:animate-pulse">
                        <Heart size={90} className="text-fun-pink fill-current" />
                     </div>
                  )}
                  {idx === 2 && (
                     <div className="absolute top-4 right-4 opacity-15 transform -rotate-12 group-hover:rotate-0 transition-transform">
                        <PiggyBank size={90} className="text-fun-green fill-current" />
                     </div>
                  )}

                  {/* Icon Badge - Highlighted & Larger */}
                  <div className={`w-24 h-24 rounded-2xl border-4 border-fun-dark flex items-center justify-center mb-8 shadow-hard transition-all duration-300 group-hover:shadow-hard-hover group-hover:scale-110 ${feature.color} relative z-10`}>
                    {feature.icon}
                  </div>

                  <h3 className="text-3xl font-sans font-bold mb-6 text-fun-dark leading-tight">
                    {feature.title}
                  </h3>
                  
                  <p className="font-sans text-xl text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Bottom Highlight */}
                <div className={`h-3 w-0 group-hover:w-full transition-all duration-500 ease-out ${feature.color}`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;