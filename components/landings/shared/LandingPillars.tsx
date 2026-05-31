import { m } from 'framer-motion';
import { Sparkle } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { fadeUp } from './constants';

export interface PillarItem {
    icon: Icon;
    title: string;
    description: string;
    bg: string;
    accent: string;
    iconColor: string;
    rotateDeg: number;
}

interface LandingPillarsProps {
    heading: React.ReactNode;
    pillars: PillarItem[];
}

const TAPE_COLORS = ['bg-brand-yellow/80', 'bg-sky-100/90', 'bg-emerald-100/90'];

export function LandingPillars({ heading, pillars }: LandingPillarsProps) {
    return (
        <section className="py-24 bg-brand-surface relative overflow-hidden">

            <div
                className="absolute inset-0 z-0 opacity-[0.25]"
                style={{ backgroundImage: 'radial-gradient(#94a3b8 1.5px, transparent 1.5px)', backgroundSize: '28px 28px' }}
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
                    <div className="inline-block relative mb-5">
                        <span className="absolute inset-0 bg-brand-yellow/30 transform -skew-x-12 rounded-lg" />
                        <span className="relative px-4 py-1.5 text-brand-dark font-black uppercase tracking-widest text-xs flex items-center gap-2">
                            <Sparkle className="size-4" weight="fill" /> O Jeito Anhangá
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-brand-dark leading-tight">
                        {heading}
                    </h2>
                </m.div>

                <div className="grid md:grid-cols-3 gap-10 md:gap-8">
                    {pillars.map((item, idx) => {
                        const Icon = item.icon;
                        const ordinal = String(idx + 1).padStart(2, '0');

                        return (
                            <m.div
                                key={item.title}
                                className={`relative p-8 rounded-[2.5rem] bg-white border-[3px] ${item.accent} shadow-[8px_8px_0px_rgba(0,0,0,0.04)] flex flex-col h-full group`}
                                variants={fadeUp}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.1 }}
                                custom={idx + 1}
                                whileHover={{
                                    scale: 1.03,
                                    rotate: 0,
                                    y: -10,
                                    boxShadow: '12px 12px 0px rgba(0,0,0,0.06)',
                                    zIndex: 10,
                                    transition: { type: 'spring', stiffness: 350, damping: 18 },
                                }}
                                style={{ rotate: item.rotateDeg }}
                            >
                                {/* Tape */}
                                <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 w-20 h-6 ${TAPE_COLORS[idx % TAPE_COLORS.length]} backdrop-blur-sm border-l border-r border-white/50 rotate-1 shadow-sm z-20`} />

                                {/* Ordinal number */}
                                <span className="absolute top-6 right-7 text-5xl font-black leading-none select-none pointer-events-none text-zinc-100 group-hover:text-zinc-150 transition-colors duration-300">
                                    {ordinal}
                                </span>

                                <m.div
                                    className={`size-14 rounded-2xl ${item.bg} border-2 ${item.accent} flex items-center justify-center mb-6 shadow-sm`}
                                    whileHover={{ scale: 1.12, rotate: 8, transition: { type: 'spring', stiffness: 400, damping: 14 } }}
                                >
                                    <Icon className={`size-7 ${item.iconColor}`} weight="fill" />
                                </m.div>

                                <h3 className="text-xl font-extrabold text-zinc-900 mb-3 leading-tight group-hover:text-brand-cyan transition-colors duration-300 pr-10">
                                    {item.title}
                                </h3>
                                <p className="text-zinc-500 font-medium leading-relaxed text-sm">
                                    {item.description}
                                </p>
                            </m.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
