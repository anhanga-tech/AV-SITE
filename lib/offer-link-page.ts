/**
 * Edge handler for `/o/<slug>` (canal Anhangá Ofertas).
 *
 * A person is redirected to the Anhangá WhatsApp with the stored text. Link
 * previews, HEAD and prefetch get a light page (or a refusal) and do not
 * count. An ended offer explains that and links to the generic Anhangá chat,
 * also without counting.
 *
 * Pages Functions do not apply `public/_headers`, so every security header is
 * set here. The CSP has no `script-src`, which keeps Cloudflare-injected tags
 * from running on the HTML responses.
 */
import { isLinkPreviewRequest, isPrefetchRequest } from './link-preview-agents';
import { containsUrl, genericWhatsAppUrl, offerWhatsAppUrl } from './offer-link';
import { loadOffer, recordOfferClick, type OfferLinkStoreDeps, type OfferRecord } from './offer-link-store';

const SECURITY_HEADERS: Readonly<Record<string, string>> = {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'private, no-store',
    'CDN-Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
    'X-Robots-Tag': 'noindex, nofollow',
    'Content-Security-Policy':
        "default-src 'none'; style-src 'unsafe-inline'; img-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Strict-Transport-Security': 'max-age=31536000',
    'Permissions-Policy':
        'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), midi=(), serial=(), hid=(), magnetometer=(), gyroscope=(), accelerometer=(), xr-spatial-tracking=()',
};

const STYLES = `
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px 16px;font-family:Poppins,ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;line-height:1.6;color:#0f172a;background:#F4F8FF}
main{width:100%;max-width:32rem;padding:32px 24px;border-radius:16px;background:#fff;box-shadow:0 10px 40px -10px rgba(0,0,0,.15)}
.brand{margin:0 0 24px;font-size:.75rem;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:#0056D2}
h1{margin:0 0 12px;font-size:clamp(1.5rem,5vw,2rem);font-weight:800;line-height:1.1}
p{margin:0 0 28px;color:#475569}
.cta{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:12px 24px;border-radius:16px;font-weight:700;color:#0f172a;text-decoration:none;background:#FFD600;box-shadow:4px 4px 0 0 #0f172a;transition:transform .15s,box-shadow .15s}
.cta:hover{transform:translate(2px,2px);box-shadow:2px 2px 0 0 #0f172a;background:#E5C000}
.cta:active{transform:translate(4px,4px);box-shadow:none}
.cta:focus-visible{outline:3px solid #0ea5e9;outline-offset:3px}
@media (prefers-reduced-motion:reduce){.cta{transition:none}}
`;

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

interface PageContent {
    title: string;
    heading: string;
    message: string;
    /** When set, the page offers the generic Anhangá chat. Never the stored offer text. */
    showWhatsApp: boolean;
}

function pageFor(kind: 'expired' | 'not_found' | 'unavailable'): PageContent {
    if (kind === 'expired') {
        return {
            title: 'Esta oferta encerrou | Anhangá Viagens',
            heading: 'Esta oferta encerrou',
            message: 'O prazo desta oferta acabou. Chama a gente no WhatsApp que te contamos as opções atuais.',
            showWhatsApp: true,
        };
    }
    if (kind === 'not_found') {
        return {
            title: 'Link inválido | Anhangá Viagens',
            heading: 'Link inválido',
            message: 'Confira se o link foi copiado inteiro. Se o problema continuar, fale com a gente no WhatsApp.',
            showWhatsApp: true,
        };
    }
    return {
        title: 'Link indisponível | Anhangá Viagens',
        heading: 'Não conseguimos abrir este link agora',
        message: 'Tivemos um problema temporário. Tente de novo em alguns minutos ou fale com a gente no WhatsApp.',
        showWhatsApp: true,
    };
}

const STATUS_BY_PAGE = {
    expired: 410,
    not_found: 404,
    unavailable: 503,
} as const;

function renderPage(content: PageContent, openGraphTitle?: string): string {
    const whatsapp = content.showWhatsApp
        ? `<a class="cta" href="${escapeHtml(genericWhatsAppUrl())}" rel="noopener noreferrer" target="_blank">Falar no WhatsApp</a>`
        : '';
    const ogTitle = openGraphTitle ?? content.title;
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="no-referrer">
<meta property="og:title" content="${escapeHtml(ogTitle)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Anhangá Viagens">
<title>${escapeHtml(content.title)}</title>
<style>${STYLES}</style>
</head>
<body>
<main>
<p class="brand">Anhangá Viagens</p>
<h1>${escapeHtml(content.heading)}</h1>
<p>${escapeHtml(content.message)}</p>
${whatsapp}
</main>
</body>
</html>`;
}

function htmlResponse(kind: 'expired' | 'not_found' | 'unavailable', method: string): Response {
    const content = pageFor(kind);
    const body = method === 'HEAD' ? null : renderPage(content);
    return new Response(body, { status: STATUS_BY_PAGE[kind], headers: SECURITY_HEADERS });
}

function previewResponse(offer: OfferRecord, method: string): Response {
    const title = offer.title ?? 'Oferta | Anhangá Viagens';
    const content: PageContent = {
        title,
        heading: title,
        message: 'Oferta da Anhangá Viagens.',
        showWhatsApp: false,
    };
    const body = method === 'HEAD' ? null : renderPage(content, title);
    return new Response(body, { status: 200, headers: SECURITY_HEADERS });
}

function redirectResponse(message: string): Response {
    const { 'Content-Type': _contentType, ...headers } = SECURITY_HEADERS;
    return new Response(null, {
        status: 302,
        headers: { ...headers, Location: offerWhatsAppUrl(message) },
    });
}

export interface OfferLinkPageDeps extends OfferLinkStoreDeps {
    /** The Pages context's `waitUntil`: records the click after the response is sent. */
    waitUntil?: (promise: Promise<unknown>) => void;
}

export async function handleOfferLinkRequest(
    request: Request,
    slug: string,
    deps: OfferLinkPageDeps = {},
): Promise<Response> {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response(null, { status: 405, headers: { ...SECURITY_HEADERS, Allow: 'GET, HEAD' } });
    }

    // A non-2xx makes the browser drop the speculative fetch, so the real
    // navigation is the request that counts and receives the 302.
    if (isPrefetchRequest(request)) {
        return new Response(null, { status: 503, headers: { ...SECURITY_HEADERS, 'Retry-After': '0' } });
    }

    const lookup = await loadOffer(slug, deps);
    if (lookup.status !== 'active') return htmlResponse(lookup.status, request.method);

    const { offer } = lookup;
    if (containsUrl(offer.message)) {
        return htmlResponse('unavailable', request.method);
    }

    // Previews (and HEAD) keep our card and must not count as a person opening the post.
    if (isLinkPreviewRequest(request)) return previewResponse(offer, request.method);

    const recording = recordOfferClick(slug, deps);
    if (deps.waitUntil) deps.waitUntil(recording);
    else await recording;

    return redirectResponse(offer.message);
}
