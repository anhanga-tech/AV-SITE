import React from 'react';

export const OrganizationSchema = () => (
    <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
            __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "TravelAgency",
                "@id": "https://www.anhanga.tur.br/#organization",
                "name": "Anhangá Viagens",
                "alternateName": "Anhangá Turismo",
                "url": "https://www.anhanga.tur.br/",
                "logo": "https://www.anhanga.tur.br/assets/LOGO%20ANHANGA%20VIAGENS%20-%20AZUL.svg",
                "description": "Agência de viagens boutique especializada em roteiros personalizados, turismo de transformação e pacotes exclusivos.",
                "telephone": "+55-11-52833309",
                "email": "contato@anhanga.tur.br",
                "taxID": "37.036.732/0001-41",
                "award": "Certificado Cadastur: 37.036.732/0001-41",
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
                }
            })
        }}
    />
);
