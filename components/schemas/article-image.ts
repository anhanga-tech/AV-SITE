// Helpers puros do campo `image` do BlogPosting. Ficam fora de ArticleSchema.tsx para que o
// arquivo do componente exporte só componentes (react-doctor/only-export-components).

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

export function buildImageSchema(image: string, imageCredit?: ArticleImageCredit) {
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
