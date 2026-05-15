import React from 'react';
import { AirplaneTilt } from '@phosphor-icons/react';
import { CtaTicketStub } from './cta/CtaTicketStub';
import { CtaBody } from './cta/CtaBody';

const CallToActionComponent: React.FC = () => {
    return (
        <section id="contato" className="py-24 bg-brand-light relative overflow-hidden">

            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-10 left-10 text-9xl opacity-[0.03] rotate-12 font-black text-brand-dark">TRAVEL</div>
                <div className="absolute bottom-10 right-10 text-9xl opacity-[0.03] -rotate-12 font-black text-brand-dark">FLY</div>
            </div>

            <div className="container mx-auto px-6 relative z-10">

                {/* TICKET CONTAINER */}
                <div className="max-w-5xl mx-auto bg-white rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] overflow-hidden relative flex flex-col md:flex-row min-h-[500px] md:min-h-[420px]">

                    {/* --- LEFT SIDE: Main Info --- */}
                    <div className="w-full md:w-[70%] p-8 md:p-12 relative flex flex-col justify-between">

                        {/* Header Strip */}
                        <div className="flex justify-between items-center mb-8 border-b-2 border-dashed border-gray-100 pb-4">
                            <div className="flex items-center gap-2 text-brand-cyan font-black tracking-widest text-sm uppercase" title="Estilo Boarding Pass">
                                <AirplaneTilt className="size-5" weight="fill" /> Anhangá Airlines
                                <span className="text-[10px] opacity-40 ml-1 hidden lg:inline">(Boarding Pass)</span>
                            </div>
                            <div className="text-gray-400 font-bold text-xs uppercase">First Class Experience</div>
                        </div>

                        <CtaBody />

                        {/* Top "Hole" for perforation illusion */}
                        <div className="hidden md:block absolute -right-4 top-[-1.5rem] size-8 bg-brand-light rounded-full z-20"></div>
                        {/* Bottom "Hole" for perforation illusion */}
                        <div className="hidden md:block absolute -right-4 bottom-[-1.5rem] size-8 bg-brand-light rounded-full z-20"></div>
                    </div>

                    {/* --- DIVIDER (Perforation) --- */}
                    <div className="relative w-full h-8 md:w-8 md:h-auto flex items-center justify-center">
                        {/* The Dashed Line */}
                        <div className="w-full h-[2px] md:w-[2px] md:h-[90%] border-t-2 md:border-t-0 md:border-l-2 border-dashed border-gray-300"></div>

                        {/* Mobile Holes (Left/Right) */}
                        <div className="md:hidden absolute -left-4 top-1/2 -translate-y-1/2 size-8 bg-brand-light rounded-full z-20"></div>
                        <div className="md:hidden absolute -right-4 top-1/2 -translate-y-1/2 size-8 bg-brand-light rounded-full z-20"></div>
                    </div>

                    {/* --- RIGHT SIDE: Stub / Details --- */}
                    <CtaTicketStub />

                </div>
            </div>
        </section>
    );
};

const CallToAction = React.memo(CallToActionComponent);
CallToAction.displayName = 'CallToAction';

export default CallToAction;
