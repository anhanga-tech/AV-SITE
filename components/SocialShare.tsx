import React, { useState } from 'react';
import { Share2, MessageCircle, Link as LinkIcon, Check } from 'lucide-react';
import { shareContent, getSocialShareLinks } from '../utils/share';

function prefetchHaptics() {
    import('../utils/haptics').catch(() => {});
}

const Facebook = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
);

const Linkedin = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
        <rect width="4" height="12" x="2" y="9"/>
        <circle cx="4" cy="4" r="2"/>
    </svg>
);

interface SocialShareProps {
    url: string;
    title: string;
    excerpt?: string;
    className?: string;
    minimal?: boolean;
}

export const SocialShare: React.FC<SocialShareProps> = ({ url, title, excerpt, className = "", minimal = false }) => {
    const [copied, setCopied] = useState(false);
    const links = getSocialShareLinks(url, title);

    const handleNativeShare = async () => {
        import('../utils/haptics')
            .then(m => m.triggerHaptic('light'))
            .catch(() => {});

        await shareContent({
            title,
            text: excerpt || title,
            url,
        });
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        import('../utils/haptics')
            .then(m => m.triggerHaptic('medium'))
            .catch(() => {});

        setTimeout(() => setCopied(false), 2000);
    };

    if (minimal) {
        return (
            <div className={`flex items-center gap-1 ${className}`}>
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleNativeShare();
                    }}
                    onMouseEnter={prefetchHaptics}
                    className="min-h-12 min-w-12 flex items-center justify-center bg-white/80 hover:bg-brand-cyan hover:text-white text-zinc-600 rounded-full transition shadow-sm border border-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-cyan"
                    title="Compartilhar"
                    aria-label="Compartilhar"
                >
                    <Share2 className="size-4" />
                </button>
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCopy();
                    }}
                    onMouseEnter={prefetchHaptics}
                    className={`min-h-12 min-w-12 flex items-center justify-center rounded-full transition shadow-sm border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${copied ? 'bg-green-700 text-white border-green-800 focus-visible:ring-green-700' : 'bg-white/80 text-zinc-600 border-zinc-100 hover:bg-zinc-100 focus-visible:ring-zinc-400'}`}
                    role={copied ? "status" : undefined}
                    title={copied ? "Link copiado!" : "Copiar link"}
                    aria-label={copied ? "Link copiado com sucesso" : "Copiar link"}
                >
                    {copied ? <Check className="size-4" /> : <LinkIcon className="size-4" />}
                </button>
            </div>
        );
    }

    return (
        <div className={`flex flex-wrap items-center gap-3 ${className}`}>
            {/* Native Share Button (Primary on Mobile) */}
            <button
                type="button"
                onClick={handleNativeShare}
                onMouseEnter={prefetchHaptics}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-cyan text-white font-bold rounded-xl hover:bg-brand-cyanDark transition shadow-[0_4px_0px_#0369a1] active:shadow-none active:translate-y-1 lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-cyan"
            >
                <Share2 className="size-5" /> Compartilhar
            </button>

            {/* Social Buttons */}
            <div className="flex items-center gap-2">
                <a
                    href={links.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-12 min-w-12 flex items-center justify-center bg-[#25D366] text-white rounded-xl hover:scale-110 transition-transform shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#25D366]"
                    title="Compartilhar no WhatsApp"
                    aria-label="Compartilhar no WhatsApp"
                    onMouseEnter={prefetchHaptics}
                    onClick={() => {
                        import('../utils/haptics')
                            .then(m => m.triggerHaptic('light'))
                            .catch(() => {});
                    }}
                >
                    <MessageCircle className="size-5 fill-current" />
                </a>
                <a
                    href={links.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-12 min-w-12 flex items-center justify-center bg-[#1877F2] text-white rounded-xl hover:scale-110 transition-transform shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1877F2]"
                    title="Compartilhar no Facebook"
                    aria-label="Compartilhar no Facebook"
                    onMouseEnter={prefetchHaptics}
                    onClick={() => {
                        import('../utils/haptics')
                            .then(m => m.triggerHaptic('light'))
                            .catch(() => {});
                    }}
                >
                    <Facebook className="size-5 fill-current" />
                </a>
                <a
                    href={links.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-12 min-w-12 flex items-center justify-center bg-[#0A66C2] text-white rounded-xl hover:scale-110 transition-transform shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0A66C2]"
                    title="Compartilhar no LinkedIn"
                    aria-label="Compartilhar no LinkedIn"
                    onMouseEnter={prefetchHaptics}
                    onClick={() => {
                        import('../utils/haptics')
                            .then(m => m.triggerHaptic('light'))
                            .catch(() => {});
                    }}
                >
                    <Linkedin className="size-5 fill-current" />
                </a>

                {/* Native Share (secondary on desktop) */}
                <button
                    type="button"
                    onClick={handleNativeShare}
                    onMouseEnter={prefetchHaptics}
                    className="hidden lg:flex min-h-12 min-w-12 items-center justify-center bg-zinc-100 text-zinc-600 rounded-xl hover:bg-zinc-200 transition shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-cyan"
                    title="Mais opções de compartilhamento"
                    aria-label="Mais opções de compartilhamento"
                >
                    <Share2 className="size-5" />
                </button>

                {/* Copy Link button */}
                <button
                    type="button"
                    onClick={handleCopy}
                    onMouseEnter={prefetchHaptics}
                    className={`min-h-12 min-w-12 flex items-center justify-center rounded-xl transition shadow-sm border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${copied ? 'bg-green-700 text-white border-green-800 focus-visible:ring-green-700' : 'bg-zinc-100 text-zinc-600 border-transparent hover:bg-zinc-200 focus-visible:ring-zinc-400'}`}
                    role={copied ? "status" : undefined}
                    title={copied ? "Link copiado!" : "Copiar link"}
                    aria-label={copied ? "Link copiado com sucesso" : "Copiar link"}
                >
                    {copied ? <Check className="size-5" /> : <LinkIcon className="size-5" />}
                </button>
            </div>
        </div>
    );
};
