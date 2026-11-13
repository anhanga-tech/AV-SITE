import React from 'react';
import { StructuredData } from './StructuredData';
import { ORGANIZATION_ID } from './schema-ids';
import { BRAND_LOGO_BLUE_URL } from '../../lib/media-assets';

// Crédito da capa já confirmado. Só entra aqui quando imageCreditStatus === 'confirmed':
// com crédito `unknown` ou ausente o `image` do BlogPosting continua sendo a URL pura, sem
// autoria fictícia.
export interface ArticleImageCredit {
    /** Texto do crédito como exibido no post, ex.: "Erasto Chávez / Unsplash". */
    credit: string;
    /** Página de origem da imagem (imageSource). */
    source?: string;
    /** URL da licença (imageLicenseUrl). */
    licenseUrl?: string;
}

// Os créditos confirmados seguem "Autor / Plataforma". O que vem antes da barra é o
// criador; sem esse formato não dá para afirmar quem é o autor, então só `creditText` sai.
export function parseImageCreator(credit: string): string | undefined {
    const separatorIndex = credit.lastIndexOf(' / ');
    if (separatorIndex <= 0) return undefined;
    return credit.slice(0, separatorIndex).trim() || undefined;
}

function buildImageSchema(image: string, imageCredit?: ArticleImageCredit) {
    if (!imageCredit) return image;
    const creator = parseImageCreator(imageCredit.credit);
    return {
        "@type": "ImageObject",
        "url": image,
        "creditText": imageCredit.credit,
        ...(creator && { "creator": { "@type": "Person", "name": creator } }),
        ...(imageCredit.licenseUrl && { "license": imageCredit.licenseUrl }),
        ...(imageCredit.source && { "acquireLicensePage": imageCredit.source })
    };
}

interface ArticleSchemaProps {
    title: string;
    description: string;
    image: string;
    datePublished: string;
    dateModified?: string;
    authorName: string;
    authorImage?: string;
    /** Página do autor (/autor/<id>/), não a URL do post. */
    authorUrl?: string;
    /** @id do Person do autor, o mesmo emitido pelo PersonSchema do post e da /sobre. */
    authorEntityId?: string;
    authorSameAs?: string[];
    imageCredit?: ArticleImageCredit;
    url: string;
}

export const ArticleSchema: React.FC<ArticleSchemaProps> = ({
    title,
    description,
    image,
    datePublished,
    dateModified,
    authorName,
    authorImage,
    authorUrl,
    authorEntityId,
    authorSameAs,
    imageCredit,
    url
}) => (
  <StructuredData
    id="article"
    data={{
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": title,
      "image": buildImageSchema(image, imageCredit),
      "author": {
        "@type": "Person",
        ...(authorEntityId && { "@id": authorEntityId }),
        "name": authorName,
        ...(authorUrl && { "url": authorUrl }),
        ...(authorImage && { "image": authorImage }),
        ...(authorSameAs && authorSameAs.length > 0 && { "sameAs": authorSameAs })
      },
      "publisher": {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        "name": "Anhangá Viagens",
        "logo": {
          "@type": "ImageObject",
          "url": BRAND_LOGO_BLUE_URL
        }
      },
      "datePublished": datePublished,
      "dateModified": dateModified ?? datePublished,
      "description": description,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": url
      }
    }}
  />
);
