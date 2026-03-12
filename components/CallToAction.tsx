import React from 'react';
import {
    ChatCentered,
    AirplaneTilt,
    DeviceMobile,
} from '@phosphor-icons/react';
import { openAiChat } from '../utils/aiChat';

const CallToAction: React.FC = () => {

    const handleCTAClick = (e: React.MouseEvent) => {
        e.preventDefault();
        openAiChat({
            message: 'Olá! Gostaria de fazer meu check-in e solicitar um orçamento personalizado.'
        });
    };

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
                            <div className="flex items-center gap-2 text-brand-cyan font-black tracking-widest text-sm uppercase">
                                <AirplaneTilt className="w-5 h-5" weight="fill" /> Anhangá Airlines
                            </div>
                            <div className="text-gray-400 font-bold text-xs uppercase">First Class Experience</div>
                        </div>

                        {/* Main Content */}
                        <div className="mb-8">
                            <h2 className="text-4xl md:text-5xl font-black text-brand-dark mb-4 leading-tight">
                                Sua próxima parada: <br />
                                <span className="text-brand-vibrant">O Inesquecível.</span>
                            </h2>
                            <p className="text-gray-500 font-medium text-lg max-w-md">
                                O orçamento é gratuito, o roteiro é exclusivo e as memórias são para sempre.
                            </p>
                        </div>

                        {/* Footer / CTA */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                            <button
                                onClick={handleCTAClick}
                                className="btn-whatsapp btn-specialist flex items-center gap-3 bg-brand-dark text-white text-lg font-bold px-8 py-4 rounded-xl shadow-[4px_4px_0px_#fbbf24] hover:shadow-[2px_2px_0px_#fbbf24] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                                data-tracking="cta-home-footer"
                            >
                                <span>Solicitar Orçamento Personalizado</span>
                                <ChatCentered className="w-5 h-5" weight="fill" />
                            </button>
                        </div>

                        {/* Top "Hole" for perforation illusion */}
                        <div className="hidden md:block absolute -right-4 top-[-1.5rem] w-8 h-8 bg-brand-light rounded-full z-20"></div>
                        {/* Bottom "Hole" for perforation illusion */}
                        <div className="hidden md:block absolute -right-4 bottom-[-1.5rem] w-8 h-8 bg-brand-light rounded-full z-20"></div>
                    </div>

                    {/* --- DIVIDER (Perforation) --- */}
                    <div className="relative w-full h-8 md:w-8 md:h-auto flex items-center justify-center">
                        {/* The Dashed Line */}
                        <div className="w-full h-[2px] md:w-[2px] md:h-[90%] border-t-2 md:border-t-0 md:border-l-2 border-dashed border-gray-300"></div>

                        {/* Mobile Holes (Left/Right) */}
                        <div className="md:hidden absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-brand-light rounded-full z-20"></div>
                        <div className="md:hidden absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-brand-light rounded-full z-20"></div>
                    </div>

                    {/* --- RIGHT SIDE: Stub / Details --- */}
                    <div className="w-full md:w-[30%] bg-gray-50 p-6 flex flex-col relative">

                        {/* Stub Header */}
                        <div className="flex justify-between items-center mb-5 opacity-60">
                            <span className="text-[10px] font-bold tracking-widest uppercase">Anhangá Air</span>
                            <AirplaneTilt className="w-3 h-3" weight="fill" />
                        </div>

                        {/* Passenger Name */}
                        <div className="mb-4">
                            <label className="block text-[9px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">Passenger Name</label>
                            <span className="block text-lg font-black text-brand-dark truncate">VOCÊ / VIP</span>
                        </div>

                        {/* Flight Details Grid */}
                        <div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-4 border-b-2 border-dashed border-gray-200 pb-4">
                            <div>
                                <label className="block text-[9px] uppercase font-bold text-gray-400 tracking-wider">Flight</label>
                                <span className="block text-sm font-bold font-mono text-gray-800">ANH 777</span>
                            </div>
                            <div>
                                <label className="block text-[9px] uppercase font-bold text-gray-400 tracking-wider">Date</label>
                                <span className="block text-sm font-bold font-mono text-gray-800">HOJE</span>
                            </div>
                            <div>
                                <label className="block text-[9px] uppercase font-bold text-gray-400 tracking-wider">From</label>
                                <span className="block text-base font-black text-gray-800">GRU</span>
                            </div>
                            <div>
                                <label className="block text-[9px] uppercase font-bold text-gray-400 tracking-wider">To</label>
                                <span className="block text-base font-black text-brand-vibrant">MUNDO</span>
                            </div>
                        </div>

                        {/* Critical Boarding Info (Boxed) */}
                        <div className="bg-white rounded-xl border-2 border-gray-100 p-2 flex justify-between items-center shadow-sm mb-4">
                            <div className="text-center flex-1">
                                <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-wider">Gate</span>
                                <span className="block text-xl font-black text-brand-dark">01</span>
                            </div>
                            <div className="w-[1px] h-8 bg-gray-100"></div>
                            <div className="text-center flex-1">
                                <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-wider">Seat</span>
                                <span className="block text-xl font-black text-brand-dark">1A</span>
                            </div>
                            <div className="w-[1px] h-8 bg-gray-100"></div>
                            <div className="text-center flex-1">
                                <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-wider">Zone</span>
                                <span className="block text-xl font-black text-brand-dark">1</span>
                            </div>
                        </div>

                        {/* Footer Info & Barcode */}
                        <div className="mt-auto">
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <label className="block text-[9px] uppercase font-bold text-gray-400 tracking-wider">Boarding</label>
                                    <span className="block text-sm font-black text-red-500">AGORA</span>
                                </div>
                                <div className="text-right">
                                    <label className="block text-[9px] uppercase font-bold text-gray-400 tracking-wider">SEQ</label>
                                    <span className="block text-sm font-mono font-bold text-gray-600">001</span>
                                </div>
                            </div>

                            {/* High Fidelity Barcode */}
                            <div className="pt-2 border-t border-gray-200">
                                {/* Barcode Lines */}
                                <div className="flex justify-center items-stretch h-12 w-full overflow-hidden select-none bg-transparent gap-[1px]">
                                    {[4, 2, 1, 1, 3, 1, 2, 1, 4, 1, 1, 2, 3, 1, 2, 1, 3, 1, 1, 2, 1, 2, 1, 3, 1, 1, 2, 1, 4, 1, 2].map((w, i) => (
                                        <div
                                            key={i}
                                            className="bg-black"
                                            style={{
                                                width: `${w * 2}px`, // Thicker bars
                                                flexShrink: 0
                                            }}
                                        />
                                    ))}
                                    <div className="flex-1"></div> {/* Spacer to allow barcode to breathe or align left */}
                                    {[2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 3, 1, 1, 2].map((w, i) => (
                                        <div
                                            key={`end-${i}`}
                                            className="bg-black"
                                            style={{
                                                width: `${w * 2}px`,
                                                flexShrink: 0
                                            }}
                                        />
                                    ))}
                                </div>

                                {/* Ticket Number & Icons */}
                                <div className="flex justify-between items-center mt-1">
                                    <span className="font-mono text-[9px] font-bold tracking-[0.3em] text-gray-400 uppercase">
                                        ETKT 29384910239
                                    </span>
                                    <DeviceMobile className="w-3 h-3 text-gray-300" weight="fill" />
                                </div>
                            </div>
                        </div>

                        {/* Decorative Stamp Watermark */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] rotate-[-30deg] pointer-events-none">
                            <AirplaneTilt className="w-32 h-32 text-brand-dark" weight="fill" />
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default CallToAction;
