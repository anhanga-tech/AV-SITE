import React from 'react';
import { Bot, Loader2 } from 'lucide-react';

interface ChatTypingIndicatorProps {
    mode: 'hero' | 'widget';
}

const TypingDots: React.FC = () => (
    <div className="flex items-center gap-1 text-sm text-gray-500" aria-label="Digitando">
        <span className="animate-pulse">●</span>
        <span className="animate-pulse [animation-delay:120ms]">●</span>
        <span className="animate-pulse [animation-delay:240ms]">●</span>
    </div>
);

const ChatTypingIndicator: React.FC<ChatTypingIndicatorProps> = ({ mode }) => {
    if (mode === 'hero') {
        return (
            <div className="flex items-center justify-start">
                <div className="inline-flex items-center px-3 py-2 rounded-2xl bg-white/90 border border-white/70">
                    <TypingDots />
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white border border-gray-200 text-brand-vibrant flex items-center justify-center shadow-sm">
                <Bot className="w-5 h-5" />
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-brand-vibrant" />
                <span className="text-xs text-gray-400 font-medium">Anhangá está digitando...</span>
            </div>
        </div>
    );
};

export default ChatTypingIndicator;
