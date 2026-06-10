import React from 'react';
import { StructuredData } from './StructuredData';
import { BRAND_LOGO_BLUE_URL } from '../../lib/media-assets';

interface AggregateRatingProps {
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  worstRating?: number;
}

interface OrganizationSchemaProps {
  aggregateRating?: AggregateRatingProps;
}

export const OrganizationSchema: React.FC<OrganizationSchemaProps> = ({ aggregateRating }) => {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["TravelAgency", "Organization"],
    "name": "Anhangá Viagens",
    "alternateName": "Anhangá Turismo",
    "url": "https://www.anhanga.tur.br/",
    "logo": BRAND_LOGO_BLUE_URL,
    "description": "Agência de viagens em São Paulo especializada em roteiros personalizados, turismo de transformação e pacotes exclusivos para grandes festivais, incluindo o Lollapalooza Brasil, e público 50+.",
    "telephone": "+55-11-52833309",
    "email": "contato@anhanga.tur.br",
    "taxID": "37.036.732/0001-41",
    "award": "Certificado Cadastur: 37.036.732/0001-41",
    "priceRange": "R$ 3800-50000",
    "sameAs": [
      "https://www.instagram.com/anhangaviagens",
      "https://www.facebook.com/profile.php?id=61585422494271"
    ],
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Av. Dom Pedro I, 773",
      "addressLocality": "São Paulo",
      "addressRegion": "SP",
      "postalCode": "01552-001",
      "addressCountry": "BR"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+55-11-52833309",
      "contactType": "Customer Support",
      "availableLanguage": "pt-BR",
      "areaServed": "BR"
    },
    "memberOf": [
      {
        "@type": "Organization",
        "name": "Beto Carrero World",
        "description": "Agente Credenciado"
      },
      {
        "@type": "Organization",
        "name": "Hopi Hari",
        "description": "Agente Credenciado"
      }
    ],
    "areaServed": [
      { "@type": "Place", "name": "Orlando, Estados Unidos" },
      { "@type": "Place", "name": "Brasil (Festivais e Experiências)" },
      { "@type": "Place", "name": "Caribe" },
      { "@type": "Place", "name": "Europa" },
      { "@type": "Place", "name": "Ásia" }
    ],
    "knowsAbout": [
      "Roteiros Personalizados",
      "Lollapalooza Brasil",
      "Rock in Rio",
      "The Town",
      "Viagens para 50 Mais",
      "Melhor Idade",
      "Turismo de Transformação",
      "Orlando & Disney",
      "Beto Carrero World"
    ]
  };

  if (aggregateRating) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": aggregateRating.ratingValue,
      "reviewCount": aggregateRating.reviewCount,
      "bestRating": aggregateRating.bestRating ?? 5,
      "worstRating": aggregateRating.worstRating ?? 1
    };
  }

  return <StructuredData id="organization" data={data} />;
};
