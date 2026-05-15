import React, { memo } from 'react';
import {
  ChatCircleDots,
  PaintBrushBroad,
  CreditCard,
  AirplaneTilt,
  Sparkle,
  ArrowRight,
  Star,
  Heart,
} from '@phosphor-icons/react';
import { openContactModal } from '../utils/contactForm';

// Moved outside component to prevent re-allocation on every render
const STEPS = [
  {
    id: 1,
    icon: <ChatCircleDots className="size-8 text-white" weight="fill" />,
    title: "Oie! Vamos conversar?",
    desc: "Nada de formulários chatos. A gente bate um papo no WhatsApp para entender seus sonhos e quanto você quer investir.",
    color: "bg-brand-yellow",
    lightColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    rotate: "-rotate-2",
    sticker: <Heart className="size-20 text-yellow-400 drop-shadow-md" weight="fill" />
  },
  {
    id: 2,
    icon: <PaintBrushBroad className="size-8 text-white" weight="fill" />,
    title: "Desenhando o Sonho",
    desc: "Nossos especialistas criam um roteiro dia-a-dia só seu. Ajustamos cada detalhe até você dizer: 'É isso!'",
    color: "bg-brand-cyan",
    lightColor: "bg-sky-50",
    borderColor: "border-sky-200",
    rotate: "rotate-3",
    sticker: (
      <div className="relative size-24 drop-shadow-md" aria-hidden="true">
        <Star className="absolute inset-0 size-24 text-sky-200" weight="fill" />
        <Star className="absolute inset-0 size-24 text-sky-400" weight="regular" />
      </div>
    )
  },
  {
    id: 3,
    icon: <CreditCard className="size-8 text-white" weight="fill" />,
    title: "Burocracia? Deixa com a gente",
    desc: "Aprovado? Ótimo! Nós emitimos voos, hotéis e passeios. Parcelamos tudo e você recebe os vouchers organizadinhos.",
    color: "bg-emerald-500",
    lightColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    rotate: "-rotate-1",
    sticker: <div className="text-8xl drop-shadow-md filter hue-rotate-15">✈️</div>
  },
  {
    id: 4,
    icon: <AirplaneTilt className="size-8 text-white" weight="fill" />,
    title: "Fui! Partiu Viajar",
    desc: "Agora é só fazer as malas! E se precisar de algo lá longe? Nosso time fica de plantão 24h por você.",
    color: "bg-green-500",
    lightColor: "bg-green-50",
    borderColor: "border-green-200",
    rotate: "rotate-2",
    sticker: <div className="text-8xl drop-shadow-md">🏝️</div>
  }
];

/**
 * HowItWorks Component - Optimized with React.memo
 *
 * PERFORMANCE WIN: Prevents expensive re-renders of the complex SVG path and step list.
 * As a static informational section, it does not need to re-render when parent state updates.
 */
const HowItWorks = memo(() => {

  return (
    <section id="como-funciona" className="pt-24 pb-32 relative overflow-hidden bg-[#fffdf5]" aria-label="Como Funciona">
      
      {/* Background Pattern - Dot Grid */}
      <div className="absolute inset-0 z-0 opacity-[0.4]" 
           style={{ backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      </div>

      {/* Floating Blobs (Background) */}

      <div className="container mx-auto px-6 relative z-10">
        
        {/* Header Divertido */}
        <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-block relative">
                <span className="absolute -inset-1 block -skew-y-2 bg-brand-yellow rounded-lg" aria-hidden="true"></span>
                <span className="relative text-brand-dark font-black text-sm uppercase tracking-widest px-2 py-1">Sem Complicação</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-extrabold text-brand-dark mt-6 mb-6 leading-tight">
                Como a mágica <br className="md:hidden"/> acontece?
            </h2>
            <p className="text-xl text-zinc-600 font-medium font-sans">
                Planejar viagem não precisa ser chato. <br className="hidden md:block"/>
                Aqui vai funcionar assim: você fala, a gente afia o lápis e monta tudo.
            </p>
        </div>

        {/* Timeline Container */}
        <div className="relative max-w-5xl mx-auto mb-20">
            
            {/* The Winding Path (Dashed Line SVG) - Desktop Only */}
            <div className="hidden md:block absolute top-0 left-0 w-full h-full pointer-events-none z-0">
                <svg className="w-full h-full" viewBox="0 0 1000 800" preserveAspectRatio="none">
                    <path 
                        d="M 500 50 C 500 150, 200 150, 200 250 C 200 350, 800 350, 800 450 C 800 550, 200 550, 200 650 C 200 750, 500 750, 500 800" 
                        fill="none" 
                        stroke="#cbd5e1" 
                        strokeWidth="4" 
                        strokeDasharray="12 12"
                        className="opacity-60"
                    />
                </svg>
            </div>

            {/* Mobile Vertical Line */}
            <div className="md:hidden absolute top-4 bottom-4 left-8 w-1 bg-zinc-200 border-l-2 border-dashed border-zinc-300 z-0"></div>

            <div className="flex flex-col gap-12 md:gap-0">
                {STEPS.map((step, idx) => {
                    const isEven = idx % 2 === 0;
                    return (
                        <div key={step.id} className={`flex flex-col md:flex-row items-center w-full relative z-10 ${isEven ? 'md:justify-start' : 'md:justify-end'}`}>
                            
                            {/* The Card */}
                            <div className={`
                                w-full md:w-[45%] bg-white p-8 rounded-[2rem] shadow-[8px_8px_0px_rgba(0,0,0,0.05)] border-2 ${step.borderColor}
                                transform transition duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-[12px_12px_0px_rgba(0,0,0,0.08)]
                                relative group overflow-visible ${step.rotate}
                            `}>
                                {/* Fake Tape Effect */}
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-8 bg-white/40 backdrop-blur-sm shadow-sm rotate-1 border-l border-r border-white/60"></div>
                                
                                {/* Header: Icon + Number */}
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`size-16 rounded-2xl ${step.color} shadow-lg flex items-center justify-center transform -rotate-6 group-hover:rotate-0 transition-transform duration-300`}>
                                        {step.icon}
                                    </div>
                                    <span className="font-black text-6xl text-zinc-100 select-none absolute top-4 right-6 z-0">
                                        0{step.id}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-bold text-zinc-800 mb-3">{step.title}</h3>
                                    <p className="text-zinc-600 leading-relaxed font-medium">
                                        {step.desc}
                                    </p>
                                </div>

                                {/* Sticker Decoration */}
                                <div className="absolute -bottom-8 -right-8 transform rotate-12 group-hover:scale-110 transition-transform z-20">
                                    {step.sticker}
                                </div>
                            </div>
                            
                            {/* Empty space for the zig-zag on desktop */}
                            <div className="hidden md:block md:w-[10%]"></div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Bottom CTA - Fun Style */}
        <div className="mt-24 text-center relative z-20">
            <div className="inline-block relative group">
                {/* Blobs behind button - Adjusted opacity and size */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-brand-yellow/30 rounded-full blur-2xl group-hover:blur-3xl transition duration-500"></div>
                
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        openContactModal({ source: 'how-it-works' });
                    }}
                    className="relative z-10 flex items-center gap-4 bg-white text-brand-dark px-10 py-6 rounded-full font-black text-xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.15)] hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.25)] transform transition hover:scale-105 active:scale-95 border-4 border-transparent hover:border-brand-yellow text-left"
                >
                    <Sparkle className="size-6 text-brand-yellow" weight="fill" />
                    <span>Quero meu roteiro agora!</span>
                    <div className="size-10 bg-brand-dark rounded-full flex items-center justify-center text-white">
                        <ArrowRight className="size-5" weight="bold" />
                    </div>
                </button>
            </div>
            <p className="mt-6 text-zinc-400 font-medium text-sm">
                (Prometemos: Zero estresse, 100% diversão)
            </p>
        </div>

      </div>

      {/* Cloud Wave Separator for Smooth Transition */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-10">
        <svg className="relative block w-[calc(100%+1.3px)] h-[80px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z" className="fill-brand-light"></path>
        </svg>
      </div>

    </section>
  );
});

HowItWorks.displayName = 'HowItWorks';

export default HowItWorks;
