import { ORGANIZATION_ID, WEBSITE_ID } from './schema-ids';

export interface BlogCollectionItem {
  name: string;
  /** URL canônica absoluta do post (com barra final). */
  url: string;
}

export interface BlogCollectionData {
  name: string;
  url: string;
  description: string;
  items: BlogCollectionItem[];
  inLanguage?: string;
}

// CollectionPage + ItemList genérico para listagens de conteúdo (hoje /blog/). Separado do
// ItemListSchema, que modela TouristAttraction. Fica fora do .tsx do componente para o
// arquivo exportar só componente (react-doctor/only-export-components).
export const buildBlogCollectionData = ({
  name,
  url,
  description,
  items,
  inLanguage = 'pt-BR',
}: BlogCollectionData): Record<string, unknown> => ({
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
