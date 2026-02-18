import React from 'react';
import { getWhatsAppLink } from '../utils/whatsapp';
import { LazyImage } from './ui/LazyImage';
import UserCheck from 'lucide-react/dist/esm/icons/user-check';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import FileCheck from 'lucide-react/dist/esm/icons/file-check';
import Compass from 'lucide-react/dist/esm/icons/compass';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';

interface HighlightItem {
    icon: React.ElementType;
    title: string;
    description: string;
    bg: string;
    accent: string;
    iconColor: string;
    rotate: string;
}

const Highlights: React.FC = () => {

    const highlights: HighlightItem[] = [
        {
            icon: UserCheck,
            title: "Concierge Humano",
            description: "Esqueça os robôs. Fale com gente que entende de gente.",
            bg: "bg-orange-100",
            accent: "border-orange-200",
            iconColor: "text-orange-600",
            rotate: "-rotate-1"
        },
        {
            icon: Sparkles,
            title: "Roteiros à Mão",
            description: "Desenhamos cada dia da viagem do zero, só pra você.",
            bg: "bg-emerald-100",
            accent: "border-emerald-200",
            iconColor: "text-emerald-600",
            rotate: "rotate-2"
        },
        {
            icon: FileCheck,
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

    return (
        <section id="experiencia" className="py-24 bg-[#fffdf5] relative overflow-hidden">

            {/* Dot Pattern Background */}
            <div className="absolute inset-0 z-0 opacity-[0.3]"
                style={{ backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
            </div>

            <div className="container mx-auto px-6 relative z-10">

                <div className="flex flex-col lg:flex-row gap-16 items-start">

                    {/* LEFT COLUMN: Sticky Content - Entrance Animation */}
                    <div className="w-full lg:w-5/12 lg:sticky lg:top-32 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>

                        {/* Visual Image with Tape Effect & Smoother Hover */}
                        <div className="relative mb-10 group cursor-pointer perspective-1000">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-8 bg-yellow-100/80 rotate-2 backdrop-blur-sm z-20 shadow-sm border-l border-r border-white/50"></div>
                            <div className="relative rounded-2xl overflow-hidden border-8 border-white shadow-[0_10px_30px_rgba(0,0,0,0.1)] rotate-[-3deg] transition-all duration-700 ease-spring group-hover:rotate-0 group-hover:scale-[1.02] group-hover:shadow-2xl">
                                <LazyImage
                                    src="https://images.pexels.com/photos/1450372/pexels-photo-1450372.jpeg"
                                    alt="Praia"
                                    width={800}
                                    className="w-full object-cover aspect-[4/3] transition-transform duration-1000 group-hover:scale-110"
                                />
                                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-4 py-1 rounded-full text-xs font-bold text-gray-700 shadow-sm transition-transform duration-300 group-hover:scale-110">
                                    📍 Caribe? Talvez.
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2rem] border-2 border-gray-100 shadow-[8px_8px_0px_rgba(0,0,0,0.05)] text-center lg:text-left transition-transform duration-300 hover:translate-y-[-2px]">
                            <h4 className="font-black text-2xl text-gray-900 mb-2">Viaje Leve! 🎈</h4>
                            <p className="text-gray-500 text-lg mb-6 leading-relaxed">
                                Comece a planejar agora e receba um roteiro prévio sem compromisso.
                            </p>
                            <a
                                href={getWhatsAppLink("Olá! Quero conhecer a experiência Anhangá.")}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-3 w-full bg-brand-dark text-white px-6 py-4 rounded-xl font-bold transition-all duration-300 ease-spring shadow-[4px_4px_0px_#94a3b8] hover:shadow-[2px_2px_0px_#94a3b8] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                            >
                                <ShieldCheck className="w-5 h-5" />
                                <span>Falar com Especialista</span>
                            </a>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Grid Cards */}
                    <div className="w-full lg:w-7/12">
                        <div className="mb-12 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                            <div className="inline-block relative mb-4">
                                <span className="absolute inset-0 bg-blue-100 transform -skew-x-12 rounded-lg"></span>
                                <span className="relative px-3 py-1 text-blue-600 font-black uppercase tracking-widest text-sm flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" /> O Jeito Anhangá
                                </span>
                            </div>
                            <h2 className="text-4xl md:text-6xl font-black text-brand-dark leading-none">
                                A gente cuida <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-blue-500">
                                    do "chato"
                                </span>
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {highlights.map((item, idx) => {
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={idx}
                                        className={`
                                    group relative p-8 rounded-[2.5rem] bg-white border-[3px] ${item.accent}
                                    shadow-[8px_8px_0px_rgba(0,0,0,0.05)] hover:shadow-[14px_14px_0px_rgba(0,0,0,0.05)] 
                                    transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
                                    ${item.rotate} hover:rotate-0 hover:scale-[1.03] hover:-translate-y-2 hover:z-10
                                    flex flex-col h-full overflow-visible
                                    opacity-0 animate-fade-in-up
                                `}
                                        style={{ animationDelay: `${0.4 + (idx * 0.1)}s` }}
                                    >
                                        {/* Washi Tape Effect */}
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-yellow-50/90 backdrop-blur-sm border-l-2 border-r-2 border-white/40 rotate-1 shadow-sm z-20 opacity-90"></div>

                                        {/* Icon Badge */}
                                        <div className={`
                                    w-16 h-16 rounded-2xl ${item.bg} border-2 ${item.accent}
                                    flex items-center justify-center mb-6 
                                    shadow-sm transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6
                                `}>
                                            <Icon className={`w-8 h-8 ${item.iconColor}`} strokeWidth={2.5} />
                                        </div>

                                        {/* Content */}
                                        <h3 className="text-xl font-extrabold text-gray-900 mb-3 leading-tight group-hover:text-brand-cyan transition-colors duration-300">
                                            {item.title}
                                        </h3>
                                        <p className="text-gray-500 font-medium leading-relaxed text-sm md:text-base">
                                            {item.description}
                                        </p>

                                        {/* Corner Decoration */}
                                        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
                                            <ArrowRight className={`w-5 h-5 ${item.iconColor}`} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default Highlights;