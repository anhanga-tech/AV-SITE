import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Tag, User, Calendar, Clock } from 'lucide-react';
import { PostMeta } from '../../lib/mdx';
import { optimizeRemoteImageUrl } from '../../data/mediaConfig';
import { getCategoryColor } from '../../utils/categoryColors';
import { formatDate } from '../../utils/blog';

/**
 * Phones only. Matches Tailwind's `sm` boundary: above it the hero is wide
 * enough for the 16:9 crop to cover without upscaling.
 */
const MOBILE_HERO_MEDIA = '(max-width: 640px)';

/**
 * Só a capa do artigo. Medido no Rock in Rio (issue #1602): 1200x675 em AVIF
 * caiu de 218.912 para 155.559 bytes (-29%) sem diferença visível sob o
 * gradiente que escurece o hero. Fica aqui, e não no preset, porque os degraus
 * 16:9 são compartilhados com o pôster da home — mexer no preset moveria os
 * dois de uma vez.
 */
const HERO_QUALITY = 72;

interface BlogPostHeroProps {
    post: PostMeta;
    authorName: string;
}

export const BlogPostHero: React.FC<BlogPostHeroProps> = ({ post, authorName }) => {
    return (
        <div
            data-testid="blog-post-hero"
            className="relative min-h-[560px] w-full overflow-hidden md:min-h-[620px] lg:min-h-[680px]"
        >
            <picture>
                {/*
                    Art direction, not just a smaller variant. The hero box is
                    taller than it is wide on phones (412x560 at the default
                    min-h), so a 16:9 cover crop had to be scaled up to fill it:
                    the browser painted ~1 image pixel per CSS pixel on a DPR
                    1.75 screen — the heaviest file on the page AND the softest
                    result. The 3:4 crop matches the box, so it lands at exactly
                    1.75 image px per CSS px while weighing less. Issue #1602.
                */}
                <source
                    media={MOBILE_HERO_MEDIA}
                    srcSet={optimizeRemoteImageUrl(post.image, 720, 960, undefined, HERO_QUALITY)}
                />
                <img
                    src={optimizeRemoteImageUrl(post.image, 1200, 675, undefined, HERO_QUALITY)}
                    alt={post.title}
                    width="1200"
                    height="675"
                    className="absolute inset-0 h-full w-full object-cover"
                    fetchPriority="high"
                />
            </picture>
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/40 to-transparent opacity-90"></div>

            <div className="absolute inset-0 flex items-end pb-14 pt-36 md:pb-16 md:pt-40 lg:pb-20 lg:pt-44">
                <div className="container mx-auto px-6">
                    <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 font-bold uppercase tracking-wider text-xs transition-colors backdrop-blur-sm bg-white/10 px-4 py-2 rounded-full w-fit hover:bg-white/20 border border-white/20">
                        <ArrowLeft className="size-4" /> Voltar para o Blog
                    </Link>
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-3 mb-6">
                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 ${getCategoryColor(post.category)} shadow-[4px_4px_0px_rgba(0,0,0,0.3)] font-black text-xs uppercase tracking-widest transform -rotate-1`}>
                                <Tag className="size-3 fill-current opacity-50" />
                                {post.category}
                            </span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.05] tracking-tight drop-shadow-lg md:mb-8">
                            {post.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-4 border-t border-white/20 pt-4 font-medium text-white/90 md:gap-6 md:pt-6">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-md">
                                    <User className="size-4" />
                                </div>
                                <span>Por <span className="font-bold text-white border-b-2 border-brand-yellow/50">{authorName}</span></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-md">
                                    <Calendar className="size-4" />
                                </div>
                                <span>{formatDate(post.date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-md">
                                    <Clock className="size-4" />
                                </div>
                                <span>{post.readingTime}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
