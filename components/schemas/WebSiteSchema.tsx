import React from 'react';
import { StructuredData } from './StructuredData';
import { ORGANIZATION_ID, WEBSITE_ID } from './schema-ids';

// Sem potentialAction/SearchAction: a busca do /blog é estado local, não uma URL
// de resultados que um buscador consiga chamar. Só declarar se isso mudar.
export const WebSiteSchema: React.FC = () => (
  <StructuredData
    id="website"
    data={{
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': WEBSITE_ID,
      name: 'Anhangá Viagens',
      url: 'https://www.anhanga.tur.br/',
      inLanguage: 'pt-BR',
      publisher: { '@id': ORGANIZATION_ID },
    }}
  />
);
