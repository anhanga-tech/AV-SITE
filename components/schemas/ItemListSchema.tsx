import React from 'react';
import { StructuredData } from './StructuredData';

const SITE_URL = 'https://www.anhanga.tur.br';

export interface ItemListSchemaItem {
  name: string;
  description: string;
  city: string;
  state: string;
  href?: string;
}

interface ItemListSchemaProps {
  items: ItemListSchemaItem[];
  id: string;
  name?: string;
}

const toAbsoluteUrl = (href: string): string => {
  if (/^https?:\/\//.test(href)) {
    return href;
  }

  const path = href.startsWith('/') ? href : `/${href}`;
  return `${SITE_URL}${path.endsWith('/') ? path : `${path}/`}`;
};

export const ItemListSchema: React.FC<ItemListSchemaProps> = ({
  items,
  id,
  name = 'Destinos atendidos pela Anhangá Viagens',
}) => {
  const schemaData: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    itemListOrder: 'https://schema.org/ItemListUnordered',
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'TouristAttraction',
        name: item.name,
        description: item.description,
        address: {
          '@type': 'PostalAddress',
          addressLocality: item.city,
          addressRegion: item.state,
          addressCountry: 'BR',
        },
        ...(item.href ? { url: toAbsoluteUrl(item.href) } : {}),
      },
    })),
  };

  return <StructuredData id={id} data={schemaData} />;
};
