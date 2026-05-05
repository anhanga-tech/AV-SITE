import React from 'react';
import Clock from 'lucide-react/dist/esm/icons/clock';
import { PostMeta } from '../../lib/mdx';
import { getBlogPostUrl } from '../../utils/blog';
import { optimizeRemoteImageUrl } from '../../data/mediaConfig';
import { getCategoryColor } from '../../utils/categoryColors';
import { openAiChat } from '../../utils/aiChat';

interface BlogPostSidebarProps {
    author: {
        name: string;
        role?: string;
        bio?: string;
        image?: string;
    } | null;
    authorFallbackName: string;
    relatedPosts: PostMeta[];
}

export const BlogPostSidebar: React.FC<BlogPostSidebarProps> = ({ author, authorFallbackName, relatedPosts }) => {
    return (
        <div className="sticky top-32 space-y-8">
            <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 text-center relative overflow-hidden shadow-lg group hover:border-brand-yellow/30 transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/10 rounded-bl-full -mr-10 -mt-10 transition-all group-hover:scale-110"></div>
                <div className="w-28 h-28 bg-gray-200 rounded-full mx-auto mb-6 overflow-hidden border-[6px] border-white shadow-xl relative z-10">
                    {author?.image ? (
                        <img src={author.image} alt={author.name} width="112" height="112" loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-brand-dark text-white text-4xl font-black">
                            {authorFallbackName.charAt(0)}
                        </div>
                    )}
                </div>
                <h4 className="font-black text-2xl text-brand-dark mb-1">{author?.name || authorFallbackName}</h4>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 bg-gray-50 inline-block px-3 py-1 rounded-full">{author?.role || 'Especialista em Viagens'}</p>
                <p className="text-gray-600 font-serif italic text-base mb-8 leading-relaxed">
                    {author?.bio ? `"${author.bio}"` : '"Apaixonado por descobrir lugares novos e compartilhar dicas que não estão nos guias turísticos."'}
                </p>
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        openAiChat({
                            message: `Olá! Gostaria de falar com o especialista ${author?.name || authorFallbackName} sobre viagens.`
                        });
                    }}
                    className="btn-whatsapp btn-specialist block w-full py-4 bg-white border-2 border-brand-dark text-brand-dark font-black tracking-wide text-sm uppercase rounded-xl hover:bg-brand-dark hover:text-white transition-colors shadow-[4px_4px_0px_#0f172a] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] text-center"
                    data-tracking="sidebar-blog-post"
                >
                    Falar com Especialista
                </button>
            </div>

            <div className="bg-white/50 backdrop-blur-sm p-2 rounded-3xl hidden lg:block">
                <h3 className="font-black text-xl text-gray-800 mb-6 pl-2 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-brand-vibrant rounded-full"></span>
                    Leia Também
                </h3>
                <div className="space-y-4">
                    {relatedPosts.map(related => (
                        <a href={getBlogPostUrl(related.slug)} key={related.slug} className="group flex gap-5 items-center bg-white p-4 rounded-2xl hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-gray-100 duration-300">
                            <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-gray-100 shadow-sm relative">
                                <img src={optimizeRemoteImageUrl(related.image, 200, 200)} alt={related.title} width="200" height="200" loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            </div>
                            <div className="flex flex-col h-full justify-center">
                                <div className="mb-2">
                                    <span className={`inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${getCategoryColor(related.category)} bg-opacity-50`}>
                                        {related.category}
                                    </span>
                                </div>
                                <h5 className="font-bold text-gray-800 leading-tight group-hover:text-brand-cyan transition-colors text-base mb-2 font-sans">
                                    {related.title}
                                </h5>
                                <span className="text-xs text-gray-400 font-bold flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> 5 min
                                </span>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
};
