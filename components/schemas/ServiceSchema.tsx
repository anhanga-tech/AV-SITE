import React from 'react';

interface ServiceSchemaProps {
  name: string;
  description: string;
  serviceUrl: string;
  serviceType?: string;
  areaServed?: string;
  keywords?: string[];
}

export const ServiceSchema: React.FC<ServiceSchemaProps> = ({
  name,
  description,
  serviceUrl,
  serviceType,
  areaServed = 'Brasil',
  keywords = []
}) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Service',
        name,
        description,
        url: serviceUrl,
        serviceType: serviceType || name,
        areaServed,
        keywords: keywords.length ? keywords.join(', ') : undefined,
        provider: {
          '@type': 'TravelAgency',
          name: 'Anhangá Viagens',
          url: 'https://www.anhanga.tur.br/',
          telephone: '+55-11-52833309',
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Av. Dom Pedro I, 773',
            addressLocality: 'São Paulo',
            addressRegion: 'SP',
            postalCode: '01552-001',
            addressCountry: 'BR'
          }
        }
      })
    }}
  />
);
