import React from 'react';
import { StructuredData } from './StructuredData';
import { BRAND_LOGO_BLUE_URL } from '../../lib/media-assets';

interface ArticleSchemaProps {
    title: string;
    description: string;
    image: string;
    datePublished: string;
    dateModified?: string;
    authorName: string;
    authorImage?: string;
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
    url
}) => (
  <StructuredData
    id="article"
    data={{
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": title,
      "image": image,
      "author": {
        "@type": "Person",
        "name": authorName,
        ...(authorImage && { "image": authorImage })
      },
      "publisher": {
        "@type": "Organization",
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
