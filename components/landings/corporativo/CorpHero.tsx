import { Suspense } from 'react';
import { m } from 'framer-motion';
import { AirplaneTilt, ArrowRight, WhatsappLogo, Buildings, UsersThree, UserCircle } from '@phosphor-icons/react';
import { openContactModal } from '@/utils/contactForm';
import { CorpGlobe } from './CorpGlobe';
import { fadeUp } from './constants';

const BADGES = [
    { Icon: AirplaneTilt, text: 'Roteiro do Zero'  },
    { Icon: UserCircle,   text: 'Consultor Só Seu' },
    { Icon: Buildings,    text: 'Faturamento PJ'   },
    { Icon: UsersThree,   text: 'Grupos e Eventos' },
] as const;

export function CorpHero() {
    return (
        <section className="relative w-full min-h-[100svh] md:min-h-[720px] flex items-center overflow-hidden">

            {/* Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#001836] via-[#003B8E] to-[#0056D2]" />
                <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                    }}
                />
                <div
                    className="hidden md:block absolute inset-0 opacity-20"
                    style={{ backgroundImage: "url('/noise.png')" }}
                />
            </div>

            {/* Globe — ~1/3 da viewport visível, borda esquerda fundida via mask */}
            <div
                aria-hidden="true"
                className="hidden lg:block absolute z-[5] pointer-events-none"
                style={{
                    right: '-480px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '1200px',
                    height: '1200px',
                    WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 26%, black 100%)',
                    maskImage: 'linear-gradient(to right, transparent 0%, black 26%, black 100%)',
                }}
            >
                <Suspense fallback={null}>
                    <CorpGlobe />
                </Suspense>
            </div>

            {/* Content */}
            <div className="container mx-auto px-6 relative z-10 pt-20 pb-20">
                <div className="flex flex-col items-center text-center lg:items-start lg:text-left max-w-xl">

                    <m.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={0}
                        className="inline-block relative mb-6"
                    >
                        <span className="absolute inset-0 bg-white/10 border border-white/15 transform -skew-x-12 rounded-lg" />
                        <span className="relative px-4 py-1.5 text-white font-black uppercase tracking-widest text-xs flex items-center gap-2">
                            <AirplaneTilt className="size-4 text-brand-yellow" weight="fill" />
                            Viagens para Empresas
                        </span>
                    </m.div>

                    <m.h1
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={1}
                        className="font-sans font-extrabold text-white leading-[0.95] tracking-tight drop-shadow-lg text-5xl sm:text-6xl xl:text-7xl mb-5 text-balance"
                    >
                        A viagem da sua equipe <br />
                        <span className="text-yellow-300">começa aqui.</span>
                    </m.h1>

                    <m.p
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={2}
                        className="text-white/90 text-lg md:text-xl max-w-lg mb-8 font-medium leading-relaxed drop-shadow-md"
                    >
                        Incentivo, confraternização, evento ou viagem a trabalho.
                        A gente monta o roteiro do zero, você só embarca.
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
                            onClick={() => openContactModal({ source: 'corporativo' })}
                            className="btn-whatsapp btn-specialist flex items-center justify-center gap-3 bg-brand-yellow text-brand-dark px-8 py-4 rounded-2xl font-bold text-lg shadow-[4px_4px_0px_rgba(0,0,0,0.2)] hover:shadow-[2px_2px_0px_rgba(0,0,0,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition"
                            data-contact-intent
                            data-tracking="hero-corporativo"
                        >
                            <WhatsappLogo className="size-6" weight="fill" />
                            Falar no WhatsApp
                        </button>
                        <a
                            href="#contato"
                            className="btn-specialist flex items-center justify-center gap-2 border-2 border-white/40 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:border-white hover:bg-white/10 transition duration-200"
                        >
                            Prefiro ser contatado
                            <ArrowRight className="size-5" />
                        </a>
                    </m.div>

                    <m.div
                        className="mt-8 flex flex-wrap justify-center lg:justify-start gap-3"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: {},
                            visible: { transition: { staggerChildren: 0.1, delayChildren: 0.5 } },
                        }}
                    >
                        {BADGES.map(({ Icon, text }) => (
                            <m.div
                                key={text}
                                variants={{
                                    hidden: { opacity: 0, y: 16, scale: 0.9 },
                                    visible: {
                                        opacity: 1, y: 0, scale: 1,
                                        transition: { type: 'spring', stiffness: 400, damping: 20 },
                                    },
                                }}
                                className="flex items-center gap-2 text-white/85 font-semibold text-sm bg-white/[0.08] px-4 py-2 rounded-full backdrop-blur-md border border-white/[0.15] hover:bg-white/[0.15] hover:text-white hover:border-white/30 transition duration-300 cursor-default"
                            >
                                <Icon className="size-4 shrink-0" weight="fill" />
                                {text}
                            </m.div>
                        ))}
                    </m.div>
                </div>
            </div>

            {/* Wave transition */}
            <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none rotate-180 z-10">
                <svg className="relative block w-[calc(100%+1.3px)] h-[60px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path
                        d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                        className="fill-brand-surface"
                    />
                </svg>
            </div>
        </section>
    );
}
