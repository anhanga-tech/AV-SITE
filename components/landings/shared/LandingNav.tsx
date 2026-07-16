import { WhatsappLogo } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { BRAND_LOGO_BLUE_URL } from '@/lib/media-assets';
import { openContactModal } from '@/utils/contactForm';
import { Button } from '@/components/ui/Button';

interface LandingNavProps {
    source: string;
}

export function LandingNav({ source }: LandingNavProps) {
    return (
        <nav className="bg-white/90 backdrop-blur-md border-b border-zinc-100 sticky top-0 z-50 px-6 py-2">
            <div className="container mx-auto flex items-center justify-between">
                <Link to="/" aria-label="Voltar para o site principal" className="inline-block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action">
                    <img
                        src={BRAND_LOGO_BLUE_URL}
                        alt="Anhangá Viagens"
                        width="160"
                        height="83"
                        className="h-12 w-auto object-contain"
                    />
                </Link>
                {/*
                  Variante `action` (pílula Céu Vivo), não `cta` (âmbar): a Regra do
                  Âmbar do DESIGN.md reserva o Âmbar Vivo a 1 elemento por tela, já
                  ocupado pelo CTA principal da página. O nav em estado "scrolled/
                  internal" usa exatamente `bg-action hover:bg-action-dark` por
                  especificação do componente Navigation do DESIGN.md.
                */}
                <div className="hidden sm:block">
                    <Button
                        variant="action"
                        onClick={() => openContactModal({ source })}
                        className="btn-whatsapp btn-specialist"
                        leftIcon={<WhatsappLogo className="size-4" weight="fill" aria-hidden="true" />}
                        data-contact-intent
                        data-tracking={`header-${source}`}
                    >
                        Falar no WhatsApp
                    </Button>
                </div>
            </div>
        </nav>
    );
}
