/**
 * Signed internal preview link for a proposal (#1897):
 * `/proposta/<id>?previa=<signature>`. It shows the same page without counting
 * as an open, so Felipe checking a proposal before sending it never triggers
 * the customer follow-up (#1900). The internal creation endpoint (#1899)
 * returns this link next to the customer one.
 *
 * The signature is an HMAC of the id under PROPOSAL_PREVIEW_SECRET: it can't
 * be derived from the customer link, and it opens nothing the id doesn't.
 */
import { timingSafeEqual } from './security';

export const PROPOSAL_PREVIEW_PARAM = 'previa';
const SIGNATURE_CONTEXT = 'proposta-previa:v1';
const MAX_SIGNATURE_LENGTH = 128;

export function getProposalPreviewSecret(): string | null {
    const secret = process.env.PROPOSAL_PREVIEW_SECRET?.trim();
    return secret ? secret : null;
}

function base64UrlEncode(bytes: Uint8Array): string {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function createProposalPreviewSignature(id: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`${SIGNATURE_CONTEXT}:${id}`));
    return base64UrlEncode(new Uint8Array(signature));
}

/**
 * True only for a valid signature of this id. Without a configured secret
 * every request counts as a customer open — failing towards "counted" keeps
 * the follow-up flow working; the cost is a stray internal open.
 */
export async function isProposalPreviewRequest(request: Request, id: string): Promise<boolean> {
    const signature = new URL(request.url).searchParams.get(PROPOSAL_PREVIEW_PARAM);
    if (!signature || signature.length > MAX_SIGNATURE_LENGTH) return false;

    const secret = getProposalPreviewSecret();
    if (!secret) return false;

    return timingSafeEqual(await createProposalPreviewSignature(id, secret), signature);
}
