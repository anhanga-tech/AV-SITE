import React from 'react';
import { MessageCircle } from 'lucide-react';
import { getWhatsAppLink } from './utils/whatsapp';

/**
 * Botão flutuante do WhatsApp - Versão com Tracking
 * Usa getWhatsAppLink() para incluir automaticamente todos os parâmetros de tracking.
 */
const WhatsAppFloating: React.FC = () => {
  const whatsappUrl = getWhatsAppLink();

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-whatsapp fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 flex items-center justify-center animate-pulse hover:animate-none"
      aria-label="Fale conosco no WhatsApp"
      id="btn-whatsapp-floating"
    >
      <MessageCircle size={32} fill="white" className="text-white" />
    </a>
  );
};

export default WhatsAppFloating;