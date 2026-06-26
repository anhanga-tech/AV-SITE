import { m } from 'framer-motion';
import { ChatCircleText, MapTrifold, AirplaneTilt, ArrowRight } from '@phosphor-icons/react';
import { fadeUp } from './constants';

const STEPS = [
    {
        number: '01',
        Icon: ChatCircleText,
        title: 'Você nos conta o que precisa',
        description: 'Incentivo, confraternização, evento ou viagem a trabalho. Basta mandar uma mensagem. Seu consultor entende o contexto e já começa a pensar na melhor solução.',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        numberColor: 'text-blue-200',
        border: 'border-blue-200',
    },
    {
        number: '02',
        Icon: MapTrifold,
        title: 'Montamos o roteiro do zero',
        description: 'Seu consultor dedicado elabora uma proposta completa: destino, hospedagem, transfer, seguro e tudo mais. Você avalia, ajusta e aprova.',
        iconBg: 'bg-sky-100',
        iconColor: 'text-sky-600',
        numberColor: 'text-sky-200',
        border: 'border-sky-200',
    },
    {
        number: '03',
        Icon: AirplaneTilt,
        title: 'Você só embarca',
        description: 'Toda a burocracia fica com a gente. Faturamento no CNPJ, condições para grupo e atendimento durante a viagem. Você cuida da empresa, a gente cuida de tudo mais.',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        numberColor: 'text-amber-200',
        border: 'border-amber-200',
    },
] as const;

export function CorpProcess() {
    return (
        <section className="py-24 bg-white relative overflow-hidden">
            <div
                className="absolute inset-0 opacity-[0.35]"
                style={{ backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            />

            <div className="container mx-auto px-6 relative z-10">
                <m.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    custom={0}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-black text-brand-dark leading-tight">
                        Como funciona em <br />
                        <span className="text-brand-cyan">3 passos</span>
                    </h2>
                    <p className="mt-4 text-zinc-500 font-medium text-lg max-w-xl mx-auto">
                        Da primeira mensagem ao embarque, a gente cuida de tudo.
                    </p>
                </m.div>

                <div className="relative max-w-5xl mx-auto">
                    {/* Connector line (desktop only) */}
                    <div
                        aria-hidden="true"
                        className="hidden md:block absolute top-16 left-[16.67%] right-[16.67%] h-px border-t-2 border-dashed border-zinc-200 z-0"
                    />

                    <div className="grid md:grid-cols-3 gap-8 relative z-10">
                        {STEPS.map((step, idx) => (
                            <m.div
                                key={step.number}
                                variants={fadeUp}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.1 }}
                                custom={idx + 1}
                                className="flex flex-col items-center text-center"
                            >
                                {/* Icon circle with number badge */}
                                <div className="relative mb-8">
                                    <div className={`size-[4.5rem] rounded-2xl ${step.iconBg} border-2 ${step.border} flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,0.04)]`}>
                                        <step.Icon className={`size-8 ${step.iconColor}`} weight="fill" />
                                    </div>
                                    <span className={`absolute -top-3 -right-3 size-7 rounded-full bg-white border-2 ${step.border} flex items-center justify-center text-xs font-black ${step.iconColor} shadow-sm`}>
                                        {step.number}
                                    </span>
                                </div>

                                <h3 className="text-lg font-extrabold text-zinc-900 leading-snug mb-3">
                                    {step.title}
                                </h3>
                                <p className="text-zinc-500 font-medium leading-relaxed text-sm max-w-xs">
                                    {step.description}
                                </p>

                                {/* Arrow between steps (mobile only) */}
                                {idx < STEPS.length - 1 && (
                                    <ArrowRight
                                        aria-hidden="true"
                                        className="md:hidden size-6 text-zinc-300 mt-6 rotate-90"
                                        weight="bold"
                                    />
                                )}
                            </m.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
