/**
 * Edge handler for `/proposta/<id>` (epic #1894, issue #1895).
 *
 * The page is rendered by a Pages Function, so `public/_headers` does not
 * apply: every security header is set here. The CSP has no `script-src`,
 * which also keeps Cloudflare-injected tags (Zaraz Pageview, Web Analytics
 * beacon) from running and shipping the URL — the id is the credential.
 *
 * An active proposal renders its page (lib/proposal-template.ts, #1901) or,
 * for a tracked redirect (#1896), answers 302 to the operator. One with
 * neither renders a short holding page.
 *
 * Each customer GET of an active proposal is recorded (lib/proposal-opens.ts,
 * #1897). Link previews and the signed internal preview are not. A redirect
 * proposal (#1896) answers 302 to the operator's page.
 */
import { isLinkPreviewRequest, isPrefetchRequest } from './link-preview-agents';
import { recordProposalOpen, type ProposalOpensRedis } from './proposal-opens';
import { buildProposalOpenedNote, postProposalNote, type ProposalOdooNotesDeps } from './proposal-odoo-notes';
import { notifyProposalOpen, shouldNotifyProposalOpen, type ProposalWebhookDeps } from './proposal-webhook';
import { isProposalPreviewRequest } from './proposal-preview';
import { loadProposal, type ProposalRecord } from './proposal-store';
import { PROPOSAL_PHOTO_HOSTS } from './proposal-content';
import { escapeHtml, renderProposalContent, WHATSAPP_NUMBER } from './proposal-template';

// D4: hotel photos load from the operator's servers (lib/proposal-content.ts).
// `no-referrer` keeps the proposal URL, and so its id, out of their logs.
const IMG_SRC = ["'self'", ...PROPOSAL_PHOTO_HOSTS.map((host) => `https://${host}`)].join(' ');

const SECURITY_HEADERS: Readonly<Record<string, string>> = {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'private, no-store',
    'Referrer-Policy': 'no-referrer',
    'X-Robots-Tag': 'noindex, nofollow',
    'Content-Security-Policy':
        `default-src 'none'; style-src 'unsafe-inline'; img-src ${IMG_SRC}; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Strict-Transport-Security': 'max-age=15768000',
    'Permissions-Policy':
        'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), midi=(), serial=(), hid=(), magnetometer=(), gyroscope=(), accelerometer=(), xr-spatial-tracking=()',
};

interface PageContent {
    title: string;
    heading: string;
    message: string;
    whatsappText: string;
}

const PAGES = {
    active: {
        title: 'Sua proposta | Anhangá Viagens',
        heading: 'Sua proposta está quase pronta',
        message: 'Estamos finalizando os detalhes desta página. Enquanto isso, fale com a gente pelo WhatsApp que enviamos tudo por lá.',
        whatsappText: 'Olá! Recebi o link da minha proposta e gostaria de falar sobre ela.',
    },
    expired: {
        title: 'Proposta expirada | Anhangá Viagens',
        heading: 'Esta proposta expirou',
        message: 'Os valores e a disponibilidade de uma viagem mudam rápido, por isso cada proposta vale por um prazo curto. Chama a gente no WhatsApp que preparamos uma atualizada.',
        whatsappText: 'Olá! O link da minha proposta expirou. Podem me enviar uma atualizada?',
    },
    not_found: {
        title: 'Proposta não encontrada | Anhangá Viagens',
        heading: 'Não encontramos esta proposta',
        message: 'Confira se o link foi copiado inteiro. Se o problema continuar, fale com a gente no WhatsApp.',
        whatsappText: 'Olá! Não consegui abrir o link da minha proposta.',
    },
    unavailable: {
        title: 'Proposta indisponível | Anhangá Viagens',
        heading: 'Não conseguimos abrir sua proposta agora',
        message: 'Tivemos um problema temporário. Tente de novo em alguns minutos ou fale com a gente no WhatsApp.',
        whatsappText: 'Olá! Não consegui abrir o link da minha proposta.',
    },
} as const satisfies Record<string, PageContent>;

type PageKind = keyof typeof PAGES;

const STATUS_BY_PAGE: Record<PageKind, number> = {
    active: 200,
    expired: 410,
    not_found: 404,
    unavailable: 503,
};

// Palette and button treatment from DESIGN.md: Ardósia Profunda text,
// Névoa de Amanhecer background, a single Âmbar Vivo CTA with the hard shadow.
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
.notice{margin:0 0 20px;padding:8px 12px;border-radius:8px;font-size:.875rem;font-weight:600;color:#0f172a;background:#e0f2fe}
.cta:focus-visible{outline:3px solid #0ea5e9;outline-offset:3px}
@media (prefers-reduced-motion:reduce){.cta{transition:none}}
`;

const INTERNAL_PREVIEW_NOTICE = 'Prévia interna: esta visita não conta como abertura do cliente.';

function renderPage(content: PageContent, internalPreview: boolean): string {
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(content.whatsappText)}`;
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="no-referrer">
<title>${escapeHtml(content.title)}</title>
<style>${STYLES}</style>
</head>
<body>
<main>
${internalPreview ? `<p class="notice" role="note">${escapeHtml(INTERNAL_PREVIEW_NOTICE)}</p>\n` : ''}<p class="brand">Anhangá Viagens</p>
<h1>${escapeHtml(content.heading)}</h1>
<p>${escapeHtml(content.message)}</p>
<a class="cta" href="${escapeHtml(whatsappUrl)}" rel="noopener noreferrer" target="_blank">Falar no WhatsApp</a>
</main>
</body>
</html>`;
}

function htmlResponse(kind: PageKind, method: string, internalPreview = false): Response {
    const body = method === 'HEAD' ? null : renderPage(PAGES[kind], internalPreview);
    return new Response(body, { status: STATUS_BY_PAGE[kind], headers: SECURITY_HEADERS });
}

/** The proposal page, or the holding page for a proposal stored without content. */
function proposalResponse(proposal: ProposalRecord, method: string, internalPreview = false): Response {
    if (!proposal.content) return htmlResponse('active', method, internalPreview);
    const body = method === 'HEAD' ? null : renderProposalContent(proposal.content, { expiresAt: proposal.expiresAt, internalPreview });
    return new Response(body, { status: 200, headers: SECURITY_HEADERS });
}

/**
 * Tracked redirect to the operator's page (#1896). `redirectUrl` was checked
 * against the allowlist when loaded (lib/proposal-store.ts). `no-referrer`
 * keeps the proposal URL, and so its id, out of the operator's logs.
 */
function redirectResponse(redirectUrl: string): Response {
    const { 'Content-Type': _contentType, ...headers } = SECURITY_HEADERS;
    return new Response(null, { status: 302, headers: { ...headers, Location: redirectUrl } });
}

export interface ProposalPageDeps {
    redis?: ProposalOpensRedis | null;
    now?: () => number;
    /** The Pages context's `waitUntil`: records the open after the response is sent. */
    waitUntil?: (promise: Promise<unknown>) => void;
    webhook?: ProposalWebhookDeps;
    odoo?: ProposalOdooNotesDeps;
}

/**
 * Records the open; when it is a relevant one (first, or 30+ minutes after
 * the previous), tells the sales bot (#1900) and notes it on the Odoo lead
 * (#1904), side by side. Never rejects.
 */
async function recordAndNotify(id: string, leadId: number | undefined, deps: ProposalPageDeps): Promise<void> {
    const recorded = await recordProposalOpen(id, deps);
    if (!recorded || !shouldNotifyProposalOpen(recorded.previousOpenAt, recorded.openedAt)) return;
    await Promise.all([
        notifyProposalOpen({ id, leadId, ...recorded }, { now: deps.now, ...deps.webhook }),
        postProposalNote(leadId, buildProposalOpenedNote(recorded), deps.odoo),
    ]);
}

export async function handleProposalRequest(
    request: Request,
    id: string,
    deps: ProposalPageDeps = {},
): Promise<Response> {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response(null, { status: 405, headers: { ...SECURITY_HEADERS, Allow: 'GET, HEAD' } });
    }

    // Refused rather than served uncounted: a non-2xx makes the browser drop
    // the speculative fetch, so the real navigation reaches us — and is the
    // request that counts the open and gets the 302 of a redirect proposal.
    if (isPrefetchRequest(request)) {
        return new Response(null, { status: 503, headers: { ...SECURITY_HEADERS, 'Retry-After': '0' } });
    }

    const lookup = await loadProposal(id, deps);
    if (lookup.status !== 'active') return htmlResponse(lookup.status, request.method);
    const { proposal } = lookup;
    const { redirectUrl, leadId } = proposal;

    // Link previews get the generic Anhangá page: the chat card stays ours, and
    // neither the operator link (a booking credential) nor the proposal's
    // content (first name, hotel, price) is handed to the preview servers.
    if (isLinkPreviewRequest(request)) return htmlResponse('active', request.method);

    if (await isProposalPreviewRequest(request, id)) {
        return redirectUrl ? redirectResponse(redirectUrl) : proposalResponse(proposal, request.method, true);
    }

    // After the response via waitUntil, which keeps the isolate alive until the
    // write and the webhook finish — so the 302 isn't held back by either.
    const recording = recordAndNotify(id, leadId, deps);
    if (deps.waitUntil) deps.waitUntil(recording);
    // Without waitUntil (tests, local dev) the response waits for the webhook too.
    else await recording;

    return redirectUrl ? redirectResponse(redirectUrl) : proposalResponse(proposal, request.method);
}
