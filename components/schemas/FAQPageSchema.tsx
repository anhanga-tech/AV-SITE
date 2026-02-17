import React from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQPageSchemaProps {
  items: FAQItem[];
}

export const FAQPageSchema: React.FC<FAQPageSchemaProps> = ({ items }) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
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
      })
    }}
  />
);
