import React from 'react';
import { Helmet } from 'react-helmet-async';

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
  keywords = 'agência de viagens em São Paulo, viagens personalizadas, pacotes para Orlando, pacote Beto Carrero, viagem Lollapalooza 2026, viagens melhor idade 50+, roteiros exclusivos',
  robots = 'index, follow'
}) => {
  const siteName = "Anhangá Viagens";
  const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Ensure title has the site name suffix if it doesn't already
  const fullTitle = normalize(title).includes(normalize(siteName))
    ? title
    : `${title} | ${siteName}`;

  // Generate canonical URL: absolute, forced www, forced trailing slash
  let canonicalUrl = canonical;
  if (!canonicalUrl && typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    // Force www.anhanga.tur.br
    url.hostname = 'www.anhanga.tur.br';
    // Force trailing slash on pathname
    if (!url.pathname.endsWith('/')) {
      url.pathname += '/';
    }
    canonicalUrl = url.toString();
  } else if (canonicalUrl) {
    // If canonical is provided but relative, make it absolute
    if (canonicalUrl.startsWith('/')) {
        canonicalUrl = `https://www.anhanga.tur.br${canonicalUrl}`;
    }
    // Ensure absolute canonicals also have trailing slash
    if (!canonicalUrl.endsWith('/') && !canonicalUrl.includes('?') && !canonicalUrl.includes('#')) {
        canonicalUrl += '/';
    }
  }

  return (
    <Helmet defer={false}>
      {/* Standard Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Robots */}
      <meta name="robots" content={robots} />
    </Helmet>
  );
};
