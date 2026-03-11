import React from 'react';
import { useHeadTags } from '../../lib/head';

interface StructuredDataProps {
  id: string;
  data: Record<string, unknown>;
}

export const StructuredData: React.FC<StructuredDataProps> = ({ id, data }) => {
  useHeadTags([
    {
      tagName: 'script',
      key: `script:ld-json:${id}`,
      attrs: {
        type: 'application/ld+json'
      },
      innerHTML: JSON.stringify(data)
    }
  ]);

  return null;
};
