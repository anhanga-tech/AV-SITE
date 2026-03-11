import React from 'react';
import { StructuredData } from './StructuredData';

interface BreadcrumbItem {
    name: string;
    item: string;
}

interface BreadcrumbSchemaProps {
    items: BreadcrumbItem[];
}

export const BreadcrumbSchema: React.FC<BreadcrumbSchemaProps> = ({ items }) => (
  <StructuredData
    id="breadcrumb"
    data={{
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": item.item
      }))
    }}
  />
);
