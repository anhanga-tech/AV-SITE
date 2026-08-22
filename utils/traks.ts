/**
 * Traks Analytics bridge (cookieless, privacy-first — analytics.anhanga.tur.br).
 *
 * O snippet + queue stub vivem no index.html (`window.traks`), então chamar
 * `window.traks(...)` é seguro antes mesmo do script carregar (enfileira).
 * Este módulo centraliza os eventos de conversão para manter nomes/props
 * consistentes com os goals configurados no dashboard.
 */

export type TraksProps = Record<string, string | number | boolean>;

export function trackTraks(name: string, props?: TraksProps): void {
    if (typeof window === 'undefined' || typeof window.traks !== 'function') {
        return;
    }

    // Falha do provedor externo jamais pode quebrar o fluxo do produto
    // (ex.: abrir WhatsApp/submeter lead depois de um pushGenerateLead...).
    try {
        window.traks(name, props);
    } catch (error) {
        if (typeof console !== 'undefined') {
            console.error('Traks tracking failed', error);
        }
    }
}

/** Path atual (sem query/hash) para props de baixa cardinalidade. */
export function currentPathname(): string {
    try {
        return new URL(window.location.href).pathname;
    } catch {
        return '/';
    }
}

/**
 * Links de WhatsApp que representam CONTATO com a agência (wa.me direto ou
 * /send?phone=). Links de COMPARTILHAR conteúdo (api.whatsapp.com/send apenas
 * com ?text=, ver utils/share.ts) NÃO são conversão e ficam de fora.
 */
function isAgencyWhatsAppHref(rawHref: string): boolean {
    try {
        const url = new URL(rawHref, window.location.href);
        if (url.hostname === 'wa.me') return true;
        if (url.hostname === 'api.whatsapp.com' && url.pathname === '/send') {
            return url.searchParams.has('phone');
        }
        return false;
    } catch {
        return false;
    }
}

/**
 * Delegação global de cliques em links de WhatsApp de contato.
 * Um único listener cobre todos os CTAs presentes e futuros, sem tocar em cada
 * componente. Instale uma vez (index.tsx); é idempotente.
 */
let whatsAppListenerInstalled = false;

export function installTraksWhatsAppClickListener(): void {
    if (typeof window === 'undefined' || whatsAppListenerInstalled) return;
    whatsAppListenerInstalled = true;

    const handleActivation = (event: MouseEvent) => {
        // Duck typing em vez de instanceof Element: cobre iframes/JSDOM/fakes.
        // `auxclick` só interessa no botão do meio (open in new tab); right-click
        // também dispara auxclick mas não navega — não é conversão.
        if (event.type === 'auxclick' && event.button !== 1) return;
        const target = event.target as { closest?: unknown } | null;
        if (!target || typeof target.closest !== 'function') return;
        const anchor = target.closest('a[href]') as { getAttribute?: (name: string) => string | null } | null;

        if (!anchor || !isAgencyWhatsAppHref(anchor.getAttribute?.('href') ?? '')) return;

        trackTraks('whatsapp_click', { location: currentPathname() });
    };

    document.addEventListener('click', handleActivation, { passive: true });
    document.addEventListener('auxclick', handleActivation, { passive: true });
}

/**
 * Handoffs programáticos de WhatsApp (window.open em ChatLeadForm/useContactForm)
 * não passam por clique em <a>, então precisam sinal explícito. Chame no ponto
 * em que a janela do WhatsApp é aberta.
 */
export function trackTraksWhatsAppHandoff(): void {
    trackTraks('whatsapp_click', { location: currentPathname() });
}

/**
 * Decide se um 404 de post deve emitir `page_not_found`, dado o slug atual
 * de rota e o último slug já rastreado (guard local, tipicamente um `useRef`).
 * Extraído de `pages/BlogPost.tsx` para ser testável isoladamente: esse
 * componente usa `import.meta.glob` (macro do Vite), então não pode ser
 * montado fora de um build Vite/browser em testes `node:test`.
 *
 * Emite uma vez por slug inválido, mas esquece o guard assim que um post
 * válido é visto — sem isso, revisitar o mesmo slug inválido depois de
 * navegar por um post real (a rota `/blog/:slug` reaproveita a mesma
 * instância do componente) nunca reemitiria o evento.
 */
export function nextBlogNotFoundTraksSlug(
    hasPost: boolean,
    slug: string | undefined,
    lastTrackedSlug: string | null,
): { shouldTrack: boolean; nextLastTrackedSlug: string | null } {
    if (hasPost) {
        return { shouldTrack: false, nextLastTrackedSlug: null };
    }
    if (slug && lastTrackedSlug !== slug) {
        return { shouldTrack: true, nextLastTrackedSlug: slug };
    }
    return { shouldTrack: false, nextLastTrackedSlug: lastTrackedSlug };
}
