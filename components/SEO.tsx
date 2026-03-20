import React from 'react';
import { useHeadTags } from '../lib/head';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article';
  keywords?: string;
  robots?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title = 'Anhangá Viagens | Agência de Viagens Personalizadas',
  description = 'Agência de viagens boutique em São Paulo com roteiros personalizados, experiências no Brasil e no mundo e suporte especializado.',
  canonical,
  image = 'https://www.anhanga.tur.br/og-image-1200x630.jpg',
  type = 'website',
  keywords = 'agência de viagens em São Paulo, viagens personalizadas, pacotes para Orlando, pacote Beto Carrero, Lollapalooza Brasil, viagens melhor idade 50+, roteiros exclusivos',
  robots = 'index, follow'
}) => {
  const siteName = "Anhangá Viagens";
  const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Ensure title has the site name suffix if it doesn't already
  const fullTitle = normalize(title).includes(normalize(siteName))
    ? title
    : `${title} | ${siteName}`;

  // Helper to normalize canonical URLs
  const normalizeCanonical = (urlStr: string): string => {
    try {
      const url = new URL(urlStr, 'https://www.anhanga.tur.br');

      // Force production hostname and protocol
      url.protocol = 'https:';
      url.hostname = 'www.anhanga.tur.br';
      url.port = ''; // Remove port (dev/preview servers)

      // Strip query parameters and hash to prevent duplicate content
      url.search = '';
      url.hash = '';

      // Normalize trailing slash on pathname (only for extension-less paths)
      if (!url.pathname.endsWith('/') && !url.pathname.includes('.')) {
        url.pathname += '/';
      }

      return url.toString();
    } catch (error) {
      console.error('[SEO] Failed to normalize canonical URL: "%s"', urlStr, error);
      return '';
    }
  };

  // Generate canonical URL
  let canonicalUrl = '';
  if (canonical) {
    canonicalUrl = normalizeCanonical(canonical);
  } else if (typeof window !== 'undefined') {
    canonicalUrl = normalizeCanonical(window.location.href);
  }

  useHeadTags([
    {
      tagName: 'title',
      key: 'title',
      textContent: fullTitle
    },
    {
      tagName: 'meta',
      key: 'meta:description',
      attrs: { name: 'description', content: description }
    },
    {
      tagName: 'meta',
      key: 'meta:keywords',
      attrs: { name: 'keywords', content: keywords }
    },
    {
      tagName: 'meta',
      key: 'meta:robots',
      attrs: { name: 'robots', content: robots }
    },
    {
      tagName: 'meta',
      key: 'meta:og:type',
      attrs: { property: 'og:type', content: type }
    },
    {
      tagName: 'meta',
      key: 'meta:og:title',
      attrs: { property: 'og:title', content: fullTitle }
    },
    {
      tagName: 'meta',
      key: 'meta:og:description',
      attrs: { property: 'og:description', content: description }
    },
    {
      tagName: 'meta',
      key: 'meta:og:image',
      attrs: { property: 'og:image', content: image }
    },
    {
      tagName: 'meta',
      key: 'meta:og:site_name',
      attrs: { property: 'og:site_name', content: siteName }
    },
    {
      tagName: 'meta',
      key: 'meta:twitter:card',
      attrs: { name: 'twitter:card', content: 'summary_large_image' }
    },
    {
      tagName: 'meta',
      key: 'meta:twitter:title',
      attrs: { name: 'twitter:title', content: fullTitle }
    },
    {
      tagName: 'meta',
      key: 'meta:twitter:description',
      attrs: { name: 'twitter:description', content: description }
    },
    {
      tagName: 'meta',
      key: 'meta:twitter:image',
      attrs: { name: 'twitter:image', content: image }
    },
    ...(canonicalUrl
      ? [
          {
            tagName: 'link' as const,
            key: 'link:canonical',
            attrs: { rel: 'canonical', href: canonicalUrl }
          },
          {
            tagName: 'link' as const,
            key: 'link:alternate:pt-BR',
            attrs: { rel: 'alternate', hreflang: 'pt-BR', href: canonicalUrl }
          },
          {
            tagName: 'link' as const,
            key: 'link:alternate:x-default',
            attrs: { rel: 'alternate', hreflang: 'x-default', href: canonicalUrl }
          },
          {
            tagName: 'meta' as const,
            key: 'meta:og:url',
            attrs: { property: 'og:url', content: canonicalUrl }
          }
        ]
      : [])
  ]);

  return null;
};
