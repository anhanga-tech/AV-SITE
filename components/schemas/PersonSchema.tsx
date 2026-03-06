import React from 'react';
import { StructuredData } from './StructuredData';

export interface PersonSchemaProps {
    name: string;
    image?: string;
    description?: string;
    jobTitle?: string;
    url?: string;
    sameAs?: string[];
}

export const PersonSchema: React.FC<PersonSchemaProps> = ({
    name,
    image,
    description,
    jobTitle,
    url,
    sameAs
}) => {
    const schema = {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": name,
        ...(image && { "image": image }),
        ...(description && { "description": description }),
        ...(jobTitle && { "jobTitle": jobTitle }),
        ...(url && { "url": url }),
        ...(sameAs && sameAs.length > 0 && { "sameAs": sameAs })
    };

    return <StructuredData id="person" data={schema} />;
};
