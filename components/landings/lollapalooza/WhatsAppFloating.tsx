import React from 'react';
import { BellRing } from 'lucide-react';
import { WAITLIST_SECTION_ID } from './constants';

/**
 * Botão flutuante do WhatsApp - Versão com Tracking
 * Usa getWhatsAppLink() para incluir automaticamente todos os parâmetros de tracking.
 */
const WhatsAppFloating: React.FC = () => {
  return (
    <a
      href={`#${WAITLIST_SECTION_ID}`}
      className="fixed bottom-6 right-6 z-50 bg-anhanga-yellow text-anhanga-darkBlue px-4 py-3 rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 flex items-center justify-center gap-2 animate-pulse hover:animate-none font-black uppercase text-xs tracking-wider"
      aria-label="Ir para a lista de espera"
      id="btn-lolla-waitlist-floating"
    >
      <BellRing size={18} aria-hidden="true" />
      Lista 2027
    </a>
  );
};

export default WhatsAppFloating;
