import { z } from 'zod';

const UTM_MAX = 255;
const nullableUtmString = z.string().max(UTM_MAX).nullish();

const LeadUtmsSchema = z.looseObject({
    utm_source: nullableUtmString,
    utm_medium: nullableUtmString,
    utm_campaign: nullableUtmString,
    utm_term: nullableUtmString,
    utm_content: nullableUtmString,
}).optional();

// Validated as a plain object; individual fields are normalised by normalizeTracking.
// Cap the key count so an attacker cannot force expensive validation/normalization
// with an unbounded tracking object (only ~15 extras are ever persisted).
const MAX_TRACKING_KEYS = 50;
const LeadTrackingSchema = z
    .record(z.string(), z.unknown())
    .refine((value) => {
        if (Object.keys(value).length > MAX_TRACKING_KEYS) return false;
        // extras is typed as z.unknown() (not recursed by Zod), so an attacker
        // could otherwise nest a huge object here to bypass the top-level cap.
        const extras = value.extras;
        if (typeof extras === 'object' && extras !== null && !Array.isArray(extras)) {
            return Object.keys(extras).length <= MAX_TRACKING_KEYS;
        }
        return true;
    }, {
        message: `tracking and its extras accept at most ${MAX_TRACKING_KEYS} keys`,
    })
    .optional();

export const SubmitLeadBodySchema = z.object({
    firstName:   z.string().min(1).max(100),
    lastName:    z.string().min(1).max(100),
    email:       z.email().max(254),
    whatsapp:    z.string().min(1),
    event_id:    z.string().max(128).optional(),
    bantSummary: z.string().min(1).max(5000),
    destination: z.string().min(1).max(255),
    empresa:     z.string().max(255).optional(),
    cargo:       z.string().max(255).optional(),
    referred:    z.string().max(255).optional(),
    marketingOptIn: z.boolean().optional(),
    utms:        LeadUtmsSchema,
    tracking:    LeadTrackingSchema,
});
