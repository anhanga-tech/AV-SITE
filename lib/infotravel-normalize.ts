/**
 * Raw Infotravel (RCA) API responses → the normalized quotation JSON that
 * `fromInfotravelNormalized` (lib/proposal-infotravel.ts) turns into page
 * content (#1906, epic #1894).
 *
 * Only fields the page may use are read. The booking's `contact`/`user` (the
 * agent), `client` (the agency, with its CNPJ), `unit` (the RCA unit),
 * locators, `textDoc` (the operator's payment terms), supplier on-call
 * observations and logos are never copied.
 *
 * The quotation is refused — and the caller falls back to the tracked
 * redirect — unless it is a single-package, single-room quotation in BRL whose
 * total equals the sum of every price in it, to the cent. A category the page
 * doesn't show (insurance, car, train…) fails that check instead of hiding a
 * cost inside "tudo o que está incluso".
 */
import { z } from 'zod';

export type InfotravelNormalizeReason = 'unexpected_shape' | 'unsupported_quotation' | 'total_mismatch';

export class InfotravelNormalizeError extends Error {
    constructor(readonly reason: InfotravelNormalizeReason) {
        super(`INFOTRAVEL_NORMALIZE:${reason}`);
        this.name = 'InfotravelNormalizeError';
    }
}

const fareSchema = z.object({
    type: z.string(),
    price: z.object({ currency: z.string(), amount: z.number(), exchange: z.number().nullish() }),
});
const fares = z.array(fareSchema);
const penalties = z.object({
    refundable: z.boolean().nullish(),
    penalties: z.array(z.object({ description: z.string().nullish() })).nullish(),
}).nullish();
const person = z.object({ age: z.number().int().min(0).max(120), type: z.string() });
const place = z.object({ code: z.string(), city: z.object({ name: z.string() }) });

// The product categories the page shows. Any other `booking*` array with
// items (insurance, car, cruise, VIP lounge, one added later…) is refused,
// read from the raw payload so a category this code doesn't know about
// can't slip through.
const SUPPORTED_CATEGORIES = new Set(['bookingHotels', 'bookingFlights', 'bookingTours', 'bookingTickets', 'bookingTransfers']);

function hasUnsupportedCategory(rawObject: unknown, allowed: ReadonlySet<string>): boolean {
    if (!rawObject || typeof rawObject !== 'object') return true;
    return Object.entries(rawObject).some(([key, value]) =>
        /^booking[A-Z]/.test(key) && !allowed.has(key) && Array.isArray(value) && value.length > 0);
}

// At the booking root only the packages may carry products.
const ROOT_CATEGORIES = new Set(['bookingPackages']);

const bookingSchema = z.object({
    status: z.string(),
    // When the operator says when the quotation lapses, the page can't outlive it.
    expirationDate: z.string().nullish(),
    bookingAmount: z.object({ currency: z.string(), amount: z.number() }),
    bookingPackages: z.array(z.object({
        fares: fares.nullish(),
        bookingHotels: z.array(z.object({
            status: z.string(),
            rooms: z.array(z.object({
                roomType: z.object({ name: z.string() }),
                boardType: z.object({ name: z.string() }).nullish(),
                checkIn: z.string(),
                checkOut: z.string(),
                fares,
                names: z.array(person),
                cancellationPolicies: penalties,
            })),
        })).nullish(),
        bookingFlights: z.array(z.object({
            status: z.string(),
            names: z.array(person),
            fares,
            // A group with no flight would keep its fares in the total but show nothing.
            flights: z.array(z.object({
                airline: z.object({ name: z.string() }),
                fareFlight: z.object({ description: z.string().nullish() }).nullish(),
                origin: place,
                destination: place,
                departure: z.string(),
                arrival: z.string(),
                number: z.union([z.string(), z.number()]),
                duration: z.string().nullish(),
                stopsCount: z.number().nullish(),
            })).min(1),
        })).nullish(),
        bookingTours: z.array(z.object({
            status: z.string(),
            fares,
            names: z.array(person).nullish(),
            tour: z.object({ name: z.string(), date: z.string().nullish(), description: z.string().nullish() }),
        })).nullish(),
        bookingTickets: z.array(z.object({
            status: z.string(),
            fares,
            names: z.array(person).nullish(),
            ticket: z.object({ name: z.string(), start: z.string().nullish(), description: z.string().nullish() }),
        })).nullish(),
        bookingTransfers: z.array(z.object({
            status: z.string(),
            fares,
            names: z.array(person).nullish(),
            transfer: z.object({ name: z.string(), provider: z.string().nullish() }),
            cancellationPolicies: penalties,
        })).nullish(),
    })),
});

const hotelSchema = z.object({
    hotel: z.object({
        name: z.string(),
        description: z.string().nullish(),
        stars: z.number().nullish(),
        checkInTime: z.string().nullish(),
        checkOutTime: z.string().nullish(),
        address: z.object({
            address: z.string().nullish(),
            city: z.object({ name: z.string() }).nullish(),
        }).nullish(),
        images: z.array(z.object({ large: z.string().nullish() })).nullish(),
        facilities: z.array(z.object({ items: z.array(z.object({ name: z.string() })).nullish() })).nullish(),
    }),
});

const ENTITIES: Readonly<Record<string, string>> = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", ordm: 'º', ordf: 'ª', bull: '•', ndash: '–', mdash: '—', hellip: '…' };
// Portuguese accents: `&oacute;` → ó, `&Ccedil;` → Ç.
const ACCENTS: Readonly<Record<string, string>> = { acute: '\u0301', grave: '\u0300', tilde: '\u0303', circ: '\u0302', uml: '\u0308', cedil: '\u0327' };

function namedEntity(name: string): string | undefined {
    const plain = ENTITIES[name.toLowerCase()];
    if (plain) return plain;
    const accented = /^([a-zA-Z])(acute|grave|tilde|circ|uml|cedil)$/.exec(name);
    return accented ? `${accented[1]}${ACCENTS[accented[2]]}`.normalize('NFC') : undefined;
}

/** Operator HTML → plain text: tags out first, then entities, then whitespace. */
export function htmlToText(value: string | null | undefined): string | undefined {
    if (!value) return undefined;
    const text = value
        .replace(/<(?:br|\/p|\/div|\/li)\b[^>]*>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (entity, name: string) => {
            if (name.startsWith('#x') || name.startsWith('#X')) return String.fromCodePoint(Number.parseInt(name.slice(2), 16));
            if (name.startsWith('#')) return String.fromCodePoint(Number.parseInt(name.slice(1), 10));
            return namedEntity(name) ?? entity;
        })
        .replace(/\s+/g, ' ')
        .trim();
    return text || undefined;
}

function cents(amount: number): number {
    return Math.round(amount * 100);
}

function penaltyTexts(policies: z.infer<typeof penalties>): string[] {
    return (policies?.penalties ?? []).map((penalty) => htmlToText(penalty.description)).filter((text): text is string => Boolean(text));
}

/** Order-independent signature of a party: `ADT:31,ADT:34`. */
function partyKey(people: Array<z.infer<typeof person>>): string {
    return people.map((traveler) => `${traveler.type}:${traveler.age}`).sort().join(',');
}

function placeLabel(value: z.infer<typeof place>): string {
    return `${value.city.name} (${value.code})`;
}

/** The normalized quotation (the `normalizado.json` shape). Throws InfotravelNormalizeError. */
export function normalizeInfotravelQuotation(raw: { booking: unknown; hotel: unknown | null }): Record<string, unknown> {
    const parsedBooking = bookingSchema.safeParse(raw.booking);
    if (!parsedBooking.success) throw new InfotravelNormalizeError('unexpected_shape');
    const booking = parsedBooking.data;
    if (booking.status !== 'QUOTATION' || booking.bookingPackages.length !== 1) {
        throw new InfotravelNormalizeError('unsupported_quotation');
    }
    const [pack] = booking.bookingPackages;
    const rawPackage = (raw.booking as { bookingPackages: unknown[] }).bookingPackages[0];
    if (hasUnsupportedCategory(raw.booking, ROOT_CATEGORIES) || hasUnsupportedCategory(rawPackage, SUPPORTED_CATEGORIES)) {
        throw new InfotravelNormalizeError('unsupported_quotation');
    }
    const hotels = pack.bookingHotels ?? [];
    const flightGroups = pack.bookingFlights ?? [];
    if (hotels.length > 1 || flightGroups.length > 1 || hotels.some((item) => item.rooms.length !== 1)) {
        throw new InfotravelNormalizeError('unsupported_quotation');
    }
    // Every item still quoted: a cancelled or unavailable one would stay in the total.
    const items = [...hotels, ...flightGroups, ...(pack.bookingTours ?? []), ...(pack.bookingTickets ?? []), ...(pack.bookingTransfers ?? [])];
    if (items.some((item) => item.status !== 'QUOTATION')) throw new InfotravelNormalizeError('unsupported_quotation');
    // The page says the total and everything included are for one party:
    // every priced item that names its travelers must name the same ones.
    const parties = [
        hotels[0]?.rooms[0]?.names,
        flightGroups[0]?.names,
        ...[...(pack.bookingTours ?? []), ...(pack.bookingTickets ?? []), ...(pack.bookingTransfers ?? [])].map((item) => item.names),
    ].filter((names): names is Array<z.infer<typeof person>> => Boolean(names && names.length > 0)).map(partyKey);
    if (new Set(parties).size > 1) throw new InfotravelNormalizeError('unsupported_quotation');

    // Every price in the quotation, the commission adjustment included: the
    // page shows only the total, so it must be the sum of exactly these items.
    const allFares = [
        ...(pack.fares ?? []),
        ...hotels.flatMap((item) => item.rooms.flatMap((room) => room.fares)),
        ...flightGroups.flatMap((group) => group.fares),
        ...(pack.bookingTours ?? []).flatMap((item) => item.fares),
        ...(pack.bookingTickets ?? []).flatMap((item) => item.fares),
        ...(pack.bookingTransfers ?? []).flatMap((item) => item.fares),
    ];
    const foreign = booking.bookingAmount.currency !== 'BRL'
        || allFares.some((fare) => fare.price.currency !== 'BRL' || (fare.price.exchange ?? 1) !== 1);
    if (foreign) throw new InfotravelNormalizeError('unsupported_quotation');
    const sum = allFares.reduce((total, fare) => total + cents(fare.price.amount), 0);
    if (sum !== cents(booking.bookingAmount.amount)) throw new InfotravelNormalizeError('total_mismatch');

    const room = hotels[0]?.rooms[0];
    let hotelInfo: z.infer<typeof hotelSchema>['hotel'] | undefined;
    if (room) {
        const parsedHotel = hotelSchema.safeParse(raw.hotel);
        if (!parsedHotel.success) throw new InfotravelNormalizeError('unexpected_shape');
        hotelInfo = parsedHotel.data.hotel;
    }
    const flights = flightGroups[0]?.flights ?? [];
    const travelers = room?.names ?? flightGroups[0]?.names ?? [];
    const destination = hotelInfo?.address?.city?.name ?? flights[0]?.destination.city.name;
    if (!destination || travelers.length === 0) throw new InfotravelNormalizeError('unexpected_shape');

    return {
        destino: destination,
        passageiros: {
            adultos: travelers.filter((traveler) => traveler.type === 'ADT').length,
            idades: travelers.map((traveler) => traveler.age),
        },
        hotel: hotelInfo ? {
            nome: hotelInfo.name,
            estrelas: hotelInfo.stars ?? null,
            endereco: hotelInfo.address?.address ?? null,
            descricao: htmlToText(hotelInfo.description) ?? null,
            checkin_hora: hotelInfo.checkInTime ?? null,
            checkout_hora: hotelInfo.checkOutTime ?? null,
            comodidades: (hotelInfo.facilities ?? []).flatMap((group) => (group.items ?? []).map((item) => item.name)),
            fotos: (hotelInfo.images ?? []).map((image) => image.large).filter((url): url is string => Boolean(url)),
        } : null,
        quarto: room ? {
            tipo: room.roomType.name.replace(/\s+/g, ' ').trim(),
            regime: room.boardType?.name ?? null,
            checkin: room.checkIn,
            checkout: room.checkOut,
            reembolsavel: room.cancellationPolicies?.refundable ?? null,
            cancelamento: penaltyTexts(room.cancellationPolicies),
        } : null,
        voos: flights.map((flight) => ({
            number: String(flight.number),
            departure: flight.departure,
            arrival: flight.arrival,
            duration: flight.duration ?? null,
            stopsCount: flight.stopsCount ?? null,
            cia: flight.airline.name,
            tarifa: flight.fareFlight?.description ?? null,
            origem: placeLabel(flight.origin),
            destino: placeLabel(flight.destination),
        })),
        transfers: (pack.bookingTransfers ?? []).map((item) => ({
            nome: item.transfer.name,
            fornecedor: item.transfer.provider ?? null,
            cancelamento: penaltyTexts(item.cancellationPolicies),
        })),
        extras: [
            ...(pack.bookingTours ?? []).map((item) => ({
                nome: item.tour.name,
                data: item.tour.date ?? null,
                descricao: htmlToText(item.tour.description) ?? null,
            })),
            ...(pack.bookingTickets ?? []).map((item) => ({
                nome: item.ticket.name,
                data: item.ticket.start ?? null,
                descricao: htmlToText(item.ticket.description) ?? null,
            })),
        ],
        total: { amount: booking.bookingAmount.amount, currency: booking.bookingAmount.currency },
        validade: booking.expirationDate ?? null,
    };
}
