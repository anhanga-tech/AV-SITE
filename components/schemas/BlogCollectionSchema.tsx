import React from 'react';
import { StructuredData } from './StructuredData';
import { ORGANIZATION_ID, WEBSITE_ID } from './schema-ids';

export interface BlogCollectionItem {
  name: string;
  /** URL canônica absoluta do post (com barra final). */
  url: string;
}

interface BlogCollectionSchemaProps {
  name: string;
  url: string;
  description: string;
  items: BlogCollectionItem[];
  inLanguage?: string;
}

// CollectionPage + ItemList genérico para listagens de conteúdo (hoje /blog/). Separado do
// ItemListSchema, que modela TouristAttraction.
export const buildBlogCollectionData = ({
  name,
  url,
  description,
  items,
  inLanguage = 'pt-BR',
}: BlogCollectionSchemaProps): Record<string, unknown> => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name,
  url,
  description,
  inLanguage,
  isPartOf: { "@id": WEBSITE_ID },
  publisher: { "@id": ORGANIZATION_ID },
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: item.url,
      name: item.name,
    })),
  },
});

export const BlogCollectionSchema: React.FC<BlogCollectionSchemaProps> = (props) => (
  <StructuredData id="blog-collection" data={buildBlogCollectionData(props)} />
);
