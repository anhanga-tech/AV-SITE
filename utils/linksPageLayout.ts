import type { LinkItem } from '../data/linksPage';

export const FEATURED_DESTINATION_IDS = ['orlando', 'beto-carrero', 'curadoria-cruzeiros-brasil', 'melhor-idade'] as const;
export const MORE_DESTINATION_IDS = ['consultoria-de-viagem', 'corporativo', 'lollapalooza'] as const;
export const PRODUCT_LINK_IDS = ['seguro-viagem', 'chip-esim'] as const;

// Links sem uma categoria explícita continuam visíveis no fallback de "Outros acessos".
// Isso preserva o contrato editável de data/linksPage.ts: uma nova entrada visible: true não
// desaparece silenciosamente só porque ainda não foi promovida para uma seção de destaque.
const EXPLICITLY_RENDERED_LINK_IDS = new Set<string>([
    'whatsapp',
    'orcamento',
    'quiz',
    'site',
    ...PRODUCT_LINK_IDS,
    ...FEATURED_DESTINATION_IDS,
    ...MORE_DESTINATION_IDS,
]);

export function getVisibleLinksForIds(links: readonly LinkItem[], ids: readonly string[]): LinkItem[] {
    const visibleLinksById = new Map(links.filter((link) => link.visible).map((link) => [link.id, link]));

    return ids.flatMap((id) => {
        const link = visibleLinksById.get(id);
        return link ? [link] : [];
    });
}

export function getUnassignedVisibleLinks(links: readonly LinkItem[]): LinkItem[] {
    return links.filter((link) => link.visible && !EXPLICITLY_RENDERED_LINK_IDS.has(link.id));
}
