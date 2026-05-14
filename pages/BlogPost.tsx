import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { SEO } from '../components/SEO';
import { ArticleSchema } from '../components/schemas/ArticleSchema';
import { BreadcrumbSchema } from '../components/schemas/BreadcrumbSchema';
import { PersonSchema } from '../components/schemas/PersonSchema';
import { BlogPostContent } from '../components/blog/BlogPostContent';
import { BlogPostFinalCTA } from '../components/blog/BlogPostFinalCTA';
import { BlogPostHero } from '../components/blog/BlogPostHero';
import { BlogPostSidebar } from '../components/blog/BlogPostSidebar';
import { AUTHORS } from '../data/blogData';
import { getAllPosts, type PostMeta } from '../lib/mdx';
import { getBlogHomeUrl, getBlogPostUrl } from '../utils/blog';

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
                <a href={getBlogHomeUrl()} className="text-brand-cyan font-bold hover:underline flex items-center gap-2">
                    <ArrowLeft className="size-4" /> Voltar para o Blog
                </a>
            </div>
        );
    }

    const CATEGORY_MATCH_SCORE = 3;

    // Related posts: prioriza mesma categoria e tags em comum
    const relatedPosts = allMdxPosts
        .filter(p => p.slug !== slug)
        .sort((a, b) => {
            const score = (p: typeof allMdxPosts[0]) => {
                let s = 0;
                if (p.category === post.category) s += CATEGORY_MATCH_SCORE;
                s += p.tags.filter(t => post.tags.includes(t)).length;
                return s;
            };
            return score(b) - score(a);
        })
        .slice(0, 2);

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

            <div className="container mx-auto px-6 relative z-10 mt-8 mb-24">
                <div className="flex flex-col lg:flex-row gap-12">
                    <div className="w-full lg:w-2/3">
                        <BlogPostContent
                            post={post}
                            canonicalUrl={canonicalUrl}
                            MdxContent={MdxContent}
                            relatedPosts={relatedPosts}
                        />
                    </div>

                    <div className="w-full lg:w-1/3">
                        <BlogPostSidebar
                            author={author}
                            authorFallbackName={post.author}
                            relatedPosts={relatedPosts}
                        />
                    </div>
                </div>

                <BlogPostFinalCTA post={post} />
            </div>
        </article>
    );
};

export default BlogPost;
