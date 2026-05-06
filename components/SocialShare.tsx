import React, { useState } from 'react';
import Share2 from 'lucide-react/dist/esm/icons/share-2';
import Facebook from 'lucide-react/dist/esm/icons/facebook';
import Linkedin from 'lucide-react/dist/esm/icons/linkedin';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import LinkIcon from 'lucide-react/dist/esm/icons/link';
import Check from 'lucide-react/dist/esm/icons/check';
import { shareContent, getSocialShareLinks } from '../utils/share';

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
        import('../utils/haptics').then(m => m.triggerHaptic('light'));
        await shareContent({
            title,
            text: excerpt || title,
            url,
        });
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        import('../utils/haptics').then(m => m.triggerHaptic('medium'));
        setTimeout(() => setCopied(false), 2000);
    };

    if (minimal) {
        return (
            <div className={`flex items-center gap-1 ${className}`}>
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleNativeShare();
                    }}
                    className="p-2 bg-white/80 hover:bg-brand-cyan hover:text-white text-gray-400 rounded-full transition-all shadow-sm border border-gray-100"
                    title="Compartilhar"
                    aria-label="Compartilhar"
                >
                    <Share2 className="w-4 h-4" />
                </button>
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCopy();
                    }}
                    className={`p-2 rounded-full transition-all shadow-sm border ${copied ? 'bg-green-500 text-white border-green-600' : 'bg-white/80 text-gray-400 border-gray-100 hover:bg-gray-100'}`}
                    title={copied ? "Link copiado!" : "Copiar link"}
                    aria-label={copied ? "Link copiado com sucesso" : "Copiar link"}
                >
                    {copied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                </button>
            </div>
        );
    }

    return (
        <div className={`flex flex-wrap items-center gap-3 ${className}`}>
            {/* Native Share Button (Primary on Mobile) */}
            <button
                onClick={handleNativeShare}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-cyan text-white font-bold rounded-xl hover:bg-brand-cyanDark transition-all shadow-[0_4px_0px_#0369a1] active:shadow-none active:translate-y-1 lg:hidden"
            >
                <Share2 className="w-5 h-5" /> Compartilhar
            </button>

            {/* Social Buttons */}
            <div className="flex items-center gap-2">
                <a
                    href={links.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-[#25D366] text-white rounded-xl hover:scale-110 transition-transform shadow-md"
                    title="Compartilhar no WhatsApp"
                    aria-label="Compartilhar no WhatsApp"
                    onClick={() => import('../utils/haptics').then(m => m.triggerHaptic('light'))}
                >
                    <MessageCircle className="w-5 h-5 fill-current" />
                </a>
                <a
                    href={links.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-[#1877F2] text-white rounded-xl hover:scale-110 transition-transform shadow-md"
                    title="Compartilhar no Facebook"
                    aria-label="Compartilhar no Facebook"
                    onClick={() => import('../utils/haptics').then(m => m.triggerHaptic('light'))}
                >
                    <Facebook className="w-5 h-5 fill-current" />
                </a>
                <a
                    href={links.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-[#0A66C2] text-white rounded-xl hover:scale-110 transition-transform shadow-md"
                    title="Compartilhar no LinkedIn"
                    aria-label="Compartilhar no LinkedIn"
                    onClick={() => import('../utils/haptics').then(m => m.triggerHaptic('light'))}
                >
                    <Linkedin className="w-5 h-5 fill-current" />
                </a>

                {/* Native Share (secondary on desktop) */}
                <button
                    onClick={handleNativeShare}
                    className="hidden lg:flex p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all shadow-sm"
                    title="Mais opções de compartilhamento"
                    aria-label="Mais opções de compartilhamento"
                >
                    <Share2 className="w-5 h-5" />
                </button>

                {/* Copy Link button */}
                <button
                    onClick={handleCopy}
                    className={`p-2.5 rounded-xl transition-all shadow-sm border ${copied ? 'bg-green-500 text-white border-green-600' : 'bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200'}`}
                    title={copied ? "Link copiado!" : "Copiar link"}
                    aria-label={copied ? "Link copiado com sucesso" : "Copiar link"}
                >
                    {copied ? <Check className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
};
