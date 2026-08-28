import type { LinkItem } from '../data/linksPage';

export const FEATURED_DESTINATION_IDS = ['orlando', 'beto-carrero', 'curadoria-cruzeiros-brasil', 'melhor-idade'] as const;
export const MORE_DESTINATION_IDS = ['consultoria-de-viagem', 'corporativo', 'lollapalooza'] as const;
export const PRODUCT_LINK_IDS = ['seguro-viagem', 'chip-esim'] as const;

export interface LinksPageVisibility {
    hasPrimaryDestinations: boolean;
    hasVisibleDestinations: boolean;
    hasVisibleContact: boolean;
    hasVisibleOtherLinks: boolean;
}

// Links sem uma categoria explícita continuam visíveis no fallback de "Outros acessos".
// Isso preserva o contrato editável de data/linksPage.ts: uma nova entrada visible: true não
// desaparece silenciosamente só porque ainda não foi promovida para uma seção de destaque.
const EXPLICITLY_RENDERED_LINK_IDS = new Set<string>([
    'whatsapp',
    'agendar-consultoria',
    'quiz',
    'site',
    ...PRODUCT_LINK_IDS,
    ...FEATURED_DESTINATION_IDS,
    ...MORE_DESTINATION_IDS,
]);

export function getVisibleLinksForIds(links: readonly LinkItem[], ids: readonly string[]): LinkItem[] {
    const visibleLinksById = new Map<string, LinkItem>();
    for (const link of links) {
        if (link.visible) visibleLinksById.set(link.id, link);
    }

    return ids.flatMap((id) => {
        const link = visibleLinksById.get(id);
        return link ? [link] : [];
    });
}

export function getLinksPageVisibility(links: readonly LinkItem[]): LinksPageVisibility {
    const visibleLinks = links.filter((link) => link.visible);
    const visibleLinkIds = new Set(visibleLinks.map((link) => link.id));
    const hasPrimaryDestinations =
        visibleLinkIds.has('quiz') || getVisibleLinksForIds(visibleLinks, FEATURED_DESTINATION_IDS).length > 0;
    const hasVisibleDestinations =
        hasPrimaryDestinations || getVisibleLinksForIds(visibleLinks, MORE_DESTINATION_IDS).length > 0;

    return {
        hasPrimaryDestinations,
        hasVisibleDestinations,
        hasVisibleContact: visibleLinkIds.has('agendar-consultoria'),
        hasVisibleOtherLinks: visibleLinkIds.has('site') || getUnassignedVisibleLinks(visibleLinks).length > 0,
    };
}

export function getUnassignedVisibleLinks(links: readonly LinkItem[]): LinkItem[] {
    return links.filter((link) => link.visible && !EXPLICITLY_RENDERED_LINK_IDS.has(link.id));
}

// Quando só um card de intenção existe, ele ocupa a linha inteira do grid em vez de deixar
// uma coluna vazia — o outro ramo simplesmente não é uma escolha disponível.
export function getSoleIntentCardSpanClass(hasVisibleDestinations: boolean, hasProductIntent: boolean): string {
    return hasVisibleDestinations && hasProductIntent ? '' : ' sm:col-span-2';
}

export type SelectedIntent = 'destinos' | 'preparar' | null;

// Uma hash apontando para um ramo que não existe na config atual (ex.: link antigo/compartilhado
// para #preparar quando todos os produtos estão ocultos) não conta como escolha real — não há
// seção "não escolhida" para rebaixar quando só uma existe.
export function resolveSelectedIntent(
    hash: string,
    hasVisibleDestinations: boolean,
    hasProductIntent: boolean,
): SelectedIntent {
    if (hash === '#destinos' && hasVisibleDestinations) return 'destinos';
    if (hash === '#preparar' && hasProductIntent) return 'preparar';
    return null;
}
