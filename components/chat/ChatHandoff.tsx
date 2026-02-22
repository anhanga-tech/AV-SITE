import React from 'react';
import { CheckCircle2, ExternalLink, MessageCircle } from 'lucide-react';

interface ChatHandoffProps {
    whatsappUrl: string;
    onReset: () => void;
}

const ChatHandoff: React.FC<ChatHandoffProps> = ({ whatsappUrl, onReset }) => {
    return (
        <div className="w-full max-w-3xl mx-auto rounded-2xl border border-white/40 bg-white/90 backdrop-blur-sm p-5 text-center animate-fade-in-up">
            <div className="flex justify-center mb-3">
                <CheckCircle2 className="w-9 h-9 text-green-600" />
            </div>

            <h3 className="text-lg font-bold text-brand-dark mb-2">Seu roteiro está pronto!</h3>
            <p className="text-sm text-gray-700 mb-4">
                Fale agora com um consultor especialista. Já enviamos seu perfil de viagem para ele.
            </p>

            <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-[#25D366] hover:opacity-90 text-white font-bold py-3 px-4 rounded-xl transition-opacity"
            >
                <MessageCircle className="w-4 h-4" />
                <span>Continuar no WhatsApp</span>
                <ExternalLink className="w-4 h-4" />
            </a>

            <button
                type="button"
                onClick={onReset}
                className="mt-4 text-sm text-brand-blue hover:underline"
            >
                Fazer nova cotação
            </button>
        </div>
    );
};

export default ChatHandoff;
