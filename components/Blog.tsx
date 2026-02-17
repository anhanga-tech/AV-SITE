import React, { useState } from 'react';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import User from 'lucide-react/dist/esm/icons/user';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Tag from 'lucide-react/dist/esm/icons/tag';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import { BLOG_POSTS } from '../data/blogData';
import { SocialShare } from './SocialShare';
import { getBlogHomeUrl, getBlogPostUrl } from '../utils/blog';
import { optimizeRemoteImageUrl } from '../data/mediaConfig';

const Blog: React.FC = () => {
    const [hoveredId, setHoveredId] = useState<number | null>(null);

    // Pegamos apenas os primeiros 4 posts para a home
    const displayPosts = BLOG_POSTS.slice(0, 4);
    const featuredPost = displayPosts.find(p => p.isFeatured) || displayPosts[0];
    const gridPosts = displayPosts.filter(p => p.id !== featuredPost.id).slice(0, 3);

    return (
        <section id="blog" className="py-24 bg-white relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-cyan/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-full h-24 bg-[#fffdf5] skew-y-2 translate-y-12"></div>

            <div className="container mx-auto px-6 relative z-10">
                {/* Header Section */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-brand-dark bg-brand-yellow text-brand-dark font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_#0f172a] transform -rotate-2 mb-4">
                        <BookOpen className="w-4 h-4" /> Diário de Bordo
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-brand-dark mb-4">
                        Histórias & <span className="text-brand-cyan border-b-8 border-brand-cyan/20 px-1 inline-block">Dicas</span>
                    </h2>
                    <p className="text-gray-500 font-medium text-lg max-w-2xl mx-auto">
                        Inspiração real para sua próxima aventura. Sem filtros, só verdades.
                    </p>
                </div>

                {/* Featured Post Layout */}
                {featuredPost && (
                    <div className="mb-16 group cursor-pointer relative">
                        <a href={getBlogPostUrl(featuredPost.slug)}>
                            <div className="bg-[#fffdf5] rounded-[2.5rem] p-6 md:p-8 border-4 border-gray-100 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] flex flex-col md:flex-row gap-8 items-center transition-transform duration-300 hover:scale-[1.01]">

                                {/* Featured Image */}
                                <div className="w-full md:w-1/2 relative">
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-8 bg-brand-cyan/20 backdrop-blur-sm border-l border-r border-white/60 -rotate-2 shadow-sm z-20"></div>
                                    <div className="rounded-2xl overflow-hidden aspect-video border-2 border-white shadow-md">
                                        <img
                                            src={optimizeRemoteImageUrl(featuredPost.image, 960, 540)}
                                            alt={featuredPost.title}
                                            loading="lazy"
                                            decoding="async"
                                            className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                                        />
                                    </div>
                                    <div className="absolute bottom-4 left-4 bg-white px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider text-brand-dark shadow-sm">
                                        Destaque da Semana
                                    </div>
                                    <div className="absolute bottom-4 right-4 z-30">
                                        <SocialShare
                                            minimal
                                            url={getBlogPostUrl(featuredPost.slug)}
                                            title={featuredPost.title}
                                            excerpt={featuredPost.excerpt}
                                        />
                                    </div>
                                </div>

                                {/* Featured Content */}
                                <div className="w-full md:w-1/2 md:pr-8">
                                    <div className="flex items-center gap-3 mb-4 text-sm font-bold text-gray-400">
                                        <span className={`px-3 py-1 rounded-full ${featuredPost.color} bg-opacity-20 border`}>
                                            {featuredPost.category}
                                        </span>
                                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {featuredPost.date}</span>
                                    </div>
                                    <h3 className="text-3xl md:text-4xl font-black text-brand-dark mb-4 leading-tight group-hover:text-brand-cyan transition-colors">
                                        {featuredPost.title}
                                    </h3>
                                    <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                                        {featuredPost.excerpt}
                                    </p>
                                    <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-400 uppercase">Escrito por</span>
                                                <span className="text-sm font-black text-brand-dark">{featuredPost.author}</span>
                                            </div>
                                        </div>
                                        <span className="flex items-center gap-2 text-brand-cyan font-black uppercase tracking-wide group-hover:gap-4 transition-all">
                                            Ler Agora <ArrowRight className="w-5 h-5" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
                )}

                {/* Grid Posts */}
                <div className="grid md:grid-cols-3 gap-8">
                    {gridPosts.map((post) => (
                        <a
                            href={getBlogPostUrl(post.slug)}
                            key={post.id}
                            className={`
                                group bg-white rounded-3xl p-4 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.05)] border border-gray-100
                                transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl
                                ${post.rotate} hover:rotate-0 flex flex-col h-full
                            `}
                            onMouseEnter={() => setHoveredId(post.id)}
                            onMouseLeave={() => setHoveredId(null)}
                        >
                            {/* Image Area */}
                            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-5 bg-gray-100">
                                <img
                                    src={optimizeRemoteImageUrl(post.image, 640, 480)}
                                    alt={post.title}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-800 shadow-sm">
                                    {post.date}
                                </div>
                                <div className="absolute bottom-3 right-3 z-30">
                                    <SocialShare
                                        minimal
                                        url={getBlogPostUrl(post.slug)}
                                        title={post.title}
                                        excerpt={post.excerpt}
                                    />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 flex flex-col">
                                <div className="mb-3">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${post.color}`}>
                                        {post.category}
                                    </span>
                                </div>
                                <h4 className="text-xl font-extrabold text-gray-800 mb-3 leading-snug group-hover:text-brand-cyan transition-colors">
                                    {post.title}
                                </h4>
                                <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6 flex-1 line-clamp-3">
                                    {post.excerpt}
                                </p>

                                <div className="pt-4 border-t border-dashed border-gray-100 flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                                        <User className="w-3 h-3" /> {post.author}
                                    </span>
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${hoveredId === post.id ? 'bg-brand-cyan text-white' : 'bg-gray-100 text-gray-400'}`}>
                                        <ArrowRight className="w-4 h-4" />
                                    </span>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>

                {/* View More Button */}
                <div className="mt-16 text-center">
                    <a href={getBlogHomeUrl()} className="inline-flex items-center gap-2 px-8 py-4 bg-white border-2 border-gray-200 text-gray-600 rounded-full font-bold hover:border-brand-cyan hover:text-brand-cyan transition-all shadow-sm hover:shadow-md group">
                        <Sparkles className="w-4 h-4 text-brand-yellow fill-brand-yellow" />
                        Ver Todos os Artigos
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                </div>
            </div>
        </section>
    );
};

export default Blog;
