import React from 'react';
import { StructuredData } from './StructuredData';

interface WebPageSchemaProps {
  name: string;
  url: string;
  description: string;
  dateModified: string;
  inLanguage?: string;
}

export const WebPageSchema: React.FC<WebPageSchemaProps> = ({
  name,
  url,
  description,
  dateModified,
  inLanguage = 'pt-BR',
}) => (
  <StructuredData
    id="webpage"
    data={{
      "@context": "https://schema.org",
      "@type": "WebPage",
      name,
      url,
      description,
      dateModified,
      inLanguage,
    }}
  />
);
