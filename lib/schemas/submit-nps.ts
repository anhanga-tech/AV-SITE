import { z } from 'zod';
import { cleanString } from '../lead-logic';

// Wire-format body: identity (firstname/email) is never trusted from the
// request — it is read from the verified, signed invitation `token` instead
// (issue #1137). See lib/nps-invite.ts + api/submit-nps.ts's validate step.
export const SubmitNpsBodySchema = z.object({
    token:     z.string().min(1).max(4096),
    score:     z.number().int().min(0).max(10),
    reason:    z.string().trim().max(2000).default('').transform(cleanString),
    highlight: z.string().trim().max(2000).default('').transform(cleanString),
});

export type SubmitNpsBody = z.infer<typeof SubmitNpsBodySchema>;

/**
 * The validated shape leadInputFromSubmitNps consumes. `firstname`/`email`
 * come from the verified invitation payload (api/submit-nps.ts), not from
 * `SubmitNpsBodySchema` directly.
 *
 * Free-text fields feed res.partner.name/comment via the Odoo mapper, which
 * (unlike buildDescriptionHtml) assumes its inputs were already escaped at the
 * provider boundary — the same contract lead/contact/quiz/waitlist honor
 * through cleanString/normalizeNullable.
 */
export interface SubmitNpsRequest {
    firstname: string;
    email: string;
    score: number;
    reason: string;
    highlight: string;
    /**
     * The invitation token's jti, carried through internally so `onSendFailure`
     * can release the single-use guard if the Odoo write fails — never sent to
     * Odoo (leadInputFromSubmitNps destructures only the named fields above).
     */
    jti: string;
}
