/**
 * Shared secret for the offer-link endpoints. Separate from
 * `PROPOSAL_API_SECRET`: a proposal credential must not create or read offers.
 */
import type { OfferLinkStoreDeps } from './offer-link-store';
import { timingSafeEqual } from './security';

/** `secret: null` in tests means the endpoint is not configured. */
export interface OfferLinkApiDeps extends OfferLinkStoreDeps {
    secret?: string | null;
}

export function getOfferLinkSecret(): string | null {
    const secret = process.env.OFFER_LINK_SECRET?.trim();
    return secret ? secret : null;
}

export function isOfferLinkAuthorized(request: Request, secret: string): boolean {
    const header = request.headers.get('authorization')?.trim() ?? '';
    const match = /^Bearer\s+(\S+)$/i.exec(header);
    return match !== null && timingSafeEqual(match[1], secret);
}
