import React from 'react';
import { StructuredData } from './StructuredData';

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
          "url": "https://www.anhanga.tur.br/assets/LOGO%20ANHANGA%20VIAGENS%20-%20AZUL.svg"
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
