import React from 'react';
import { StructuredData } from './StructuredData';
import { ORGANIZATION_ID } from './schema-ids';

// Subtipos de WebPage que marcam as páginas de confiança (sobre, contato) para agentes.
type WebPageType = 'WebPage' | 'AboutPage' | 'ContactPage';

interface WebPageSchemaProps {
  name: string;
  url: string;
  description: string;
  dateModified?: string;
  inLanguage?: string;
  type?: WebPageType;
  /** Liga a página à Organization (@id) quando ela fala da própria agência. */
  aboutOrganization?: boolean;
}

export const WebPageSchema: React.FC<WebPageSchemaProps> = ({
  name,
  url,
  description,
  dateModified,
  inLanguage = 'pt-BR',
  type = 'WebPage',
  aboutOrganization = false,
}) => (
  <StructuredData
    id="webpage"
    data={{
      "@context": "https://schema.org",
      "@type": type,
      name,
      url,
      description,
      ...(dateModified ? { dateModified } : {}),
      inLanguage,
      ...(aboutOrganization ? { about: { "@id": ORGANIZATION_ID }, mainEntity: { "@id": ORGANIZATION_ID } } : {}),
    }}
  />
);
