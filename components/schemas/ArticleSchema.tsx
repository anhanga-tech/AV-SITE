import React from 'react';
import { StructuredData } from './StructuredData';
import { ORGANIZATION_ID } from './schema-ids';
import { buildImageSchema, type ArticleImageCredit } from './article-image';
import { BRAND_LOGO_BLUE_URL } from '../../lib/media-assets';

interface ArticleSchemaProps {
    title: string;
    description: string;
    image: string;
    datePublished: string;
    dateModified?: string;
    authorName: string;
    authorImage?: string;
    /** Página do autor (/autor/<id>/), não a URL do post. */
    authorUrl?: string;
    /** @id do Person do autor, o mesmo emitido pelo PersonSchema do post e da /sobre. */
    authorEntityId?: string;
    authorSameAs?: string[];
    imageCredit?: ArticleImageCredit;
    url: string;
}

export const ArticleSchema: React.FC<ArticleSchemaProps> = ({
    title,
    description,
    image,
    datePublished,
    dateModified,
    authorName,
    authorImage,
    authorUrl,
    authorEntityId,
    authorSameAs,
    imageCredit,
    url
}) => (
  <StructuredData
    id="article"
    data={{
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": title,
      "image": buildImageSchema(image, imageCredit),
      "author": {
        "@type": "Person",
        ...(authorEntityId && { "@id": authorEntityId }),
        "name": authorName,
        ...(authorUrl && { "url": authorUrl }),
        ...(authorImage && { "image": authorImage }),
        ...(authorSameAs && authorSameAs.length > 0 && { "sameAs": authorSameAs })
      },
      "publisher": {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        "name": "Anhangá Viagens",
        "logo": {
          "@type": "ImageObject",
          "url": BRAND_LOGO_BLUE_URL
        }
      },
      "datePublished": datePublished,
      "dateModified": dateModified ?? datePublished,
      "description": description,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": url
      }
    }}
  />
);
