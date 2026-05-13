import React from 'react';
import { PostMeta } from '../../lib/mdx';
import { openContactModal } from '../../utils/contactForm';

interface BlogPostFinalCTAProps {
    post: PostMeta;
}

export const BlogPostFinalCTA: React.FC<BlogPostFinalCTAProps> = ({ post }) => {
    return (
        <div className="mt-24 bg-brand-dark rounded-[3rem] p-10 md:p-16 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-cyan/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 relative z-10">
                Gostou do conteúdo? <br />
                <span className="text-brand-cyan">Sua viagem começa aqui.</span>
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto relative z-10">
                Transformamos essas inspirações em um roteiro real e exclusivo para você.
            </p>
            <button
                type="button"
                onClick={() => openContactModal({
                    source: 'blog-post-footer',
                    message: `Olá! Li o post "${post.title}" e gostaria de planejar minha viagem.`,
                })}
                className="btn-whatsapp btn-specialist inline-flex items-center gap-3 bg-brand-cyan text-white text-lg font-bold px-10 py-5 rounded-2xl shadow-[4px_4px_0px_#FFD600] hover:shadow-[2px_2px_0px_#FFD600] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all relative z-10"
                data-tracking="footer-blog-post"
            >
                Conversar com um Especialista
            </button>
        </div>
    );
};
