import React, { Suspense } from 'react';
import { MDXProvider } from '@mdx-js/react';
import Clock from 'lucide-react/dist/esm/icons/clock';
import { PostMeta } from '../../lib/mdx';
import { mdxComponents } from './mdxComponents';
import ChatCTA from './ChatCTA';
import { SocialShare } from '../SocialShare';
import { getCategoryColor } from '../../utils/categoryColors';
import { getBlogPostUrl, formatDate } from '../../utils/blog';
import { optimizeRemoteImageUrl } from '../../data/mediaConfig';

interface BlogPostContentProps {
    post: PostMeta;
    canonicalUrl: string;
    MdxContent: React.LazyExoticComponent<React.ComponentType> | null;
    relatedPosts: PostMeta[];
}

export const BlogPostContent: React.FC<BlogPostContentProps> = ({ post, canonicalUrl, MdxContent, relatedPosts }) => {
    return (
        <div className="bg-white rounded-[2.5rem] p-8 md:p-14 shadow-xl border border-gray-100">

            <div className="mb-6 pb-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${getCategoryColor(post.category)}`}>
                        {post.category}
                    </span>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{formatDate(post.date)}</span>
                </div>
                <SocialShare
                    minimal
                    url={canonicalUrl}
                    title={post.title}
                    excerpt={post.excerpt}
                />
            </div>

            {post.historicalNotice && (
                <div className="mb-8 p-6 bg-yellow-50 border-2 border-brand-yellow text-brand-dark rounded-2xl font-serif italic text-base md:text-lg">
                    <div className="flex gap-3">
                        <div className="shrink-0 mt-1">
                            <svg className="w-5 h-5 text-brand-yellow" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
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
                        prose md:prose-lg max-w-none
                        prose-headings:font-sans prose-headings:font-black prose-headings:tracking-tight prose-headings:text-brand-dark
                        prose-p:font-serif prose-p:text-gray-600 prose-p:leading-relaxed prose-p:mb-6
                        prose-a:text-brand-cyan prose-a:font-bold prose-a:no-underline prose-a:border-b-2 prose-a:border-brand-cyan/30 hover:prose-a:border-brand-cyan hover:prose-a:text-brand-cyanDark hover:prose-a:bg-brand-cyan/5 prose-a:transition-all
                        prose-strong:text-brand-dark prose-strong:font-black
                        prose-ul:list-disc prose-ul:pl-6 prose-ul:marker:text-brand-yellow
                        prose-li:font-serif prose-li:text-gray-600
                        prose-blockquote:border-2 prose-blockquote:border-brand-yellow/40 prose-blockquote:bg-yellow-50 prose-blockquote:py-4 prose-blockquote:px-8 prose-blockquote:rounded-2xl prose-blockquote:not-italic prose-blockquote:font-serif prose-blockquote:text-brand-dark
                        first-letter:text-[3rem] first-letter:md:text-[4.5rem] first-letter:font-black first-letter:text-brand-dark first-letter:float-left first-letter:leading-none first-letter:mr-2 first-letter:mt-1
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
                <div className="prose md:prose-lg max-w-none prose-p:font-serif prose-p:text-gray-600 prose-p:leading-relaxed">
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
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {related.readingTime}</span>
                                    <span>•</span>
                                    <span>{related.date}</span>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
};
