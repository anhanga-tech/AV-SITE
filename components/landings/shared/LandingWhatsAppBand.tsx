import { AirplaneTilt, WhatsappLogo } from '@phosphor-icons/react';
import { openContactModal } from '../../../utils/contactForm';

interface LandingWhatsAppBandProps {
    source: string;
    subtitle: string;
    headline: React.ReactNode;
}

export function LandingWhatsAppBand({ source, subtitle, headline }: LandingWhatsAppBandProps) {
    return (
        <section className="py-16 bg-brand-dark relative overflow-hidden">
            <div
                className="absolute top-5 left-10 text-9xl opacity-[0.03] rotate-12 font-black text-white pointer-events-none select-none"
            >
                FLY
            </div>
            <div
                className="absolute bottom-5 right-10 text-9xl opacity-[0.03] -rotate-12 font-black text-white pointer-events-none select-none"
            >
                TRAVEL
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 bg-white/5 rounded-[2rem] p-10 border border-white/10">
                    <div>
                        <p className="text-brand-yellow font-bold uppercase tracking-widest text-xs mb-3 flex items-center gap-2">
                            <AirplaneTilt className="size-4" weight="fill" />
                            {subtitle}
                        </p>
                        <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
                            {headline}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={() => openContactModal({ source })}
                        className="btn-whatsapp btn-specialist shrink-0 flex items-center gap-3 bg-brand-yellow text-brand-dark px-10 py-5 rounded-2xl font-bold text-lg shadow-[4px_4px_0px_rgba(255,255,255,0.15)] hover:shadow-[2px_2px_0px_rgba(255,255,255,0.15)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition whitespace-nowrap"
                        data-contact-intent
                        data-tracking={`whatsapp-band-${source}`}
                    >
                        <WhatsappLogo className="size-6" weight="fill" />
                        Abrir WhatsApp
                    </button>
                </div>
            </div>
        </section>
    );
}
