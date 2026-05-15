import { m } from 'framer-motion';
import { AirplaneTilt, ArrowRight, WhatsappLogo } from '@phosphor-icons/react';
import { openContactModal } from '../../../utils/contactForm';
import { fadeUp } from './constants';

export function BpdHero() {
    return (
        <section className="relative w-full min-h-[100svh] md:min-h-[720px] flex items-center overflow-hidden">

            {/* Background gradient — same language as main Hero */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/85 to-blue-900/75" />
                {/* Noise texture (same as main Hero) */}
                <div
                    className="hidden md:block absolute inset-0 opacity-20"
                    style={{ backgroundImage: "url('/noise.png')" }}
                />
            </div>

            {/* Decorative blobs */}
            <div
                aria-hidden="true"
                className="absolute top-0 right-0 size-[500px] rounded-full bg-blue-500/20 blur-3xl animate-blob"
            />
            <div
                aria-hidden="true"
                className="absolute bottom-0 left-0 size-96 rounded-full bg-brand-yellow/10 blur-3xl animate-blob"
                style={{ animationDelay: '4s' }}
            />

            <div className="container mx-auto px-6 relative z-10 pt-20 pb-24">
                <div className="flex flex-col items-center text-center">

                    {/* Event badge — skewed like Highlights badge */}
                    <m.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={0}
                        className="inline-block relative mb-6"
                    >
                        <span className="absolute inset-0 bg-brand-yellow/30 transform -skew-x-12 rounded-lg" />
                        <span className="relative px-4 py-1.5 text-white font-black uppercase tracking-widest text-xs flex items-center gap-2">
                            <AirplaneTilt className="size-4" weight="fill" />
                            Brazil Promotion Day 2026
                        </span>
                    </m.div>

                    <m.h1
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={1}
                        className="font-sans font-extrabold text-white leading-[0.9] tracking-tight drop-shadow-lg text-5xl sm:text-6xl md:text-8xl mb-6"
                    >
                        Sua equipe <br />
                        <span className="text-yellow-300">
                            Viaja bem.
                        </span>
                    </m.h1>

                    <m.p
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={2}
                        className="text-white/90 text-xl md:text-2xl max-w-2xl mx-auto mb-10 font-medium leading-relaxed drop-shadow-md"
                    >
                        Roteiros exclusivos feitos do zero. Sem pacote pronto,
                        sem estresse. Só a sua viagem.
                    </m.p>

                    <m.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={3}
                        className="flex flex-col sm:flex-row gap-4"
                    >
                        <button
                            type="button"
                            onClick={() => openContactModal({ source: 'brazil-promotion-day' })}
                            className="btn-whatsapp btn-specialist flex items-center justify-center gap-3 bg-brand-yellow text-brand-dark px-8 py-4 rounded-2xl font-bold text-lg shadow-[4px_4px_0px_rgba(0,0,0,0.2)] hover:shadow-[2px_2px_0px_rgba(0,0,0,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition"
                            data-contact-intent
                            data-tracking="hero-brazil-promotion-day"
                        >
                            <WhatsappLogo className="size-6" weight="fill" />
                            Falar com a gente agora
                        </button>
                        <a
                            href="#contato"
                            className="btn-specialist flex items-center justify-center gap-2 border-2 border-white/40 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:border-white hover:bg-white/10 transition duration-200"
                        >
                            Prefiro ser contatado
                            <ArrowRight className="size-5" />
                        </a>
                    </m.div>

                    {/* Quick feature pills — identical pattern to main Hero */}
                    <m.div
                        className="mt-10 flex flex-wrap justify-center gap-4"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: {},
                            visible: { transition: { staggerChildren: 0.1, delayChildren: 0.5 } },
                        }}
                    >
                        {[
                            { icon: '✈️', text: 'Roteiro Personalizado' },
                            { icon: '🤝', text: 'Atendimento Humano' },
                            { icon: '🌎', text: 'Viagem Sob Medida' },
                            { icon: '💛', text: 'Sem Pacote Pronto' },
                        ].map((feat) => (
                            <m.div
                                key={feat.text}
                                variants={{
                                    hidden: { opacity: 0, y: 16, scale: 0.9 },
                                    visible: {
                                        opacity: 1, y: 0, scale: 1,
                                        transition: { type: 'spring', stiffness: 400, damping: 20 },
                                    },
                                }}
                                className="flex items-center gap-2 text-white/90 font-bold text-sm bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 hover:bg-white/20 transition duration-300 cursor-default"
                            >
                                <span>{feat.icon}</span>
                                {feat.text}
                            </m.div>
                        ))}
                    </m.div>
                </div>
            </div>

            {/* Wavy bottom separator — exact pattern from main Hero */}
            <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none rotate-180">
                <svg className="relative block w-[calc(100%+1.3px)] h-[60px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path
                        d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                        fill="#fffdf5"
                    />
                </svg>
            </div>
        </section>
    );
}
