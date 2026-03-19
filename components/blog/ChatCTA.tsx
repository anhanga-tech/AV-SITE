import React from 'react';
import { openAiChat } from '@/utils/aiChat';

interface ChatCTAProps {
  destino?: string;
  mensagem?: string;
  label?: string;
}

const ChatCTA: React.FC<ChatCTAProps> = ({ destino, mensagem, label }) => {
  const message =
    mensagem ??
    (destino
      ? `Olá! Gostaria de planejar uma viagem para ${destino}.`
      : 'Olá! Gostaria de planejar minha viagem.');

  const buttonLabel =
    label ?? (destino ? `Planejar viagem para ${destino}` : 'Planejar minha viagem');

  return (
    <div className="not-prose my-8 flex justify-center">
      <button
        onClick={() => openAiChat({ message })}
        className="inline-flex items-center gap-3 bg-brand-cyan text-white text-base font-bold px-8 py-4 rounded-2xl shadow-[4px_4px_0px_#003B8E] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        type="button"
      >
        {buttonLabel}
      </button>
    </div>
  );
};

export default ChatCTA;
