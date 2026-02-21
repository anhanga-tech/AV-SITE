import React from 'react';
import { Bot, Loader2 } from 'lucide-react';

interface ChatTypingIndicatorProps {
    mode: 'hero' | 'widget';
}

const ChatTypingIndicator: React.FC<ChatTypingIndicatorProps> = ({ mode }) => {
    if (mode === 'hero') {
        return (
            <div className="flex items-center gap-2 text-xs text-white/90 bg-white/15 border border-white/20 rounded-xl px-3 py-2 backdrop-blur-sm">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Consultora está digitando...</span>
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
