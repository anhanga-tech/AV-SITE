import React, { Suspense, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MDXProvider } from '@mdx-js/react';
import { AUTHORS } from '../data/blogData';
import { getAllPosts, type PostMeta } from '../lib/mdx';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import User from 'lucide-react/dist/esm/icons/user';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Tag from 'lucide-react/dist/esm/icons/tag';
import { getWhatsAppLink } from '../utils/whatsapp';
import { optimizeRemoteImageUrl } from '../data/mediaConfig';

import { SEO } from '../components/SEO';
import { ArticleSchema } from '../components/schemas/ArticleSchema';
import { BreadcrumbSchema } from '../components/schemas/BreadcrumbSchema';
import { PersonSchema } from '../components/schemas/PersonSchema';
import { SocialShare } from '../components/SocialShare';
import { getBlogHomeUrl, getBlogPostUrl } from '../utils/blog';
import { openAiChat } from '../utils/aiChat';
import { mdxComponents } from '../components/blog/mdxComponents';
import ChatCTA from '../components/blog/ChatCTA';

// Carregado no nível do módulo para o Vite processar em build time
const allMdxPosts = getAllPosts();

import { getCategoryColor } from '../utils/categoryColors';

// import.meta.glob deve ficar no nível do módulo para o Vite processar em build time
const mdxModuleMap = import.meta.glob<{ default: React.ComponentType }>(
    '/content/blog/*.mdx'
);

// Cache de lazy components por slug para evitar re-criação a cada render
const lazyComponentCache: Record<
    string,
    React.LazyExoticComponent<React.ComponentType>
> = {};

function getMdxComponent(
    slug: string
): React.LazyExoticComponent<React.ComponentType> | null {
    const key = `/content/blog/${slug}.mdx`;
    const importFn = mdxModuleMap[key];
    if (!importFn) return null;
    if (!lazyComponentCache[slug]) {
        lazyComponentCache[slug] = React.lazy(importFn);
    }
    return lazyComponentCache[slug];
}

const BlogPost: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const post: PostMeta | undefined = allMdxPosts.find(p => p.slug === slug);
    const author = post ? AUTHORS[post.author] ?? null : null;

    // Validate slug to avoid propagating arbitrary user input into structured data
    const isValidSlug = (value: unknown): value is string => {
        if (typeof value !== 'string') return false;
        // Allow only URL-safe slugs: letters, numbers, dashes and slashes
        return /^[a-zA-Z0-9\-\/]+$/.test(value);
    };

    const canonicalUrl = isValidSlug(slug) ? getBlogPostUrl(slug) : getBlogHomeUrl();

    // Scroll to top on load
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [slug]);

    if (!post) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#fffdf5]">
                <h2 className="text-4xl font-black text-brand-dark mb-4 text-center px-6">Ops! Artigo não encontrado.</h2>
                <a href="https://www.anhanga.tur.br/" className="text-brand-cyan font-bold hover:underline flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Voltar para o Blog
                </a>
            </div>
        );
    }

    // Related posts (excluding current)
    const relatedPosts = allMdxPosts.filter(p => p.slug !== slug).slice(0, 2);

    const sameAs = author?.social ? (Object.values(author.social).filter(Boolean) as string[]) : [];

    const MdxContent = getMdxComponent(slug!);

    return (
        <article className="min-h-screen bg-[#fffdf5]">
            <SEO
                title={post.title}
                description={post.excerpt}
                image={post.image}
                type="article"
                canonical={canonicalUrl}
            />
            <ArticleSchema
                title={post.title}
                description={post.excerpt}
                image={post.image}
                datePublished={post.date}
                dateModified={post.dateModified}
                authorName={author?.name || post.author}
                authorImage={author?.image}
                url={canonicalUrl}
            />
            {author && (
                <PersonSchema
                    name={author.name}
                    image={author.image}
                    description={author.bio}
                    jobTitle={author.role}
                    url={canonicalUrl}
                    sameAs={sameAs}
                />
            )}
            <BreadcrumbSchema items={[
                { name: 'Home', item: 'https://www.anhanga.tur.br/' },
                { name: 'Blog', item: getBlogHomeUrl() },
                { name: post.title, item: canonicalUrl }
            ]} />

            {/* Hero Header */}
            <div
                data-testid="blog-post-hero"
                className="relative min-h-[560px] w-full overflow-hidden md:min-h-[620px] lg:min-h-[680px]"
            >
                <img
                    src={optimizeRemoteImageUrl(post.image, 1200, 675)}
                    alt={post.title}
                    width="1200"
                    height="675"
                    className="absolute inset-0 h-full w-full object-cover"
                    fetchPriority="high"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/40 to-transparent opacity-90"></div>

                <div className="absolute inset-0 flex items-end pb-14 pt-36 md:pb-16 md:pt-40 lg:pb-20 lg:pt-44">
                    <div className="container mx-auto px-6">
                        <a href="https://www.anhanga.tur.br/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 font-bold uppercase tracking-wider text-xs transition-colors backdrop-blur-sm bg-white/10 px-4 py-2 rounded-full w-fit hover:bg-white/20 border border-white/20">
                            <ArrowLeft className="w-4 h-4" /> Voltar para o Blog
                        </a>
                        <div className="max-w-3xl">
                            <div className="flex items-center gap-3 mb-6">
                                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 ${getCategoryColor(post.category)} shadow-[4px_4px_0px_rgba(0,0,0,0.3)] font-black text-xs uppercase tracking-widest transform -rotate-1`}>
                                    <Tag className="w-3 h-3 fill-current opacity-50" />
                                    {post.category}
                                </span>
                            </div>

                            <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.05] tracking-tight drop-shadow-lg md:mb-8">
                                {post.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-4 border-t border-white/20 pt-4 font-medium text-white/90 md:gap-6 md:pt-6">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-md">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <span>Por <span className="font-bold text-white border-b-2 border-brand-yellow/50">{author?.name || post.author}</span></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-md">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <span>{post.date}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-md">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <span>5 min de leitura</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="container mx-auto px-6 relative z-10 -mt-20 mb-24">
                <div className="flex flex-col lg:flex-row gap-12">

                    {/* Main Content */}
                    <div className="w-full lg:w-2/3">
                        <div className="bg-white rounded-[2.5rem] p-8 md:p-14 shadow-xl border border-gray-100">

                            <div className="mb-6 pb-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${getCategoryColor(post.category)} bg-opacity-20 border`}>
                                        {post.category}
                                    </span>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{post.date}</span>
                                </div>
                                <SocialShare
                                    minimal
                                    url={canonicalUrl}
                                    title={post.title}
                                    excerpt={post.excerpt}
                                />
                            </div>

                            {post.historicalNotice && (
                                <div className="mb-8 p-6 bg-yellow-50 border-l-4 border-brand-yellow text-gray-700 rounded-r-2xl font-serif italic text-base md:text-lg">
                                    <div className="flex gap-3">
                                        <div className="shrink-0 mt-1">
                                            <svg className="w-5 h-5 text-brand-yellow" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <p className="whitespace-pre-wrap" role="status">{post.historicalNotice}</p>
                                    </div>
                                </div>
                            )}

                            {MdxContent ? (
                                <MDXProvider components={mdxComponents}>
                                    <div className="
                                        prose md:prose-lg xl:prose-xl max-w-none
                                        prose-headings:font-sans prose-headings:font-black prose-headings:tracking-tight prose-headings:text-brand-dark
                                        prose-p:font-serif prose-p:text-gray-600 prose-p:leading-8 prose-p:mb-6
                                        prose-a:text-brand-cyan prose-a:font-bold prose-a:no-underline prose-a:border-b-2 prose-a:border-brand-cyan/30 hover:prose-a:border-brand-cyan hover:prose-a:text-brand-cyanDark hover:prose-a:bg-brand-cyan/5 prose-a:transition-all
                                        prose-strong:text-brand-dark prose-strong:font-black
                                        prose-ul:list-disc prose-ul:pl-6 prose-ul:marker:text-brand-yellow
                                        prose-li:font-serif prose-li:text-gray-600
                                        prose-blockquote:border-l-4 prose-blockquote:border-brand-yellow prose-blockquote:bg-yellow-50 prose-blockquote:py-4 prose-blockquote:px-8 prose-blockquote:rounded-r-2xl prose-blockquote:not-italic prose-blockquote:font-serif prose-blockquote:text-gray-700
                                        first-letter:text-[4.5rem] first-letter:font-black first-letter:text-brand-dark first-letter:float-left first-letter:leading-none first-letter:mr-2 first-letter:mt-1
                                    ">
                                        <Suspense fallback={
                                            <div className="animate-pulse space-y-4">
                                                <div className="h-4 bg-gray-200 rounded w-3/4" />
                                                <div className="h-4 bg-gray-200 rounded w-full" />
                                                <div className="h-4 bg-gray-200 rounded w-5/6" />
                                            </div>
                                        }>
                                            <MdxContent />
                                        </Suspense>
                                    </div>
                                </MDXProvider>
                            ) : (
                                <div className="prose md:prose-lg xl:prose-xl max-w-none prose-p:font-serif prose-p:text-gray-600 prose-p:leading-8">
                                    <p>{post.excerpt}</p>
                                    <p className="text-gray-400 italic">Conteúdo completo em breve…</p>
                                </div>
                            )}

                            {post.showChatCTA && <ChatCTA destino={post.chatCTADestination} />}

                            <div className="mt-12 pt-8 border-t-2 border-dashed border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-brand-dark text-lg">Gostou? Espalhe a palavra:</span>
                                </div>
                                <SocialShare
                                    url={canonicalUrl}
                                    title={post.title}
                                    excerpt={post.excerpt}
                                />
                            </div>

                            {/* Mobile-First Related Posts (Below Content) */}
                            <div className="mt-12 lg:hidden border-t border-gray-100 pt-10">
                                <h3 className="font-black text-2xl text-brand-dark mb-6 flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-brand-vibrant rounded-full"></span>
                                    Leia Também
                                </h3>
                                <div className="grid sm:grid-cols-2 gap-6">
                                    {relatedPosts.map(related => (
                                        <a href={getBlogPostUrl(related.slug)} key={`mobile-${related.slug}`} className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                            <div className="aspect-video w-full overflow-hidden relative">
                                                <img src={optimizeRemoteImageUrl(related.image, 400, 225)} alt={related.title} width="400" height="225" loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                <div className="absolute top-3 left-3">
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${getCategoryColor(related.category)} bg-opacity-90 backdrop-blur-sm bg-white shadow-sm`}>
                                                        {related.category}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <h5 className="font-bold text-gray-800 leading-tight group-hover:text-brand-cyan transition-colors text-base mb-2">
                                                    {related.title}
                                                </h5>
                                                <div className="flex items-center gap-3 text-xs text-gray-400 font-bold">
                                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 5 min</span>
                                                    <span>•</span>
                                                    <span>{related.date}</span>
                                                </div>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar (Desktop only for Related Posts) */}
                    <div className="w-full lg:w-1/3">
                        <div className="sticky top-32 space-y-8">
                            <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 text-center relative overflow-hidden shadow-lg group hover:border-brand-yellow/30 transition-colors">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/10 rounded-bl-full -mr-10 -mt-10 transition-all group-hover:scale-110"></div>
                                <div className="w-28 h-28 bg-gray-200 rounded-full mx-auto mb-6 overflow-hidden border-[6px] border-white shadow-xl relative z-10">
                                    {author?.image ? (
                                        <img src={author.image} alt={author.name} width="112" height="112" loading="lazy" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-brand-dark text-white text-4xl font-black">
                                            {(author?.name || post.author).charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <h4 className="font-black text-2xl text-brand-dark mb-1">{author?.name || post.author}</h4>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 bg-gray-50 inline-block px-3 py-1 rounded-full">{author?.role || 'Travel Expert'}</p>
                                <p className="text-gray-600 font-serif italic text-base mb-8 leading-relaxed">
                                    {author?.bio ? `"${author.bio}"` : '"Apaixonado por descobrir lugares novos e compartilhar dicas que não estão nos guias turísticos."'}
                                </p>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        openAiChat({
                                            message: `Olá! Gostaria de falar com o especialista ${author?.name || post.author} sobre viagens.`
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
                    </div>
                </div>

                {/* Final CTA Section */}
                <div className="mt-24 bg-brand-dark rounded-[3rem] p-10 md:p-16 text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-cyan/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-6 relative z-10">
                        Gostou do conteúdo? <br />
                        <span className="text-brand-cyan">Sua viagem começa aqui.</span>
                    </h2>
                    <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto relative z-10">
                        Transformamos essas inspirações em um roteiro real e exclusivo para você.
                    </p>
                    <a
                        href={getWhatsAppLink(`Olá! Li o post "${post.title}" e gostaria de planejar minha viagem.`, { appendTrackingRef: true })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-whatsapp btn-specialist inline-flex items-center gap-3 bg-brand-cyan text-white text-lg font-bold px-10 py-5 rounded-2xl shadow-[4px_4px_0px_#ffffff20] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all relative z-10"
                        data-tracking="footer-blog-post"
                    >
                        Conversar com um Especialista
                    </a>
                </div>
            </div>
        </article>
    );
};

export default BlogPost;
