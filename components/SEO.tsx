import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description: string;
    canonical?: string;
    image?: string;
    type?: 'website' | 'article';
    keywords?: string;
    robots?: string;
}

export const SEO: React.FC<SEOProps> = ({
    title,
    description,
    canonical,
    image = 'https://www.anhanga.tur.br/og-image-1200x630.jpg',
    type = 'website',
    keywords = 'viagens personalizadas, agência viagens São Paulo, Lollapalooza 2026, Rock in Rio, The Town, viagens melhor idade, turismo 50+, Disney Orlando, roteiros transformação',
    robots = 'index, follow'
}) => {
    const siteName = "Anhangá Viagens";
    const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const fullTitle = normalize(title).includes(normalize(siteName)) ? title : `${title} | ${siteName}`;
    // O replace garante www caso a canonical não seja passada explicitamente (todas as páginas devem passar).
    const currentUrl = canonical || (typeof window !== 'undefined' ? window.location.href.replace('https://anhanga.tur.br', 'https://www.anhanga.tur.br') : '');

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            <link rel="canonical" href={currentUrl} />

            {/* Open Graph */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={currentUrl} />
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
