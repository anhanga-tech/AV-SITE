/**
 * Cookies that carry the NPS invitation off the URL (issue #1666).
 *
 * The invite link is `/nps?token=…`, and the token is both a bearer
 * credential and reversible PII (`base64url(JSON)` with e-mail and first
 * name — see lib/nps-invite.ts). Zaraz's automatic Pageview fires before any
 * page code runs and ships the full URL (query included) to GA4 as
 * `page_location`, so a client-side `history.replaceState` is too late.
 *
 * Instead the edge (`lib/nps-invite-redirect.ts`) swaps the query for two
 * cookies and redirects to a clean `/nps/` — the HTML that loads analytics
 * never sees the secret:
 *  - `nps_invite`: the token. `HttpOnly` (page JS and tag scripts can't read
 *    it), `SameSite=Strict` (a cross-site page can't submit on the
 *    customer's behalf), `Path=/api/submit-nps` (sent nowhere else).
 *  - `nps_invite_name`: the first name from the verified payload, readable by
 *    the page for the greeting. Its presence is also how the page tells "has
 *    an invite" from "invalid link". `Path=/nps`, same lifetime.
 *
 * Shared by the edge redirect, the submit handler and the page, so it must
 * stay free of server-only imports.
 */

export const NPS_INVITE_TOKEN_COOKIE = 'nps_invite';
export const NPS_INVITE_NAME_COOKIE = 'nps_invite_name';
export const NPS_INVITE_TOKEN_COOKIE_PATH = '/api/submit-nps';
export const NPS_INVITE_NAME_COOKIE_PATH = '/nps';

/**
 * Long enough to fill the form after opening the e-mail, short enough that a
 * shared computer doesn't keep a live credential around for days. Reopening
 * the e-mail link re-issues both cookies while the invite itself is valid.
 */
export const NPS_INVITE_COOKIE_MAX_AGE_SECONDS = 2 * 60 * 60;

interface CookieOptions {
    path: string;
    maxAgeSeconds: number;
    httpOnly: boolean;
    /** False only on plain-HTTP local dev, where browsers drop `Secure` cookies off localhost. */
    secure: boolean;
}

function serializeCookie(name: string, value: string, options: CookieOptions): string {
    const parts = [
        `${name}=${encodeURIComponent(value)}`,
        `Path=${options.path}`,
        `Max-Age=${Math.max(0, Math.floor(options.maxAgeSeconds))}`,
        'SameSite=Strict',
    ];
    if (options.httpOnly) parts.push('HttpOnly');
    if (options.secure) parts.push('Secure');
    return parts.join('; ');
}

export function buildNpsInviteCookies(
    params: { token: string; firstname: string; maxAgeSeconds: number },
    secure: boolean,
): string[] {
    return [
        serializeCookie(NPS_INVITE_TOKEN_COOKIE, params.token, {
            path: NPS_INVITE_TOKEN_COOKIE_PATH,
            maxAgeSeconds: params.maxAgeSeconds,
            httpOnly: true,
            secure,
        }),
        serializeCookie(NPS_INVITE_NAME_COOKIE, params.firstname, {
            path: NPS_INVITE_NAME_COOKIE_PATH,
            maxAgeSeconds: params.maxAgeSeconds,
            httpOnly: false,
            secure,
        }),
    ];
}

export function buildClearedNpsInviteCookies(secure: boolean): string[] {
    return buildNpsInviteCookies({ token: '', firstname: '', maxAgeSeconds: 0 }, secure);
}

/** Reads one cookie from a `Cookie` header or `document.cookie` string. */
export function readCookie(cookieHeader: string | null | undefined, name: string): string | null {
    if (!cookieHeader) return null;
    for (const pair of cookieHeader.split(';')) {
        const separator = pair.indexOf('=');
        if (separator === -1) continue;
        if (pair.slice(0, separator).trim() !== name) continue;
        try {
            return decodeURIComponent(pair.slice(separator + 1).trim());
        } catch {
            return null;
        }
    }
    return null;
}
