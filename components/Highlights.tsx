import React, { memo } from 'react';
import { m } from 'framer-motion';
import { LazyImage } from './ui/LazyImage';
import {
  UserCircleCheck,
  Sparkle,
  ClipboardText,
  Compass,
  ShieldCheck,
  ArrowRight,
} from '@phosphor-icons/react';
import { openContactModal } from '../utils/contactForm';

const fadeUp = {
    hidden: { opacity: 0, y: 32 },
    visible: (i: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.1,
            duration: 0.6,
            ease: 'easeOut' as const,
        },
    }),
};

const cardHover = {
    rest: { scale: 1, rotate: 'var(--card-rotate)', y: 0, transition: { type: 'spring', stiffness: 400, damping: 20 } },
    hover: { scale: 1.03, rotate: 0, y: -8, transition: { type: 'spring', stiffness: 400, damping: 20 } },
};

interface HighlightItem {
    icon: React.ElementType;
    title: string;
    description: string;
    bg: string;
    accent: string;
    iconColor: string;
    rotate: string;
}

// Moved outside component to prevent re-allocation on every render
const HIGHLIGHTS: HighlightItem[] = [
    {
        icon: UserCircleCheck,
        title: "Concierge Humano",
        description: "Esqueça os robôs. Fale com gente que entende de gente.",
        bg: "bg-orange-100",
        accent: "border-orange-200",
        iconColor: "text-orange-600",
        rotate: "-rotate-1"
    },
    {
        icon: Sparkle,
        title: "Roteiros à Mão",
        description: "Desenhamos cada dia da viagem do zero, só pra você.",
        bg: "bg-emerald-100",
        accent: "border-emerald-200",
        iconColor: "text-emerald-600",
        rotate: "rotate-2"
    },
    {
        icon: ClipboardText,
        title: "Zero Burocracia",
        description: "Vistos, formulários e chatices? Deixa com a gente.",
        bg: "bg-blue-100",
        accent: "border-blue-200",
        iconColor: "text-blue-600",
        rotate: "-rotate-2"
    },
    {
        icon: Compass,
        title: "Achados Secretos",
        description: "Lugares autênticos que não estão na primeira página do Google.",
        bg: "bg-emerald-100",
        accent: "border-emerald-200",
        iconColor: "text-emerald-600",
        rotate: "rotate-1"
    }
];

const Highlights = memo(() => {
    return (
        <section id="experiencia" className="py-24 bg-[#fffdf5] relative overflow-hidden">

            {/* Dot Pattern Background */}
            <div className="absolute inset-0 z-0 opacity-[0.3]"
                style={{ backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
            </div>

            <div className="container mx-auto px-6 relative z-10">

                <div className="flex flex-col lg:flex-row gap-16 items-start">

                    {/* LEFT COLUMN */}
                    <m.div
                        className="w-full lg:w-5/12 lg:sticky lg:top-32"
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                        custom={0}
                    >
                        {/* Image with Tape Effect */}
                        <div className="relative mb-10 group cursor-pointer">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-8 bg-yellow-100/80 rotate-2 backdrop-blur-sm z-20 shadow-sm border-l border-r border-white/50"></div>
                            <m.div
                                className="relative rounded-2xl overflow-hidden border-8 border-white shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
                                initial={{ rotate: -3 }}
                                whileHover={{ rotate: 0, scale: 1.02, boxShadow: '0 24px 50px rgba(0,0,0,0.15)' }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            >
                                <LazyImage
                                    src="images/highlights/experiencia-caribe.jpg"
                                    alt="Família em praia paradisíaca com areia branca e água turquesa — pacote de viagem personalizado da Anhangá Viagens, agência em São Paulo"
                                    width={800}
                                    height={600}
                                    className="w-full object-cover aspect-[4/3]"
                                />
                                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-4 py-1 rounded-full text-xs font-bold text-zinc-700 shadow-sm transition-transform duration-300 group-hover:scale-110">
                                    📍 Caribe? Talvez.
                                </div>
                            </m.div>
                        </div>

                        <div className="bg-white p-8 rounded-[2rem] border-2 border-zinc-100 shadow-[8px_8px_0px_rgba(0,0,0,0.05)] text-center lg:text-left">
                            {/* Changed h4 to p to maintain correct heading hierarchy and avoid SEO audit findings. */}
                            <p className="font-black text-2xl text-zinc-900 mb-2">Viaje Leve! 🎈</p>
                            <p className="text-zinc-500 text-lg mb-6 leading-relaxed">
                                Comece a planejar agora e receba um roteiro prévio sem compromisso.
                            </p>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    openContactModal({ source: 'highlights' });
                                }}
                                className="flex items-center justify-center gap-3 w-full bg-brand-dark text-white px-6 py-4 rounded-xl font-bold transition-all duration-300 ease-spring shadow-[4px_4px_0px_#94a3b8] hover:shadow-[2px_2px_0px_#94a3b8] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                            >
                                <ShieldCheck className="size-5" weight="fill" />
                                <span>Falar com Especialista</span>
                            </button>
                        </div>
                    </m.div>

                    {/* RIGHT COLUMN */}
                    <div className="w-full lg:w-7/12">
                        <m.div
                            className="mb-12"
                            variants={fadeUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.2 }}
                            custom={1}
                        >
                            <div className="inline-block relative mb-4">
                                <span className="absolute inset-0 bg-anhanga-blue/10 transform -skew-x-12 rounded-lg"></span>
                                <span className="relative px-3 py-1 text-anhanga-blue font-black uppercase tracking-widest text-sm flex items-center gap-2">
                                    <Sparkle className="size-4" weight="fill" /> O Jeito Anhangá
                                </span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-brand-dark leading-tight mb-6">
                                Não existe roteiro certo <br />
                                <span className="text-anhanga-blue">
                                    para o viajante errado.
                                </span>
                            </h2>
                            <p className="text-zinc-600 text-lg md:text-xl font-medium leading-relaxed mb-8">
                                A <strong>Anhangá</strong> é uma agência de viagens em São Paulo. Não trabalhamos com pacote pronto. Ouvimos o que você quer, pesquisamos o que faz sentido pra você e montamos cada detalhe do roteiro. Do primeiro voo ao último café da manhã, você não está sozinho.
                            </p>
                        </m.div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {HIGHLIGHTS.map((item, idx) => {
                                const Icon = item.icon;
                                const rotateVal = parseInt(item.rotate.replace('rotate-', ''), 10) || 0;
                                return (
                                    <m.div
                                        key={item.title}
                                        className={`group relative p-8 rounded-[2.5rem] bg-white border-[3px] ${item.accent} shadow-[8px_8px_0px_rgba(0,0,0,0.05)] flex flex-col h-full overflow-visible`}
                                        variants={fadeUp}
                                        initial="hidden"
                                        whileInView="visible"
                                        viewport={{ once: true, amount: 0.1 }}
                                        custom={idx + 2}
                                        whileHover={{
                                            scale: 1.03,
                                            rotate: 0,
                                            y: -8,
                                            boxShadow: '14px 14px 0px rgba(0,0,0,0.05)',
                                            zIndex: 10,
                                            transition: { type: 'spring', stiffness: 350, damping: 18 }
                                        }}
                                        style={{ rotate: `${rotateVal}deg` }}
                                    >
                                        {/* Washi Tape */}
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-yellow-50/90 backdrop-blur-sm border-l-2 border-r-2 border-white/40 rotate-1 shadow-sm z-20 opacity-90"></div>

                                        {/* Icon Badge */}
                                        <m.div
                                            className={`size-16 rounded-2xl ${item.bg} border-2 ${item.accent} flex items-center justify-center mb-6 shadow-sm`}
                                            whileHover={{ scale: 1.1, rotate: 6, transition: { type: 'spring', stiffness: 400, damping: 15 } }}
                                        >
                                            <Icon className={`size-8 ${item.iconColor}`} weight="fill" />
                                        </m.div>

                                        {/* Content */}
                                        <h3 className="text-xl font-extrabold text-zinc-900 mb-3 leading-tight group-hover:text-brand-cyan transition-colors duration-300">
                                            {item.title}
                                        </h3>
                                        <p className="text-zinc-500 font-medium leading-relaxed text-sm md:text-base">
                                            {item.description}
                                        </p>

                                        {/* Corner Arrow */}
                                        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                                            <ArrowRight className={`size-5 ${item.iconColor}`} />
                                        </div>
                                    </m.div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
});

Highlights.displayName = 'Highlights';

export default Highlights;
