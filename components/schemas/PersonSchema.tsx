import React from 'react';
import { StructuredData } from './StructuredData';

export interface PersonWorksFor {
    name: string;
    url?: string;
    // @id da organização no grafo JSON-LD (ex.: ORGANIZATION_ID), para ligar a pessoa a ela.
    id?: string;
}

export interface PersonSchemaProps {
    name: string;
    image?: string;
    description?: string;
    jobTitle?: string;
    url?: string;
    sameAs?: string[];
    worksFor?: PersonWorksFor;
    // Unique head-tag id — required when a page renders more than one Person
    // (StructuredData keys tags by id, so duplicates would collide/dedupe).
    id?: string;
    // @id do nó no grafo JSON-LD (distinto do `id` acima, que só chaveia a tag no head).
    entityId?: string;
}

export const PersonSchema: React.FC<PersonSchemaProps> = ({
    name,
    image,
    description,
    jobTitle,
    url,
    sameAs,
    worksFor,
    id = "person",
    entityId
}) => {
    const schema = {
        "@context": "https://schema.org",
        "@type": "Person",
        ...(entityId && { "@id": entityId }),
        "name": name,
        ...(image && { "image": image }),
        ...(description && { "description": description }),
        ...(jobTitle && { "jobTitle": jobTitle }),
        ...(url && { "url": url }),
        ...(sameAs && sameAs.length > 0 && { "sameAs": sameAs }),
        ...(worksFor && {
            "worksFor": {
                "@type": "TravelAgency",
                ...(worksFor.id && { "@id": worksFor.id }),
                "name": worksFor.name,
                ...(worksFor.url && { "url": worksFor.url })
            }
        })
    };

    return <StructuredData id={id} data={schema} />;
};
