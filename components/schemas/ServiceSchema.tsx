import React from 'react';
import { StructuredData } from './StructuredData';
import { ORGANIZATION_ID } from './schema-ids';

interface ServiceSchemaProps {
  name: string;
  description: string;
  serviceUrl: string;
  serviceType?: string;
  areaServed?: string;
  /** Só para serviço com preço público na página; nunca inventar valor. */
  offer?: {
    price: number;
    url: string;
  };
}

// "keywords" não é propriedade válida de Service no schema.org (só CreativeWork/Event)
// e gerava erro de validação em todas as páginas que usam este schema.
export const ServiceSchema: React.FC<ServiceSchemaProps> = ({
  name,
  description,
  serviceUrl,
  serviceType,
  areaServed = 'Brasil',
  offer,
}) => {
  const schemaData: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    url: serviceUrl,
    serviceType: serviceType || name,
    areaServed,
    provider: {
      '@type': 'TravelAgency',
      '@id': ORGANIZATION_ID,
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
    },
    ...(offer
      ? {
          offers: {
            '@type': 'Offer',
            price: offer.price.toFixed(2),
            priceCurrency: 'BRL',
            availability: 'https://schema.org/InStock',
            url: offer.url
          }
        }
      : {})
  };

  return <StructuredData id="service" data={schemaData} />;
};
