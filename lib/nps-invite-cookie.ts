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
 *  - `nps_invite_info`: readable by the page, `Path=/nps`, same lifetime. JSON
 *    with the first name from the verified payload (the greeting) and the
 *    invite's `jti` as `ref`. Its presence is how the page tells "has an
 *    invite" from "invalid link". The page freezes `ref` at load and sends it
 *    with the submission: opening a second invite in the same browser
 *    overwrites `nps_invite`, and without that check the first tab's answers
 *    would be written to the second customer's record. `jti` is a random
 *    UUID — not a credential (the signature is) and not personal data.
 *
 * Shared by the edge redirect, the submit handler and the page, so it must
 * stay free of server-only imports.
 */

export const NPS_INVITE_TOKEN_COOKIE = 'nps_invite';
export const NPS_INVITE_INFO_COOKIE = 'nps_invite_info';
export const NPS_INVITE_TOKEN_COOKIE_PATH = '/api/submit-nps';
export const NPS_INVITE_INFO_COOKIE_PATH = '/nps';

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

export interface NpsInviteInfo {
    /** The invite's `jti`; empty when the edge couldn't verify the token. */
    ref: string;
    name: string;
}

export function buildNpsInviteCookies(
    params: { token: string; info: NpsInviteInfo; maxAgeSeconds: number },
    secure: boolean,
): string[] {
    return [
        serializeCookie(NPS_INVITE_TOKEN_COOKIE, params.token, {
            path: NPS_INVITE_TOKEN_COOKIE_PATH,
            maxAgeSeconds: params.maxAgeSeconds,
            httpOnly: true,
            secure,
        }),
        serializeCookie(NPS_INVITE_INFO_COOKIE, JSON.stringify(params.info), {
            path: NPS_INVITE_INFO_COOKIE_PATH,
            maxAgeSeconds: params.maxAgeSeconds,
            httpOnly: false,
            secure,
        }),
    ];
}

export function buildClearedNpsInviteCookies(secure: boolean): string[] {
    return buildNpsInviteCookies({ token: '', info: { ref: '', name: '' }, maxAgeSeconds: 0 }, secure);
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

/** Parses `nps_invite_info`; `null` when absent or not the shape the edge writes. */
export function parseNpsInviteInfo(value: string | null): NpsInviteInfo | null {
    if (value === null) return null;
    try {
        const parsed: unknown = JSON.parse(value);
        if (!parsed || typeof parsed !== 'object') return null;
        const { ref, name } = parsed as Record<string, unknown>;
        if (typeof ref !== 'string' || typeof name !== 'string') return null;
        return { ref, name };
    } catch {
        return null;
    }
}
