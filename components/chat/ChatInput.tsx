import React from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
    inputRef: React.RefObject<HTMLInputElement | null>;
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    disabled?: boolean;
    placeholder?: string;
    mode: 'hero' | 'widget';
}

const ChatInput: React.FC<ChatInputProps> = ({
    inputRef,
    value,
    onChange,
    onSend,
    disabled = false,
    placeholder = 'Digite sua dúvida aqui...',
    mode,
}) => {
    const isHero = mode === 'hero';

    return (
        <div className={isHero ? 'p-3 bg-white/10 border-t border-white/20' : 'p-4 bg-white border-t border-gray-100'}>
            <div className={isHero
                ? 'relative flex items-center bg-white rounded-xl border border-white/70 focus-within:ring-2 focus-within:ring-brand-yellow/40'
                : 'relative flex items-center bg-gray-100 rounded-2xl border border-transparent focus-within:border-brand-vibrant/30 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-vibrant/10 transition-all'}
            >
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            onSend();
                        }
                    }}
                    disabled={disabled}
                    placeholder={placeholder}
                    aria-label="Digite sua mensagem para o assistente virtual"
                    className={isHero
                        ? 'flex-1 pl-3 pr-12 py-2.5 bg-transparent text-sm text-brand-dark placeholder:text-gray-400 focus:outline-none disabled:opacity-70'
                        : 'flex-1 pl-4 pr-12 py-3 bg-transparent focus:outline-none text-sm text-gray-800 placeholder-gray-400 disabled:opacity-70'}
                />

                <button
                    type="button"
                    onClick={onSend}
                    disabled={disabled || !value.trim()}
                    aria-label="Enviar mensagem"
                    className={isHero
                        ? 'absolute right-1.5 p-2 bg-brand-vibrant text-white rounded-lg hover:bg-brand-blue transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
                        : 'absolute right-2 p-2 bg-brand-vibrant text-white rounded-xl hover:bg-brand-blue transition-all disabled:opacity-0 disabled:scale-75 focus:outline-none shadow-md'}
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>

            {!isHero && (
                <p className="text-[10px] text-center text-gray-400 mt-2">
                    Nossa IA pode cometer erros. Confirme os dados com o agente.
                </p>
            )}
        </div>
    );
};

export default ChatInput;
