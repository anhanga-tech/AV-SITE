import type { LinkItem } from '../data/linksPage';

const TRACKED_PARAM_PREFIXES = ['utm_', 'hsa_'];
const TRACKED_PARAMS = ['gclid', 'fbclid', 'ttclid', 'wbraid', 'gbraid', 'msclkid'];

function isTrackedParam(key: string): boolean {
    return TRACKED_PARAMS.includes(key) || TRACKED_PARAM_PREFIXES.some((prefix) => key.startsWith(prefix));
}

/**
 * Anexa os parâmetros de rastreio da URL atual (UTMs/click IDs vindos da bio)
 * a um path interno. Não sobrescreve params já presentes no destino.
 * @param search query atual; default = window.location.search (parametrizável para teste).
 */
export function withTrackingParams(path: string, search?: string): string {
    const currentSearch = search ?? (typeof window !== 'undefined' ? window.location.search : '');
    if (!currentSearch) return path;

    const incoming = new URLSearchParams(currentSearch);
    const [basePath, existingQuery = ''] = path.split('?');
    const target = new URLSearchParams(existingQuery);

    incoming.forEach((value, key) => {
        if (!isTrackedParam(key)) return;
        if (target.has(key)) return;
        target.set(key, value);
    });

    const query = target.toString();
    return query ? `${basePath}?${query}` : basePath;
}

/** PageView que alimenta o público de retargeting via GTM. */
export function pushLinksPageView(): void {
    if (typeof window === 'undefined') return;
    // Inicializa a fila se o GTM ainda não carregou (espelha o bootstrap do index.html),
    // garantindo que o evento seja enfileirado e processado quando o GTM inicializar.
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'links_page_view' });
}

/** Evento GA4 por clique de botão. */
export function pushLinksPageClick(item: LinkItem, destination: string): void {
    if (typeof window === 'undefined') return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: 'links_page_click',
        label: item.id,
        link_type: item.type,
        destination,
    });
}
