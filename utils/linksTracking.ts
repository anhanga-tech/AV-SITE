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

/**
 * Rótulos de origem permitidos, indexados por `utm_source` normalizado.
 *
 * É um allowlist deliberado, não um mapa de conveniência: o valor vem da URL, ou seja, de
 * quem clicou. Interpolar `utm_source` cru na mensagem deixaria qualquer pessoa escrever
 * o texto que chega ao atendimento. Fora da lista, a origem é omitida.
 *
 * O valor guarda a preposição junto ("pelo"/"pela") para não errar gênero ao crescer.
 */
const ORIGIN_LABELS: Record<string, string> = {
    instagram: 'pelo Instagram',
    ig: 'pelo Instagram',
    tiktok: 'pelo TikTok',
    facebook: 'pelo Facebook',
    fb: 'pelo Facebook',
    youtube: 'pelo YouTube',
    linkedin: 'pelo LinkedIn',
    google: 'pelo Google',
    bing: 'pelo Bing',
    x: 'pelo X',
    twitter: 'pelo X',
    whatsapp: 'pelo WhatsApp',
    email: 'pelo e-mail',
    'e-mail': 'pelo e-mail',
    newsletter: 'pela newsletter',
    qr: 'pelo QR code',
    qrcode: 'pelo QR code',
    // `/indica` (public/_redirects) — link curto do e-mail de NPS promotor. Note a
    // preposição diferente: é por isso que o mapa guarda "por"/"pelo"/"pela" no valor.
    indicacao: 'por indicação',
};

/** Sem `utm_source` a origem é a bio do Instagram — o uso principal de /links. */
const DEFAULT_ORIGIN_LABEL = 'pelo Instagram';

/** Marcador que as mensagens de `data/linksPage.ts` usam no lugar da origem fixa. */
export const ORIGIN_TOKEN = '{origem}';

/**
 * Resolve a frase de origem a partir da `utm_source` da URL.
 *
 * @param search query atual, ou `null` quando ela ainda é desconhecida — o HTML
 * prerenderizado de /links, antes da hidratação. `null` **omite** a origem em vez de cair
 * no padrão: o mesmo HTML estático é servido para toda query string, então qualquer origem
 * afirmada ali estaria errada para alguém. Quem abre `/links/?utm_source=indicacao` e
 * clica antes de hidratar (ou com JS desligado) receberia "Vim pelo Instagram." — falso.
 * Sem `window.location` como fallback implícito de propósito: o tipo obriga quem chama a
 * decidir se já sabe a origem.
 *
 * @returns ` Vim pelo TikTok.` (com espaço à esquerda), ou string vazia quando a origem é
 * desconhecida ou está fora do allowlist — nos dois casos, afirmar algo seria mentir.
 */
export function resolveOriginClause(search: string | null): string {
    if (search === null) return '';

    const source = new URLSearchParams(search).get('utm_source');

    if (!source) return ` Vim ${DEFAULT_ORIGIN_LABEL}.`;

    const label = ORIGIN_LABELS[source.trim().toLowerCase()];
    return label ? ` Vim ${label}.` : '';
}

/**
 * Troca `{origem}` pela frase de origem real. As mensagens são escritas como
 * `'Olá!{origem} Quero...'`: com origem vira `'Olá! Vim pelo TikTok. Quero...'`, sem
 * origem vira `'Olá! Quero...'` — o espaço que segue o marcador serve aos dois casos.
 */
export function applyOriginToMessage(message: string, search: string | null): string {
    if (!message.includes(ORIGIN_TOKEN)) return message;
    return message.split(ORIGIN_TOKEN).join(resolveOriginClause(search));
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
