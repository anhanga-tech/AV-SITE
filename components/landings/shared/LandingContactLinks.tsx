import { openContactModal } from '@/utils/contactForm';
import { CADASTUR_URL, LANDING_PHONE_HREF, LANDING_PHONE_LABEL, landingWhatsAppHref } from './landing-contact';

/*
  Bloco de confiança dos rodapés de landing (auditoria 01/11/2026, #1969): as landings
  não têm o Footer do site principal, então ficavam sem telefone, sem WhatsApp navegável
  e sem o Cadastur — sinais que o crawler e quem desconfia de agência online procuram.

  O WhatsApp é um <a href="wa.me"> de verdade: sem JS (ou antes da hidratação) ele
  navega; com JS o clique abre o modal de contato, que qualifica o lead antes do chat.
*/

interface LandingContactLinksProps {
    source: string;
    className?: string;
    linkClassName?: string;
}

const DEFAULT_LINK_CLASS =
    'underline underline-offset-2 hover:opacity-100 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action rounded-sm';

// Alvo de toque de 44px do PRODUCT.md: fica fora de `linkClassName` para que um
// rodapé que troque o estilo visual não perca a área de toque junto.
const TOUCH_TARGET_CLASS = 'inline-flex min-h-11 items-center';

export function LandingContactLinks({ source, className = '', linkClassName = DEFAULT_LINK_CLASS }: LandingContactLinksProps) {
    return (
        <div className={`flex flex-col items-center text-xs ${className}`}>
            <p className="flex flex-wrap justify-center gap-x-4">
                <a href={LANDING_PHONE_HREF} className={`${TOUCH_TARGET_CLASS} ${linkClassName}`}>
                    {LANDING_PHONE_LABEL}
                </a>
                <a
                    href={landingWhatsAppHref()}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(event) => {
                        event.preventDefault();
                        openContactModal({ source });
                    }}
                    className={`btn-whatsapp btn-specialist ${TOUCH_TARGET_CLASS} ${linkClassName}`}
                    data-contact-intent
                    data-tracking={`footer-contact-whatsapp-${source}`}
                >
                    WhatsApp
                </a>
            </p>
            <p className="flex flex-wrap items-center justify-center gap-x-1">
                ANHANGA TURISMO LTDA • CNPJ/Cadastur:{' '}
                <a href={CADASTUR_URL} target="_blank" rel="noopener noreferrer" className={`${TOUCH_TARGET_CLASS} ${linkClassName}`}>
                    37.036.732/0001-41<span className="sr-only"> (abre em nova aba)</span>
                </a>
            </p>
        </div>
    );
}
