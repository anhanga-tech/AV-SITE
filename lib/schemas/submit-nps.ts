import { z } from 'zod';
import { cleanString } from '../lead-logic';

// Free-text NPS fields feed res.partner.name/comment via the Odoo mapper, which
// (unlike buildDescriptionHtml) assumes its inputs were already escaped at the
// provider boundary — the same contract lead/contact/quiz/waitlist honor through
// cleanString/normalizeNullable. Escaping angle brackets here keeps NPS on that
// boundary so raw markup never reaches CRM notes. `.max()` bounds the raw input
// before cleanString escapes, matching the other paths' order.
//
// `firstname` also re-checks the bound AFTER escaping: cleanString turns each
// `<`/`>` into a 4-char entity, so a name full of angle brackets could quadruple
// past the 100-char limit of the res.partner.name Char field. The contact path
// applies the same post-sanitization guard (`if (firstName.length > 100)`).
// reason/highlight target the unbounded `comment` Text field (and cleanString
// self-caps at 10k), so they don't need the extra guard.
export const SubmitNpsBodySchema = z.object({
    firstname: z.string().trim().min(1).max(100).transform(cleanString).refine((v) => v.length <= 100, { message: 'Nome inválido.' }),
    email:     z.email().max(254),
    score:     z.number().int().min(0).max(10),
    reason:    z.string().trim().max(2000).default('').transform(cleanString),
    highlight: z.string().trim().max(2000).default('').transform(cleanString),
});

export type SubmitNpsRequest = z.infer<typeof SubmitNpsBodySchema>;
