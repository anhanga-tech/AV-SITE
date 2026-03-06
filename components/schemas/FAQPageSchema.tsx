import React from 'react';
import { StructuredData } from './StructuredData';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQPageSchemaProps {
  items: FAQItem[];
}

export const FAQPageSchema: React.FC<FAQPageSchemaProps> = ({ items }) => (
  <StructuredData
    id="faq-page"
    data={{
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: items.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer
        }
      }))
    }}
  />
);
