import React from 'react';

import { ArticleSchema } from '../schemas/ArticleSchema';
import { BreadcrumbSchema } from '../schemas/BreadcrumbSchema';
import { FAQPageSchema } from '../schemas/FAQPageSchema';
import { PersonSchema } from '../schemas/PersonSchema';
import { ORGANIZATION_ID } from '../schemas/schema-ids';
import type { ArticleImageCredit } from '../schemas/ArticleSchema';
import type { Author } from '../../data/blogData';
import type { PostMeta } from '../../lib/mdx';
import { getAuthorEntityId, getAuthorUrl } from '../../utils/author';
import { getBlogHomeUrl } from '../../utils/blog';

const ORG_NAME = 'Anhangá Viagens';
const ORG_URL = 'https://www.anhanga.tur.br/';

// Só crédito confirmado vira ImageObject com autoria. `unknown` (ou sem texto de crédito)
// devolve undefined e o schema mantém a URL pura da capa.
function getConfirmedImageCredit(post: PostMeta): ArticleImageCredit | undefined {
    if (post.imageCreditStatus !== 'confirmed' || !post.imageCredit) return undefined;
    return {
        credit: post.imageCredit,
        source: post.imageSource,
        licenseUrl: post.imageLicenseUrl
    };
}

interface BlogPostSchemasProps {
    post: PostMeta;
    author: Author | null;
    canonicalUrl: string;
}

export const BlogPostSchemas: React.FC<BlogPostSchemasProps> = ({ post, author, canonicalUrl }) => {
    const sameAs = author?.social ? (Object.values(author.social).filter(Boolean) as string[]) : [];
    const authorUrl = author ? getAuthorUrl(author.id) : undefined;
    const authorEntityId = author ? getAuthorEntityId(author.id) : undefined;

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
                authorUrl={authorUrl}
                authorEntityId={authorEntityId}
                authorSameAs={sameAs}
                imageCredit={getConfirmedImageCredit(post)}
                url={canonicalUrl}
            />
            {author && (
                <PersonSchema
                    name={author.name}
                    image={author.image}
                    description={author.bio}
                    jobTitle={author.role}
                    url={authorUrl}
                    entityId={authorEntityId}
                    sameAs={sameAs}
                    worksFor={{ name: ORG_NAME, url: ORG_URL, id: ORGANIZATION_ID }}
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
