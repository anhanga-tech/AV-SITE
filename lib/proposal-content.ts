/**
 * Content of a proposal page (#1901, epic #1894): what the customer sees on
 * `/proposta/<id>` when the proposal is not a tracked redirect.
 *
 * The schema is an allowlist, so the epic's rules hold by construction:
 * - D2: only the total. There is no field for a per-item price, so neither
 *   an item value nor the commission it would reveal can be stored;
 * - D6: only the first name (`firstName` keeps the first word);
 * - no operator internals: no booking id, agent, CNPJ or the operator's
 *   payment terms (the page shows the Anhangá's own conditions). The local
 *   supplier of a transfer may be named, discreetly (Felipe, 22/10/2026);
 * - D4: photos stay on the operator's servers, but only https URLs on the
 *   hosts below, which the page's CSP also allows.
 *
 * Re-validated on every read (lib/proposal-store.ts).
 */
import { z } from 'zod';

export const PROPOSAL_PHOTO_HOSTS = ['media.staticontent.com', 'media.infotravel.com.br'] as const;
const MAX_PHOTOS = 40;

const text = (max: number) => z.string().trim().min(1).max(max);
// Calendar day with no time zone, `YYYY-MM-DD` (a hotel night, an excursion day).
const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((day) => {
    const parsed = new Date(`${day}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(day);
});
// Local wall-clock time at the airport, with its offset: `2026-12-06T18:35:00-03:00`.
const localDateTime = z.string()
    .regex(/^(\d{4}-\d{2}-\d{2})T([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?(?:Z|[+-]\d{2}:\d{2})$/)
    .refine((value) => calendarDate.safeParse(value.slice(0, 10)).success);

export function isAllowedProposalPhoto(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' && !url.username && !url.password && !url.port
            && (PROPOSAL_PHOTO_HOSTS as readonly string[]).includes(url.hostname);
    } catch {
        return false;
    }
}

const photoUrl = z.string().max(500).refine(isAllowedProposalPhoto);

export const proposalContentSchema = z.strictObject({
    // First word only (D6), whatever the caller sends.
    firstName: z.string().trim().min(1).max(300).transform((name) => name.split(/\s+/)[0]).pipe(text(60)).optional(),
    destination: text(120),
    travelers: z.strictObject({
        adults: z.number().int().min(1).max(20),
        children: z.number().int().min(0).max(20),
    }),
    hotel: z.strictObject({
        name: text(160),
        stars: z.number().int().min(1).max(5).optional(),
        address: text(200).optional(),
        description: text(3000).optional(),
        amenities: z.array(text(120)).max(100),
        photos: z.array(photoUrl).max(MAX_PHOTOS),
        checkinTime: text(20).optional(),
        checkoutTime: text(20).optional(),
        room: z.strictObject({
            type: text(160),
            board: text(160).optional(),
            checkin: calendarDate,
            checkout: calendarDate,
            refundable: z.boolean().optional(),
            cancellation: z.array(text(400)).max(10),
        }).refine((room) => room.checkout > room.checkin, { message: 'checkout must be after checkin' }),
    }).optional(),
    flights: z.array(z.strictObject({
        airline: text(80),
        number: text(12),
        from: text(120),
        to: text(120),
        departure: localDateTime,
        arrival: localDateTime,
        duration: z.string().regex(/^\d{1,2}:\d{2}$/).optional(),
        // Absent when the operator doesn't say: never shown as a direct flight.
        stops: z.number().int().min(0).max(5).optional(),
        fareFamily: text(40).optional(),
    })).max(12),
    transfers: z.array(z.strictObject({
        name: text(200),
        provider: text(120).optional(),
        cancellation: z.array(text(400)).max(10),
    })).max(10),
    extras: z.array(z.strictObject({
        name: text(200),
        date: calendarDate.optional(),
        description: text(2000).optional(),
    })).max(20),
    total: z.strictObject({
        amount: z.number().positive().max(10_000_000),
        currency: z.literal('BRL'),
    }),
}).refine(
    (content) => Boolean(content.hotel) || content.flights.length + content.transfers.length + content.extras.length > 0,
    { message: 'a proposal page needs at least one included item' },
);

export type ProposalContent = z.output<typeof proposalContentSchema>;
export type ProposalContentInput = z.input<typeof proposalContentSchema>;
