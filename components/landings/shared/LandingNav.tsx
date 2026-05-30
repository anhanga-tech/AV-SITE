import { WhatsappLogo } from '@phosphor-icons/react';
import { BRAND_LOGO_BLUE_URL } from '../../../lib/media-assets';
import { openContactModal } from '../../../utils/contactForm';

interface LandingNavProps {
    source: string;
}

export function LandingNav({ source }: LandingNavProps) {
    return (
        <nav className="bg-white/90 backdrop-blur-md border-b border-zinc-100 sticky top-0 z-50 px-6 py-2">
            <div className="container mx-auto flex items-center justify-between">
                <a href="https://www.anhanga.tur.br/" aria-label="Voltar para o site principal">
                    <img
                        src={BRAND_LOGO_BLUE_URL}
                        alt="Anhangá Viagens"
                        width="160"
                        height="83"
                        className="h-12 w-auto object-contain"
                    />
                </a>
                <button
                    type="button"
                    onClick={() => openContactModal({ source })}
                    className="btn-whatsapp btn-specialist hidden sm:flex items-center gap-2 bg-brand-dark text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-hard-yellow hover:shadow-[2px_2px_0px_theme(colors.brand.yellow)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition"
                    data-contact-intent
                    data-tracking={`header-${source}`}
                >
                    <WhatsappLogo className="size-4" weight="fill" />
                    Falar no WhatsApp
                </button>
            </div>
        </nav>
    );
}
