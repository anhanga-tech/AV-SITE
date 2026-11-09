/**
 * Body of `POST /api/create-offer-link`. Unknown fields are rejected: the
 * endpoint must not grow a `redirectUrl` or a phone number by accident.
 */
import { z } from 'zod';

import {
    containsUrl,
    isValidOfferSlug,
    OFFER_MESSAGE_MAX,
    OFFER_TITLE_MAX,
    parseOfferExpiryDate,
} from '../offer-link';

export const createOfferLinkBodySchema = z.strictObject({
    slug: z.string().trim().refine(isValidOfferSlug),
    message: z.string().trim().min(1).max(OFFER_MESSAGE_MAX).refine((value) => !containsUrl(value)),
    title: z.string().trim().min(1).max(OFFER_TITLE_MAX).refine((value) => !containsUrl(value)).optional(),
    expiresAt: z.string().refine((value) => parseOfferExpiryDate(value) !== null).optional(),
});

export type CreateOfferLinkBody = z.infer<typeof createOfferLinkBodySchema>;
