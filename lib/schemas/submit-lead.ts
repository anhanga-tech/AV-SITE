import { z } from 'zod';

const UTM_MAX = 255;
const nullableUtmString = z.string().max(UTM_MAX).nullish();

const LeadUtmsSchema = z.object({
    utm_source: nullableUtmString,
    utm_medium: nullableUtmString,
    utm_campaign: nullableUtmString,
    utm_term: nullableUtmString,
    utm_content: nullableUtmString,
}).passthrough().optional();

// Validated as a plain object; individual fields are normalised by normalizeTracking.
const LeadTrackingSchema = z.record(z.string(), z.unknown()).optional();

export const SubmitLeadBodySchema = z.object({
    firstName:   z.string().min(1).max(100),
    lastName:    z.string().min(1).max(100),
    email:       z.string().email().max(254),
    whatsapp:    z.string().min(1),
    event_id:    z.string().max(128).optional(),
    bantSummary: z.string().min(1).max(5000),
    destination: z.string().min(1).max(255),
    utms:        LeadUtmsSchema,
    tracking:    LeadTrackingSchema,
});

export type SubmitLeadBody = z.infer<typeof SubmitLeadBodySchema>;
