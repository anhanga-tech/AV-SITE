import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, Sparkles, X } from 'lucide-react';
import ChatCore from './chat/ChatCore';

const AIChat: React.FC = () => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [externalMessage, setExternalMessage] = useState<string | null>(null);
    const [heroInView, setHeroInView] = useState(true);

    const isHome = location.pathname === '/';
    const showFloatingButton = !isOpen && (!isHome || !heroInView);

    useEffect(() => {
        const handleToggle = (event: Event) => {
            const customEvent = event as CustomEvent<{ message?: string }>;
            setIsOpen(true);

            if (customEvent.detail?.message) {
                setExternalMessage(customEvent.detail.message);
            }
        };

        window.addEventListener('toggle-ai-chat', handleToggle);
        return () => window.removeEventListener('toggle-ai-chat', handleToggle);
    }, []);

    useEffect(() => {
        if (!isHome) {
            setHeroInView(false);
            return;
        }

        const el = document.getElementById('hero-section');
        if (!el) return;

        setHeroInView(true);
        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry) setHeroInView(entry.isIntersecting);
            },
            { threshold: 0.1, rootMargin: '0px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [isHome]);

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] flex flex-col items-end font-sans">
            {isOpen && (
                <div
                    className="mb-4 w-[90vw] sm:w-[400px] bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col transition-all duration-300 animate-fade-in-up origin-bottom-right"
                    style={{ height: '600px', maxHeight: '75vh' }}
                    role="dialog"
                    aria-label="Assistente Virtual de Viagem"
                >
                    <div className="bg-gradient-to-br from-brand-vibrant to-brand-blue p-5 text-white flex justify-between items-center shrink-0 shadow-md z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                                <Sparkles className="w-5 h-5 text-brand-yellow fill-brand-yellow" />
                            </div>
                            <div>
                                <span className="font-bold block text-base tracking-wide">Assistente Anhangá</span>
                                <div className="flex items-center gap-1.5 opacity-90">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                                    </span>
                                    <span className="text-xs font-medium">Online agora</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsOpen(false)}
                            className="hover:bg-white/20 p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                            aria-label="Minimizar chat"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <ChatCore
                        mode="widget"
                        externalMessage={externalMessage}
                        onExternalMessageHandled={() => setExternalMessage(null)}
                    />
                </div>
            )}

            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className={`
                    group flex items-center justify-center gap-3
                    bg-brand-vibrant hover:bg-brand-blue text-white
                    shadow-2xl hover:shadow-brand-vibrant/50
                    transition-opacity duration-300 transform hover:scale-110 active:scale-95
                    focus:outline-none focus:ring-4 focus:ring-brand-vibrant/50
                    z-[100]
                    w-14 h-14 rounded-full p-0
                    sm:w-auto sm:h-auto sm:rounded-full sm:pl-5 sm:pr-6 sm:py-3.5
                    ${!showFloatingButton ? 'translate-y-24 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}
                `}
                aria-label="Abrir assistente virtual"
            >
                <span className="absolute inset-0 rounded-full bg-brand-vibrant opacity-30 animate-ping sm:hidden" />

                <div className="relative flex items-center justify-center">
                    <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8" />
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-brand-vibrant animate-pulse sm:top-0 sm:right-0 sm:w-2.5 sm:h-2.5" />
                </div>

                <div className="text-left hidden sm:block">
                    <span className="block text-[10px] font-medium text-brand-yellow uppercase tracking-wider">Online</span>
                    <span className="block text-sm font-bold leading-none">Ajuda & Cotação</span>
                </div>
            </button>
        </div>
    );
};

export default AIChat;
