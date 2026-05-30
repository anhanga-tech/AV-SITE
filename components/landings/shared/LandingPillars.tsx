import { m } from 'framer-motion';
import { Sparkle, ArrowRight } from '@phosphor-icons/react';
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

export function LandingPillars({ heading, pillars }: LandingPillarsProps) {
    return (
        <section className="py-24 bg-brand-surface relative overflow-hidden">

            <div
                className="absolute inset-0 z-0 opacity-[0.3]"
                style={{ backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}
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
                    <div className="inline-block relative mb-4">
                        <span className="absolute inset-0 bg-blue-100 transform -skew-x-12 rounded-lg" />
                        <span className="relative px-3 py-1 text-blue-600 font-black uppercase tracking-widest text-sm flex items-center gap-2">
                            <Sparkle className="size-4" weight="fill" /> O Jeito Anhangá
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-brand-dark leading-tight">
                        {heading}
                    </h2>
                </m.div>

                <div className="grid md:grid-cols-3 gap-8">
                    {pillars.map((item, idx) => {
                        const Icon = item.icon;

                        return (
                            <m.div
                                key={item.title}
                                className={`relative p-8 rounded-[2.5rem] bg-white border-[3px] ${item.accent} shadow-[8px_8px_0px_rgba(0,0,0,0.05)] flex flex-col h-full group`}
                                variants={fadeUp}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.1 }}
                                custom={idx + 1}
                                whileHover={{
                                    scale: 1.03,
                                    rotate: 0,
                                    y: -8,
                                    boxShadow: '14px 14px 0px rgba(0,0,0,0.05)',
                                    zIndex: 10,
                                    transition: { type: 'spring', stiffness: 350, damping: 18 },
                                }}
                                style={{ rotate: item.rotateDeg }}
                            >
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-yellow-50/90 backdrop-blur-sm border-l-2 border-r-2 border-white/40 rotate-1 shadow-sm z-20 opacity-90" />

                                <m.div
                                    className={`size-16 rounded-2xl ${item.bg} border-2 ${item.accent} flex items-center justify-center mb-6 shadow-sm`}
                                    whileHover={{ scale: 1.1, rotate: 6, transition: { type: 'spring', stiffness: 400, damping: 15 } }}
                                >
                                    <Icon className={`size-8 ${item.iconColor}`} weight="fill" />
                                </m.div>

                                <h3 className="text-xl font-extrabold text-zinc-900 mb-3 leading-tight group-hover:text-brand-cyan transition-colors duration-300">
                                    {item.title}
                                </h3>
                                <p className="text-zinc-500 font-medium leading-relaxed text-sm">
                                    {item.description}
                                </p>

                                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition duration-300 translate-x-4 group-hover:translate-x-0">
                                    <ArrowRight className={`size-5 ${item.iconColor}`} />
                                </div>
                            </m.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
