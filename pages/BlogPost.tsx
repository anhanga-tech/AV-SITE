import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AUTHORS } from '../data/blogData';
import { getAllPosts, type PostMeta } from '../lib/mdx';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import Clock from 'lucide-react/dist/esm/icons/clock';
import { optimizeRemoteImageUrl } from '../data/mediaConfig';

import { SEO } from '../components/SEO';
import { ArticleSchema } from '../components/schemas/ArticleSchema';
import { BreadcrumbSchema } from '../components/schemas/BreadcrumbSchema';
import { PersonSchema } from '../components/schemas/PersonSchema';
import { getBlogHomeUrl, getBlogPostUrl } from '../utils/blog';
import { getCategoryColor } from '../utils/categoryColors';

// Sub-components
import { BlogPostHero } from '../components/blog/BlogPostHero';
import { BlogPostContent } from '../components/blog/BlogPostContent';
import { BlogPostSidebar } from '../components/blog/BlogPostSidebar';
import { BlogPostFinalCTA } from '../components/blog/BlogPostFinalCTA';

// Carregado no nível do módulo para o Vite processar em build time
const allMdxPosts = getAllPosts();

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

            <BlogPostHero post={post} authorName={author?.name || post.author} />

            {/* Content Area */}
            <div className="container mx-auto px-6 relative z-10 -mt-20 mb-24">
                <div className="flex flex-col lg:flex-row gap-12">

                    {/* Main Content */}
                    <div className="w-full lg:w-2/3">
                        <BlogPostContent post={post} canonicalUrl={canonicalUrl} MdxContent={MdxContent} />

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

                    {/* Sidebar (Desktop only for Related Posts) */}
                    <div className="w-full lg:w-1/3">
                        <BlogPostSidebar author={author} authorFallbackName={post.author} relatedPosts={relatedPosts} />
                    </div>
                </div>

                <BlogPostFinalCTA post={post} />
            </div>
        </article>
    );
};

export default BlogPost;
