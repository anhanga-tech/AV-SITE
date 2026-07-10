/**
 * Signed, expiring, single-use NPS invitation (issue #1137).
 *
 * Before this, `/nps` trusted a caller-supplied `email`/`firstname` with no
 * proof the requester was actually the invited customer — anyone who knew or
 * guessed an e-mail could post a score/comment that mutates that customer's
 * `res.partner` record. The invite link now carries a token that is:
 *  - signed (HMAC-SHA256 over the payload, `NPS_INVITE_SECRET`) so it cannot
 *    be forged or altered,
 *  - expiring (`exp`, default 30 days — a post-trip survey window),
 *  - bound to a subject (`email`/`firstname` are read FROM the verified
 *    token server-side, never trusted from the request body), and
 *  - single-use (`jti` is consumed via `lib/nps-invite-replay.ts` on the
 *    first successful submit; a replayed link is rejected).
 *
 * Token shape: `base64url(JSON payload) + "." + base64url(HMAC signature)`.
 * Not a JWT (no header, no alg negotiation) — this is an internal link
 * format with a single fixed algorithm, so there is nothing for an attacker
 * to downgrade.
 */
import { timingSafeEqual } from './security';

const DEFAULT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface NpsInvitePayload {
    email: string;
    firstname: string;
    /** Expiry, epoch milliseconds. */
    exp: number;
    /** Unique id for single-use replay tracking. */
    jti: string;
}

export type NpsInviteValidation =
    | { valid: true; payload: NpsInvitePayload }
    | { valid: false; reason: 'malformed' | 'signature_mismatch' | 'expired' };

export function getNpsInviteSecret(): string | null {
    const secret = process.env.NPS_INVITE_SECRET?.trim();
    return secret ? secret : null;
}

function base64UrlEncode(bytes: Uint8Array): string {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(value: string): Uint8Array {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

async function hmacSign(secret: string, message: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
    return base64UrlEncode(new Uint8Array(signature));
}

/** Issues a signed invitation token. Used by the invite-generation flow (see docs), not by the public `/nps` page. */
export async function createNpsInviteToken(
    params: { email: string; firstname: string; expiresInMs?: number },
    secret: string,
): Promise<string> {
    const payload: NpsInvitePayload = {
        email: params.email.trim().toLowerCase(),
        firstname: params.firstname.trim(),
        exp: Date.now() + (params.expiresInMs ?? DEFAULT_MAX_AGE_MS),
        jti: crypto.randomUUID(),
    };
    const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
    const signature = await hmacSign(secret, payloadB64);
    return `${payloadB64}.${signature}`;
}

function isNpsInvitePayload(value: unknown): value is NpsInvitePayload {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as Record<string, unknown>;
    return (
        typeof candidate.email === 'string' &&
        typeof candidate.firstname === 'string' &&
        typeof candidate.exp === 'number' &&
        typeof candidate.jti === 'string'
    );
}

/** Verifies signature and expiry. Does not check single-use replay — see `lib/nps-invite-replay.ts`. */
export async function verifyNpsInviteToken(token: string, secret: string): Promise<NpsInviteValidation> {
    const parts = token.split('.');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
        return { valid: false, reason: 'malformed' };
    }
    const [payloadB64, signature] = parts;

    let payload: unknown;
    try {
        payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64)));
    } catch {
        return { valid: false, reason: 'malformed' };
    }
    if (!isNpsInvitePayload(payload)) {
        return { valid: false, reason: 'malformed' };
    }

    const expectedSignature = await hmacSign(secret, payloadB64);
    if (!timingSafeEqual(expectedSignature, signature)) {
        return { valid: false, reason: 'signature_mismatch' };
    }
    if (Date.now() > payload.exp) {
        return { valid: false, reason: 'expired' };
    }

    return { valid: true, payload };
}
