import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { trackTraks } from '../utils/traks';

import { Seo } from '../components/Seo';
import { BlogPostContent } from '../components/blog/BlogPostContent';
import { BlogPostFinalCTA } from '../components/blog/BlogPostFinalCTA';
import { BlogPostHero } from '../components/blog/BlogPostHero';
import { BlogPostSchemas } from '../components/blog/BlogPostSchemas';
import { BlogPostSidebar } from '../components/blog/BlogPostSidebar';
import { AUTHORS } from '../data/blogData';
import { getAllPosts, type PostMeta } from '../lib/mdx';
import { getBlogHomeUrl, getBlogPostUrl } from '../utils/blog';

function isValidSlug(value: unknown): value is string {
    if (typeof value !== 'string') return false;
    return /^[a-zA-Z0-9\-/]+$/.test(value);
}

// Carregado no nível do módulo para o Vite processar em build time
const allMdxPosts = getAllPosts();

// eager: true resolve todos os módulos MDX em build time, no nível do módulo — sem
// React.lazy/Suspense, o conteúdo do post fica disponível de forma síncrona durante o
// SSR (renderToPipeableStream nunca aguarda um Suspense boundary suspenso: sem esse
// eager, o corpo real do post caía num streaming fora de ordem, resolvido só por JS
// no cliente — ver issue #1249). BlogPost já é uma rota lazy-carregada em App.tsx, então
// empacotar os ~29 posts juntos não afeta o bundle inicial da aplicação.
const mdxModuleMap = import.meta.glob<{ default: React.ComponentType }>(
    '/content/blog/*.mdx',
    { eager: true }
);

function getMdxComponent(slug: string): React.ComponentType | null {
    const key = `/content/blog/${slug}.mdx`;
    return mdxModuleMap[key]?.default ?? null;
}

const BlogPost: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const post: PostMeta | undefined = allMdxPosts.find(p => p.slug === slug);
    const author = post ? AUTHORS[post.author] ?? null : null;

    const canonicalUrl = isValidSlug(slug) ? getBlogPostUrl(slug) : getBlogHomeUrl();

    // Scroll to top on load
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [slug]);

    if (!post) {
        // Blog inexistente é 404 para o usuário: alimenta a mesma métrica do Traks.
        trackTraks('page_not_found');
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-brand-surface">
                <h2 className="text-4xl font-black text-brand-dark mb-4 text-center px-6">Ops! Artigo não encontrado.</h2>
                <a href={getBlogHomeUrl()} className="text-brand-cyan font-bold hover:underline flex items-center gap-2">
                    <ArrowLeft className="size-4" /> Voltar para o Blog
                </a>
            </div>
        );
    }

    const CATEGORY_MATCH_SCORE = 3;

    // Related posts: prioriza mesma categoria e tags em comum.
    // Perf: um único passo (for...of) filtra o post atual e pontua os candidatos,
    // evitando as duas varreduras de um .filter().map() encadeado. O score de cada
    // post é calculado UMA vez (transformação de Schwartz) em vez de dentro do
    // comparador — o `sort` o invoca O(n log n) vezes, então pontuar ali repetia o
    // mesmo trabalho. Um Set das tags do post atual troca o `includes` (varredura
    // O(t) por tag) por lookup O(1). `Array.sort` é estável, então a ordem de
    // empates permanece idêntica à versão anterior.
    const postTagSet = new Set(post.tags);
    const scoredPosts: Array<{ post: PostMeta; score: number }> = [];
    for (const candidate of allMdxPosts) {
        if (candidate.slug === slug) continue;
        let score = candidate.category === post.category ? CATEGORY_MATCH_SCORE : 0;
        for (const tag of candidate.tags) {
            if (postTagSet.has(tag)) score += 1;
        }
        scoredPosts.push({ post: candidate, score });
    }
    const relatedPosts = scoredPosts
        .sort((a, b) => b.score - a.score)
        .slice(0, 2)
        .map(entry => entry.post);

    const MdxContent = getMdxComponent(slug!);

    return (
        <article className="min-h-screen bg-brand-surface">
            <Seo
                title={post.seoTitle ?? post.title}
                description={post.seoDescription ?? post.excerpt}
                image={post.image}
                type="article"
                canonical={canonicalUrl}
            />
            <BlogPostSchemas post={post} author={author} canonicalUrl={canonicalUrl} />

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
