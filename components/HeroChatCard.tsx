import React from 'react';
import { Sparkles } from 'lucide-react';
import ChatCore from './chat/ChatCore';

const HeroChatCard: React.FC = () => {
    return (
        <div className="w-full max-w-4xl mx-auto rounded-[2rem] border border-white/30 bg-gradient-to-b from-brand-blue/75 to-brand-cyan/70 backdrop-blur-md shadow-[0_30px_60px_-15px_rgba(0,0,0,0.35)] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/20 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-brand-yellow fill-brand-yellow" />
                    </div>
                    <div className="text-left">
                        <p className="font-bold leading-none">Consultora Anhangá</p>
                        <p className="text-xs text-white/90 mt-1">Atendimento em tempo real</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-white/90">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-300" />
                    </span>
                    Online
                </div>
            </div>

            <ChatCore mode="hero" />
        </div>
    );
};

export default HeroChatCard;
