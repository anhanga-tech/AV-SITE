import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllPosts } from '../lib/mdx';
import { AUTHORS } from '../data/blogData';
import User from 'lucide-react/dist/esm/icons/user';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Search from 'lucide-react/dist/esm/icons/search';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import { SocialShare } from '../components/SocialShare';
import { getBlogPostUrl, getBlogHomeUrl, formatDate } from '../utils/blog';
import { optimizeRemoteImageUrl } from '../data/mediaConfig';
import { getCategoryColor } from '../utils/categoryColors';
import { SEO } from '../components/SEO';
import { BreadcrumbSchema } from '../components/schemas/BreadcrumbSchema';
import { openContactModal } from '../utils/contactForm';

/**
 * BlogList Page - Optimized with CSS hover
 *
 * PERFORMANCE WIN:
 * 1. Removed 'hoveredId' state which caused page re-renders on mouse over.
 * 2. Replaced with Tailwind 'group-hover' for CSS-native reactive styling.
 */

const allPosts = getAllPosts();

const BlogList: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const term = searchTerm.toLowerCase();
    const filteredPosts = allPosts.filter(post =>
        post.title.toLowerCase().includes(term) ||
        post.category.toLowerCase().includes(term) ||
        post.tags.some(tag => tag.toLowerCase().includes(term))
    );

    return (
        <>
            <SEO
                title="Blog de Viagens e Dicas Práticas"
                description="Roteiros práticos, dicas de insider e destinos que valem cada centavo. Planejamento de viagem do jeito que deveria ser. Leia no blog da Anhangá!"
                canonical={getBlogHomeUrl()}
            />
            <BreadcrumbSchema items={[
                { name: 'Home', item: 'https://www.anhanga.tur.br/' },
                { name: 'Blog', item: getBlogHomeUrl() }
            ]} />
            <div className="min-h-screen bg-[#fffdf5] pt-32 md:pt-36 lg:pt-40 pb-24">
                <div className="container mx-auto px-6">

                {/* Header */}
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-brand-dark bg-brand-yellow text-brand-dark font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_#0f172a] transform -rotate-1 mb-4">
                        <BookOpen className="w-4 h-4" /> Todos os Artigos
                    </div>
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-brand-dark mb-6">
                        Diário de <span className="text-brand-cyan">Bordo</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-500 font-medium mb-6">
                        Explore nosso acervo completo de dicas, roteiros e segredos de viagem.
                    </p>

                    {/* Search Bar */}
                    <div className="relative max-w-lg mx-auto">
                        <label htmlFor="blog-search-input" className="sr-only">Buscar artigos</label>
                        <input
                            id="blog-search-input"
                            type="text"
                            placeholder="Buscar por título ou categoria..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-6 py-4 rounded-full border-2 border-gray-200 focus:border-brand-cyan focus:outline-none shadow-sm pl-12 text-gray-700 font-medium transition-all"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    </div>
                </div>

                {/* Grid */}
                {filteredPosts.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredPosts.map((post, index) => (
                            <Link
                                to={`/blog/${post.slug}`}
                                key={post.slug}
                                className={`
                                group bg-white rounded-3xl p-5 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.05)] border border-gray-100
                                transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl
                                flex flex-col h-full relative z-10
                            `}
                            >
                                {/* Image Area — aspect ratio alternado para ritmo visual */}
                                <div className={`relative ${index % 3 === 1 ? 'aspect-[4/3]' : index % 3 === 2 ? 'aspect-video' : 'aspect-[16/10]'} rounded-2xl overflow-hidden mb-5 bg-gray-100`}>
                                    <img
                                        src={optimizeRemoteImageUrl(post.image, 640, 400)}
                                        alt={post.title}
                                        width="640"
                                        height="400"
                                        loading="lazy"
                                        decoding="async"
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-800 shadow-sm">
                                        {formatDate(post.date)}
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
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${getCategoryColor(post.category)}`}>
                                            {post.category}
                                        </span>
                                    </div>
                                    <h4 className="text-2xl font-extrabold text-gray-800 mb-3 leading-tight group-hover:text-brand-cyan transition-colors">
                                        {post.title}
                                    </h4>
                                    <p className="text-gray-500 font-medium leading-relaxed mb-6 flex-1 line-clamp-3">
                                        {post.excerpt}
                                    </p>

                                    <div className="pt-4 border-t border-dashed border-gray-100 flex items-center justify-between">
                                        <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                                            <User className="w-3 h-3" /> {AUTHORS[post.author]?.name ?? post.author}
                                        </span>
                                        <span className="w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-gray-100 text-gray-400 group-hover:bg-brand-cyan group-hover:text-white">
                                            <ArrowRight className="w-5 h-5" />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-gray-400 text-lg font-medium">Nenhum artigo encontrado com esse termo. 🕵️‍♂️</p>
                    </div>
                )}

                {/* Final CTA Section */}
                <div className="mt-24 bg-brand-cyan/10 rounded-[3rem] p-10 md:p-16 text-center border-2 border-brand-cyan/20">
                    <h2 className="text-3xl md:text-5xl font-black text-brand-dark mb-6">
                        Pronto para transformar essas dicas em <span className="text-brand-cyan">Realidade?</span>
                    </h2>
                    <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                        Fale com nossos especialistas e comece a planejar sua viagem personalizada hoje mesmo.
                    </p>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            openContactModal({ source: 'blog-list' });
                        }}
                        className="btn-whatsapp btn-specialist inline-flex items-center gap-3 bg-brand-dark text-white text-lg font-bold px-10 py-5 rounded-2xl shadow-[4px_4px_0px_#fbbf24] hover:shadow-[2px_2px_0px_#fbbf24] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                        data-tracking="footer-blog-list"
                    >
                        Solicitar Orçamento
                    </button>
                </div>
                </div>
            </div>
        </>
    );
};

export default BlogList;
