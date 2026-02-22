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
    placeholder,
    mode,
}) => {
    const isHero = mode === 'hero';
    const resolvedPlaceholder = placeholder || (isHero ? 'Para onde você sonha em ir?' : 'Digite sua dúvida aqui...');
    const inputAriaLabel = isHero ? 'Para onde você sonha em ir?' : 'Digite sua mensagem para o assistente virtual';

    return (
        <div className={isHero ? 'sticky bottom-0 p-2 sm:p-3 bg-transparent' : 'p-4 bg-white border-t border-gray-100'}>
            <div className={isHero
                ? 'relative flex items-center bg-white/90 backdrop-blur-sm rounded-2xl border border-white/60 shadow-hero-input focus-within:ring-2 focus-within:ring-anhanga-blue/30 focus-within:ring-offset-0'
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
                    placeholder={resolvedPlaceholder}
                    aria-label={inputAriaLabel}
                    className={isHero
                        ? 'flex-1 pl-4 pr-12 py-3 bg-transparent text-sm text-brand-dark placeholder:text-gray-500 focus:outline-none disabled:opacity-70'
                        : 'flex-1 pl-4 pr-12 py-3 bg-transparent focus:outline-none text-sm text-gray-800 placeholder-gray-400 disabled:opacity-70'}
                />

                <button
                    type="button"
                    onClick={onSend}
                    disabled={disabled || !value.trim()}
                    aria-label="Enviar mensagem"
                    className={isHero
                        ? 'absolute right-2 p-2 rounded-xl bg-anhanga-blue text-white hover:bg-brand-blue transition-all disabled:opacity-40 disabled:cursor-not-allowed'
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
