/**
 * Edge handoff for the NPS invite link (issue #1666): `/nps?token=…` never
 * reaches the HTML. The request is answered here with a 303 to a clean
 * `/nps/` that sets the invite cookies (see lib/nps-invite-cookie.ts), so
 * Zaraz's automatic Pageview, the Cloudflare Web Analytics beacon and Traks
 * only ever see the bare path. A redirect response carries no HTML, so no
 * tag runs on it; and after a redirect `document.referrer` is the page that
 * linked here (the mail client), not the URL with the token.
 */
import {
    buildClearedNpsInviteCookies,
    buildNpsInviteCookies,
    NPS_INVITE_COOKIE_MAX_AGE_SECONDS,
} from './nps-invite-cookie';
import { getNpsInviteSecret, verifyNpsInviteToken } from './nps-invite';
import { logger } from './logger';

const NPS_PATHS = new Set(['/nps', '/nps/']);
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
    if (!NPS_PATHS.has(url.pathname)) return false;
    return SENSITIVE_PARAMS.some((param) => url.searchParams.has(param));
}

function buildCleanLocation(url: URL): string {
    const clean = new URLSearchParams(url.searchParams);
    for (const param of SENSITIVE_PARAMS) clean.delete(param);
    const query = clean.toString();
    return query ? `${NPS_CLEAN_PATH}?${query}` : NPS_CLEAN_PATH;
}

async function resolveInviteCookies(token: string, secure: boolean): Promise<string[]> {
    if (!token || token.length > MAX_TOKEN_LENGTH) {
        return buildClearedNpsInviteCookies(secure);
    }

    const secret = getNpsInviteSecret();
    if (!secret) {
        // Can't verify here, but /api/submit-nps answers SERVER_CONFIG_ERROR in
        // this state anyway — keep the form reachable so the customer sees
        // that message instead of a misleading "invalid link".
        logger.warn('NPS_INVITE_REDIRECT: NPS_INVITE_SECRET missing, invite not verified');
        return buildNpsInviteCookies(
            { token, firstname: '', maxAgeSeconds: NPS_INVITE_COOKIE_MAX_AGE_SECONDS },
            secure,
        );
    }

    const verification = await verifyNpsInviteToken(token, secret);
    if (!verification.valid) {
        logger.warn('NPS_INVITE_REDIRECT: invitation rejected', { reason: verification.reason });
        return buildClearedNpsInviteCookies(secure);
    }

    const remainingSeconds = Math.floor((verification.payload.exp - Date.now()) / 1000);
    return buildNpsInviteCookies(
        {
            token,
            firstname: verification.payload.firstname.trim(),
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
    const cookies = await resolveInviteCookies(token, url.protocol === 'https:');

    const headers = new Headers({
        Location: buildCleanLocation(url),
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
        'X-Robots-Tag': 'noindex, nofollow',
    });
    for (const cookie of cookies) headers.append('Set-Cookie', cookie);

    return new Response(null, { status: 303, headers });
}
