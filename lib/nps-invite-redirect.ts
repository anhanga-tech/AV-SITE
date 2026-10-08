/**
 * Edge handoff for the NPS invite link (issue #1666): `/nps?token=…` never
 * reaches the HTML. The request is answered here with a 303 to a clean
 * `/nps/?i=<tab ref>` that sets the invite cookies under that ref (see
 * lib/nps-invite-cookie.ts), so Zaraz's automatic Pageview, the Cloudflare Web
 * Analytics beacon and Traks never see the token or the respondent's identity
 * (campaign params such as `utm_*` are kept; the tab ref is random). A
 * redirect response carries no HTML, so no tag runs on it; and after a redirect `document.referrer` is the page that
 * linked here (the mail client), not the URL with the token.
 */
import {
    buildNpsInviteCookies,
    createNpsInviteRef,
    NPS_INVITE_COOKIE_MAX_AGE_SECONDS,
    NPS_INVITE_REF_PARAM,
} from './nps-invite-cookie';
import { getNpsInviteSecret, verifyNpsInviteToken } from './nps-invite';
import { logger } from './logger';

const NPS_PATHS = new Set(['/nps', '/nps/index.html']);
const NPS_CLEAN_PATH = '/nps/';
const MAX_TOKEN_LENGTH = 4096;

/**
 * Query params that identify the respondent. `token` is the credential;
 * `firstname` was appended by the old link generator; `email` by the
 * pre-#1137 links. Anything else (e.g. UTMs an e-mail tool appends) is kept.
 */
const SENSITIVE_PARAMS = ['token', 'firstname', 'email'] as const;

export function isNpsInviteRequest(request: Request): boolean {
    if (request.method !== 'GET' && request.method !== 'HEAD') return false;
    const url = new URL(request.url);
    // Normalized like App.tsx's ClientFeatures: React Router matches routes
    // case-insensitively and with or without trailing slash, and the 404 HTML
    // that `/NPS?token=…` falls back to boots Zaraz just the same.
    const pathname = url.pathname.toLowerCase().replace(/\/+$/, '') || '/';
    if (!NPS_PATHS.has(pathname)) return false;
    return SENSITIVE_PARAMS.some((param) => url.searchParams.has(param));
}

/**
 * The clean target. `ref`, when present, is the tab ref naming this redirect's
 * cookie pair; an incoming `i` is dropped so a forwarded `/nps/?i=…` link can't
 * point a new invite at someone else's cookies.
 */
function buildCleanLocation(url: URL, ref: string | null): string {
    const clean = new URLSearchParams(url.searchParams);
    for (const param of SENSITIVE_PARAMS) clean.delete(param);
    clean.delete(NPS_INVITE_REF_PARAM);
    if (ref) clean.set(NPS_INVITE_REF_PARAM, ref);
    const query = clean.toString();
    return query ? `${NPS_CLEAN_PATH}?${query}` : NPS_CLEAN_PATH;
}

/**
 * The cookie pair for this invite, or `null` when there is no usable token. An
 * invalid link sets nothing and clears nothing: each invite lives under its own
 * tab ref, so a bad or token-less link must not touch another invite the
 * customer opened in another tab.
 */
async function resolveInviteCookies(
    token: string,
    ref: string,
    secure: boolean,
): Promise<string[] | null> {
    if (!token || token.length > MAX_TOKEN_LENGTH) return null;

    const secret = getNpsInviteSecret();
    if (!secret) {
        // Can't verify here, but /api/submit-nps answers SERVER_CONFIG_ERROR in
        // this state anyway — keep the form reachable so the customer sees
        // that message instead of a misleading "invalid link".
        logger.warn('NPS_INVITE_REDIRECT: NPS_INVITE_SECRET missing, invite not verified');
        return buildNpsInviteCookies(
            { ref, token, info: { name: '' }, maxAgeSeconds: NPS_INVITE_COOKIE_MAX_AGE_SECONDS },
            secure,
        );
    }

    // No log on rejection: this is a public, un-rate-limited route, and warn
    // output reaches Sentry — a stream of `/nps?token=junk` would flood it.
    // Rejections that matter are logged by /api/submit-nps, behind its rate limit.
    const verification = await verifyNpsInviteToken(token, secret);
    if (!verification.valid) return null;

    const remainingSeconds = Math.floor((verification.payload.exp - Date.now()) / 1000);
    return buildNpsInviteCookies(
        {
            ref,
            token,
            info: { name: verification.payload.firstname.trim() },
            maxAgeSeconds: Math.min(NPS_INVITE_COOKIE_MAX_AGE_SECONDS, remainingSeconds),
        },
        secure,
    );
}

/** Returns the redirect for an NPS invite request, or `null` when the request isn't one. */
export async function handleNpsInviteRequest(request: Request): Promise<Response | null> {
    if (!isNpsInviteRequest(request)) return null;

    const url = new URL(request.url);
    const token = url.searchParams.get('token')?.trim() ?? '';
    const ref = createNpsInviteRef();
    const cookies = await resolveInviteCookies(token, ref, url.protocol === 'https:');

    const headers = new Headers({
        Location: buildCleanLocation(url, cookies ? ref : null),
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
        'X-Robots-Tag': 'noindex, nofollow',
    });
    for (const cookie of cookies ?? []) headers.append('Set-Cookie', cookie);

    return new Response(null, { status: 303, headers });
}
