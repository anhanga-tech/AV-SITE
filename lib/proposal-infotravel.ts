/**
 * Maps an Infotravel (RCA) quotation, already normalized from `main.getBooking`
 * + `main.getHotel`, to the proposal page content (#1901). The adapter that
 * produces the normalized JSON from the API is #1906 (P11).
 *
 * A projection: only fields the page may show are read. Everything else in
 * the normalized JSON — booking id, per-item values, the commission
 * adjustment, passenger ages, airline logos on the operator's
 * domain and the operator's payment terms — is never copied.
 */
import { z } from 'zod';

import { isAllowedProposalPhoto, proposalContentSchema, type ProposalContent } from './proposal-content';

const MAX_PHOTOS = 24;

const optionalText = z.string().nullish();
const textList = z.array(z.string()).nullish();

const normalizedSchema = z.object({
    destino: z.string(),
    passageiros: z.object({ adultos: z.number(), idades: z.array(z.number()).nullish() }),
    hotel: z.object({
        nome: z.string(),
        estrelas: z.number().nullish(),
        endereco: optionalText,
        descricao: optionalText,
        checkin_hora: optionalText,
        checkout_hora: optionalText,
        comodidades: textList,
        fotos: textList,
    }).nullish(),
    quarto: z.object({
        tipo: z.string(),
        regime: optionalText,
        checkin: z.string(),
        checkout: z.string(),
        reembolsavel: z.boolean().nullish(),
        cancelamento: textList,
    }).nullish(),
    voos: z.array(z.object({
        number: z.union([z.string(), z.number()]),
        departure: z.string(),
        arrival: z.string(),
        duration: optionalText,
        stopsCount: z.number().nullish(),
        cia: z.string(),
        tarifa: optionalText,
        origem: z.string(),
        destino: z.string(),
    })).nullish(),
    transfers: z.array(z.object({ nome: z.string(), fornecedor: optionalText, cancelamento: textList })).nullish(),
    extras: z.array(z.object({ nome: z.string(), data: optionalText, descricao: optionalText })).nullish(),
    total: z.object({ amount: z.number(), currency: z.string() }),
});

function clean(value: string | null | undefined): string | undefined {
    const trimmed = value?.replace(/\s+/g, ' ').trim();
    return trimmed ? trimmed : undefined;
}

/** `"15:00 - "` (an open range from the API) becomes `"15:00"`. */
function cleanHour(value: string | null | undefined): string | undefined {
    return clean(value?.replace(/[\s-]+$/, ''));
}

/** The API runs sentences together (`sauna.Você`); put the space back. */
function cleanDescription(value: string | null | undefined): string | undefined {
    return clean(value?.replace(/([.!?])(?=[A-ZÀ-Ý])/g, '$1 '));
}

/** `2026-12-06T00:00:00` is a calendar day, not an instant: keep the date. */
function calendarDay(value: string): string {
    return value.slice(0, 10);
}

function photos(urls: string[] | null | undefined): string[] {
    const accepted = (urls ?? [])
        .map((url) => url.trim().replace(/^http:\/\//i, 'https://'))
        .filter(isAllowedProposalPhoto);
    return [...new Set(accepted)].slice(0, MAX_PHOTOS);
}

function list(values: string[] | null | undefined): string[] {
    return (values ?? []).map((value) => clean(value)).filter((value): value is string => value !== undefined);
}

export function fromInfotravelNormalized(input: unknown, options: { firstName?: string } = {}): ProposalContent {
    const source = normalizedSchema.parse(input);
    const { hotel, quarto } = source;
    const travelersCount = source.passageiros.idades?.length ?? source.passageiros.adultos;

    return proposalContentSchema.parse({
        firstName: clean(options.firstName),
        destination: source.destino,
        travelers: {
            adults: source.passageiros.adultos,
            children: Math.max(0, travelersCount - source.passageiros.adultos),
        },
        hotel: hotel && quarto ? {
            name: hotel.nome,
            stars: hotel.estrelas ?? undefined,
            address: clean(hotel.endereco),
            description: cleanDescription(hotel.descricao),
            amenities: list(hotel.comodidades),
            photos: photos(hotel.fotos),
            checkinTime: cleanHour(hotel.checkin_hora),
            checkoutTime: cleanHour(hotel.checkout_hora),
            room: {
                type: quarto.tipo,
                board: clean(quarto.regime),
                checkin: calendarDay(quarto.checkin),
                checkout: calendarDay(quarto.checkout),
                refundable: quarto.reembolsavel ?? undefined,
                cancellation: list(quarto.cancelamento),
            },
        } : undefined,
        flights: (source.voos ?? []).map((flight) => ({
            airline: flight.cia,
            number: String(flight.number),
            from: flight.origem,
            to: flight.destino,
            departure: flight.departure,
            arrival: flight.arrival,
            duration: clean(flight.duration),
            stops: flight.stopsCount ?? undefined,
            fareFamily: clean(flight.tarifa),
        })),
        transfers: (source.transfers ?? []).map((transfer) => ({
            name: transfer.nome,
            provider: clean(transfer.fornecedor),
            cancellation: list(transfer.cancelamento),
        })),
        extras: (source.extras ?? []).map((extra) => ({
            name: extra.nome,
            date: extra.data ? calendarDay(extra.data) : undefined,
            description: cleanDescription(extra.descricao),
        })),
        total: { amount: source.total.amount, currency: source.total.currency },
    });
}
