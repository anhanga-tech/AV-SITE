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

    window.traks(name, props);
}

/** Path atual (sem query/hash) para props de baixa cardinalidade. */
function currentPathname(): string {
    try {
        return new URL(window.location.href).pathname;
    } catch {
        return '/';
    }
}

/**
 * Delegação global de cliques em links de WhatsApp (wa.me / api.whatsapp.com).
 * Um único listener cobre todos os CTAs presentes e futuros, sem tocar em cada
 * componente. Instale uma vez (index.tsx); é idempotente.
 */
let whatsAppListenerInstalled = false;

export function installTraksWhatsAppClickListener(): void {
    if (typeof window === 'undefined' || whatsAppListenerInstalled) return;
    whatsAppListenerInstalled = true;

    const isWhatsAppHref = (rawHref: string): boolean => {
        try {
            const url = new URL(rawHref, window.location.href);
            return url.hostname === 'wa.me' || url.hostname === 'api.whatsapp.com';
        } catch {
            return false;
        }
    };

    document.addEventListener('click', (event) => {
        // Duck typing em vez de instanceof Element: cobre iframes/JSDOM/fakes e
        // suporta open in new tab (command/ctrl/middle-click), onde a navegação acontece igual.
        const target = event.target as { closest?: unknown } | null;
        if (!target || typeof target.closest !== 'function') return;
        const anchor = target.closest('a[href]') as { getAttribute?: (name: string) => string | null } | null;

        if (!anchor || !isWhatsAppHref(anchor.getAttribute?.('href') ?? '')) return;

        trackTraks('whatsapp_click', { location: currentPathname() });
    }, { passive: true });
}
