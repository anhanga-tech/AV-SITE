import React from 'react';

import { ArticleSchema } from '../schemas/ArticleSchema';
import { BreadcrumbSchema } from '../schemas/BreadcrumbSchema';
import { FAQPageSchema } from '../schemas/FAQPageSchema';
import { PersonSchema } from '../schemas/PersonSchema';
import type { Author } from '../../data/blogData';
import type { PostMeta } from '../../lib/mdx';
import { getBlogHomeUrl } from '../../utils/blog';

interface BlogPostSchemasProps {
    post: PostMeta;
    author: Author | null;
    canonicalUrl: string;
}

export const BlogPostSchemas: React.FC<BlogPostSchemasProps> = ({ post, author, canonicalUrl }) => {
    const sameAs = author?.social ? (Object.values(author.social).filter(Boolean) as string[]) : [];

    return (
        <>
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
            {post.faq && post.faq.length > 0 && <FAQPageSchema items={post.faq} />}
            <BreadcrumbSchema items={[
                { name: 'Home', item: 'https://www.anhanga.tur.br/' },
                { name: 'Blog', item: getBlogHomeUrl() },
                { name: post.title, item: canonicalUrl }
            ]} />
        </>
    );
};
