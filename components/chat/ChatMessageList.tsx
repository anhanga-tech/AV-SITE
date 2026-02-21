import React from 'react';
import { Bot, User } from 'lucide-react';
import type { ChatMessage } from '../../hooks/useChatSession';

interface ChatMessageListProps {
    mode: 'hero' | 'widget';
    messages: ChatMessage[];
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

const FormattedText: React.FC<{ text: string }> = ({ text }) => {
    const paragraphs = text.split('\n').filter((paragraph) => paragraph.trim() !== '');

    return (
        <div className="space-y-2">
            {paragraphs.map((paragraph, index) => {
                const isList = paragraph.trim().startsWith('-');
                const cleanText = isList ? paragraph.replace('-', '').trim() : paragraph;
                const parts = cleanText.split(/(\*\*.*?\*\*)/g);

                const content = parts.map((part, partIndex) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return (
                            <strong key={partIndex} className="font-bold">
                                {part.slice(2, -2)}
                            </strong>
                        );
                    }

                    return part;
                });

                if (isList) {
                    return (
                        <div key={index} className="flex items-start gap-2 ml-1">
                            <span className="w-1.5 h-1.5 bg-current rounded-full mt-2 shrink-0 opacity-60" />
                            <span>{content}</span>
                        </div>
                    );
                }

                return (
                    <p key={index} className="leading-relaxed">
                        {content}
                    </p>
                );
            })}
        </div>
    );
};

const ChatMessageList: React.FC<ChatMessageListProps> = ({
    mode,
    messages,
    messagesEndRef,
}) => {
    const isHero = mode === 'hero';

    const listClassName = isHero
        ? 'h-full overflow-y-auto space-y-3 px-1 py-2'
        : 'flex-1 overflow-y-auto p-5 bg-slate-50 space-y-6 scroll-smooth';

    return (
        <div className={listClassName} aria-live="polite" role="log">
            {messages.map((message) => (
                <div
                    key={message.id}
                    className={`flex items-end gap-3 animate-fade-in-up ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                    {!isHero && (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm ${
                            message.role === 'user'
                                ? 'bg-brand-dark border-gray-700 text-white order-2'
                                : 'bg-white border-gray-200 text-brand-vibrant'
                        }`}>
                            {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-5 h-5" />}
                        </div>
                    )}

                    <div className={`max-w-[88%] p-3 sm:p-4 rounded-2xl text-sm shadow-sm ${
                        message.role === 'user'
                            ? isHero
                                ? 'bg-brand-yellow text-brand-dark'
                                : 'bg-brand-vibrant text-white rounded-br-none'
                            : isHero
                                ? 'bg-white text-gray-800 border border-gray-200/60'
                                : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none'
                    }`}>
                        <FormattedText text={message.text} />
                    </div>
                </div>
            ))}

            <div ref={messagesEndRef} />
        </div>
    );
};

export default ChatMessageList;
