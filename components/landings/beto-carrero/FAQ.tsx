import React, { useState } from 'react';
import SectionTitle from './SectionTitle';
import Button from './Button';
import { FAQItem } from './types';
import { ChevronDown, HelpCircle, Sparkles, ArrowRight } from 'lucide-react';

const items: FAQItem[] = [
  { question: "Os pacotes incluem ingresso do Beto Carrero?", answer: "Sim! Trabalhamos com ingressos oficiais. Você recebe o QR Code direto no seu WhatsApp e entra no parque sem pegar fila na bilheteria." },
  { question: "Posso escolher hotel e datas?", answer: "Totalmente! A gente não vende aqueles pacotes engessados de data fixa. Você diz quando quer ir, e nós encontramos o melhor voo e hotel para esses dias." },
  { question: "Dá pra incluir Balneário ou Floripa?", answer: "Com certeza. É super comum! Podemos montar um roteiro misto: uns dias curtindo o parque em Penha e outros dias relaxando nas praias de Balneário ou Florianópolis." },
  { question: "E se eu precisar cancelar?", answer: "Sem letras miúdas. Seguimos as regras da companhia aérea e do hotel, mas nossa equipe briga por você para conseguir as melhores condições de remarcação ou reembolso possíveis." },
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-24 bg-fun-yellow relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-20 left-10 size-32 bg-white/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 size-40 bg-fun-pink/10 rounded-full blur-3xl"></div>
      
      {/* Floating Question Marks */}
      <HelpCircle className="absolute top-10 right-[10%] text-fun-dark/10 size-24 -rotate-12 animate-pulse" />
      <HelpCircle className="absolute bottom-10 left-[5%] text-fun-dark/10 size-16 rotate-12" />

      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        
        {/* Card Container */}
        <div className="bg-white rounded-[2.5rem] border-4 border-fun-dark shadow-hard-lg overflow-hidden">
            
            <div className="p-8 md:p-12 pb-0 text-center">
               <SectionTitle title="Dúvidas? Relaxa." subtitle="Tudo o que você precisa saber antes de fazer as malas." />
            </div>

            <div className="p-6 md:p-12 pt-4 space-y-4">
              {items.map((item, idx) => {
                const isOpen = openIndex === idx;
                return (
                  <div
                    key={item.question}
                    className={`border-2 border-fun-dark rounded-2xl transition-all duration-300 overflow-hidden ${isOpen ? 'bg-blue-50 shadow-hard' : 'bg-white hover:bg-zinc-50'}`}
                  >
                    <button 
                      onClick={() => toggleAccordion(idx)}
                      className="w-full flex items-center justify-between p-5 md:p-6 text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-fun-blue/50"
                      aria-expanded={isOpen}
                    >
                      <span className={`font-sans font-bold text-lg md:text-xl pr-4 leading-tight ${isOpen ? 'text-fun-blue' : 'text-fun-dark'}`}>
                        {item.question}
                      </span>
                      <div className={`flex-shrink-0 size-8 rounded-full border-2 border-fun-dark flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-fun-blue text-white rotate-180' : 'bg-white text-fun-dark'}`}>
                        <ChevronDown size={20} strokeWidth={3} />
                      </div>
                    </button>
                    
                    {/* Improved Smooth Animation using Grid Template Rows */}
                    <div 
                      className={`grid transition-[grid-template-rows,opacity] duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-6 md:px-8 pb-6 md:pb-8">
                           {/* Improved Text Formatting */}
                           <div className="pt-6 border-t-2 border-dashed border-fun-dark/20">
                             <p className="text-zinc-700 text-base md:text-lg font-medium leading-relaxed md:leading-8">
                               {item.answer}
                             </p>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Final CTA Box - High Contrast */}
            <div className="bg-fun-dark text-white p-8 md:p-12 text-center relative overflow-hidden mt-4">
               {/* Pattern */}
               <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1.5px, transparent 1.5px)', backgroundSize: '20px 20px' }}></div>
               
               <div className="relative z-10 flex flex-col items-center">
                 <div className="inline-flex items-center gap-2 bg-fun-pink px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 shadow-sm transform -rotate-2">
                    <Sparkles size={14} /> Último Passo
                 </div>
                 
                 <h3 className="font-sans font-bold text-3xl md:text-4xl mb-4 leading-tight">
                    Sua viagem começa no <span className="text-[#25D366]">WhatsApp</span>
                 </h3>
                 
                 <p className="text-zinc-300 text-lg mb-8 max-w-lg mx-auto">
                    Não perca tempo em sites confusos. Diga a data e receba sua proposta completa hoje mesmo.
                 </p>
                 
                 <div className="transform hover:scale-105 transition-transform duration-300">
                    <Button 
                      text="Montar Meu Pacote Agora" 
                      variant="primary" 
                      tooltip="É rápido e sem compromisso" 
                      className="text-xl px-10 py-5"
                      dataTracking="footer-betocarrero"
                    />
                 </div>
               </div>
            </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;