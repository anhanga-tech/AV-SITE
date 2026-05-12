import React from 'react';
import { openContactModal } from '@/utils/contactForm';

interface ChatCTAProps {
  destino?: string;
  mensagem?: string;
  label?: string;
}

const ChatCTA: React.FC<ChatCTAProps> = ({ destino, mensagem, label }) => {
  const buttonLabel =
    label ?? (destino ? `Planejar viagem para ${destino}` : 'Planejar minha viagem');

  return (
    <div className="not-prose my-8 flex justify-center">
      <button
        onClick={() => openContactModal({
          source: 'blog-inline-cta',
          destination: destino,
          message: mensagem,
        })}
        className="btn-whatsapp btn-specialist inline-flex items-center gap-3 bg-brand-cyan text-white text-base font-bold px-8 py-4 rounded-2xl shadow-[4px_4px_0px_#003B8E] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        type="button"
        data-tracking="blog-chat-cta"
      >
        {buttonLabel}
      </button>
    </div>
  );
};

export default ChatCTA;
