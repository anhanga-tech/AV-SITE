/**
 * Maps the JSON of the `cotacao-aerea-anhanga` skill (the air quotation built
 * from the consolidator's PDF or print) to the proposal page content (P10,
 * #1905). One option per link: the other options' prices are never stored.
 *
 * A projection, like lib/proposal-infotravel.ts: only fields the page may
 * show are read. The commission (`remuneracao`: RAV, fee, DU), per-leg
 * prices (D2), fare notes and passenger ages are never copied.
 *
 * Totals follow the skill's own script (`gerar_proposta.py`), so the page
 * shows the same amounts as the PDF and the WhatsApp text: each leg's price
 * is rounded per currency, a missing currency is converted at the
 * quotation's rate and marked approximate, and the total is their sum.
 */
import { z } from 'zod';

import { proposalContentSchema, type ProposalContent } from './proposal-content';

export const AEREO_PRICE_NOTE = 'O valor final é confirmado no momento da reserva: tarifas aéreas mudam sem aviso prévio.';
const LOCAL_TIMES_NOTE = 'Horários no fuso local de cada cidade.';

const CURRENCIES = ['BRL', 'USD'] as const;
type Currency = (typeof CURRENCIES)[number];

const text = z.string().trim().min(1);
const price = z.number().positive();

// Unknown keys (`remuneracao`, `nota`, `de`/`para`…) are stripped, never kept.
const quotationSchema = z.object({
    data_cotacao: z.string().optional(),
    titulo: text,
    passageiros: text,
    moedas: z.array(z.enum(CURRENCIES)).min(1).max(2).optional(),
    cambio: z.object({ USD: price.optional(), data: z.string().optional() }).optional(),
    observacoes: z.array(text).max(8).optional(),
    opcoes: z.array(z.object({
        total_obs: z.string().optional(),
        trechos: z.array(z.object({
            rotulo: z.string().optional(),
            cia: text,
            bagagem: z.string().optional(),
            voos: z.array(z.object({
                numero: text,
                origem: text,
                destino: text,
                partida: text,
                chegada: text,
                duracao: z.string().optional(),
            })).min(1),
            preco: z.partialRecord(z.enum(CURRENCIES), price),
        })).min(1),
    })).min(1),
});

export type AereoQuotation = z.input<typeof quotationSchema>;

/** Why a quotation was refused; safe to log (no value from the quotation). */
export type AereoQuotationError =
    | 'invalid_quotation'
    | 'option_required'
    | 'option_not_found'
    | 'invalid_travelers'
    | 'missing_exchange_rate'
    | 'invalid_content';

const COUNT_WORDS: Record<string, 'adults' | 'children' | 'infants'> = {
    adulto: 'adults',
    adultos: 'adults',
    criança: 'children',
    crianças: 'children',
    bebê: 'infants',
    bebês: 'infants',
};

/**
 * `2 adultos + 1 bebê`, `2 adultos e 1 criança (5 anos)` → counts. Ages in
 * parentheses are dropped (counts only, policy 5.10). Anything else is
 * refused rather than guessed.
 */
export function parseTravelers(value: string): ProposalContent['travelers'] | null {
    const counts = { adults: 0, children: 0, infants: 0 };
    const parts = value.replace(/\([^)]*\)/g, ' ').split(/\s*(?:\+|,|\se\s)\s*/).map((part) => part.trim()).filter(Boolean);
    for (const part of parts) {
        const match = /^(\d{1,2})\s+(\S+)$/.exec(part.toLocaleLowerCase('pt-BR'));
        const field = match ? COUNT_WORDS[match[2]] : undefined;
        if (!match || !field) return null;
        counts[field] += Number(match[1]);
    }
    if (counts.adults < 1) return null;
    return { adults: counts.adults, children: counts.children, ...(counts.infants ? { infants: counts.infants } : {}) };
}

/** `3h46` / `12h05` → `3:46` / `12:05`; anything else is left out. */
function duration(value: string | undefined): string | undefined {
    const match = /^(\d{1,2})h([0-5]\d)$/.exec(value?.trim() ?? '');
    return match ? `${match[1]}:${match[2]}` : undefined;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

/** R$ per unit, as the skill's `cambio` (`{ "USD": 4.9935 }`); BRL is 1. */
function ratesOf(quotation: z.output<typeof quotationSchema>): Partial<Record<Currency, number>> {
    return { BRL: 1, ...(quotation.cambio?.USD ? { USD: quotation.cambio.USD } : {}) };
}

/** Same as the skill's `Precos.resolve`: the leg's price in `currency`, converted when missing. */
function legPrice(
    prices: Partial<Record<Currency, number>>,
    currency: Currency,
    rates: Partial<Record<Currency, number>>,
): { amount: number; approximate: boolean } | null {
    const native = prices[currency];
    if (native !== undefined) return { amount: round2(native), approximate: false };
    const [baseCurrency, baseAmount] = Object.entries(prices)[0] as [Currency, number];
    const baseRate = rates[baseCurrency];
    const rate = rates[currency];
    if (baseRate === undefined || rate === undefined) return null;
    return { amount: round2((baseAmount * baseRate) / rate), approximate: true };
}

function exchangeNote(quotation: z.output<typeof quotationSchema>, approximate: boolean): string | undefined {
    const rate = quotation.cambio?.USD;
    if (!rate || !(quotation.moedas ?? ['BRL']).includes('USD')) return undefined;
    // The skill's `ref_cambio`: the rate's date, or the quotation's.
    const day = quotation.cambio?.data || quotation.data_cotacao;
    const reference = `câmbio ${day ? `de ${day} ` : ''}(US$ 1,00 = R$ ${rate.toFixed(4).replace('.', ',')})`;
    return approximate
        ? `Valor aproximado, convertido pelo ${reference}. A cobrança é feita na moeda original do trecho.`
        : `Valores de referência pelo ${reference}.`;
}

const plain = (value: string) => value.replace(/\*\*(.+?)\*\*/g, '$1').trim();

/**
 * The page content for one option of the quotation (`option` is 1-based, as
 * the skill numbers them; required when there is more than one).
 */
export function fromAereoQuotation(
    input: unknown,
    options: { option?: number; firstName?: string },
): { content: ProposalContent } | { error: AereoQuotationError } {
    const parsed = quotationSchema.safeParse(input);
    if (!parsed.success) return { error: 'invalid_quotation' };
    const quotation = parsed.data;

    if (options.option === undefined && quotation.opcoes.length > 1) return { error: 'option_required' };
    const chosen = quotation.opcoes[(options.option ?? 1) - 1];
    if (!chosen) return { error: 'option_not_found' };

    const travelers = parseTravelers(quotation.passageiros);
    if (!travelers) return { error: 'invalid_travelers' };

    // BRL is always computed (the stored total); USD only when the quotation shows it.
    const shown = quotation.moedas ?? ['BRL'];
    const currencies: Currency[] = shown.includes('BRL') ? [...shown] : [...shown, 'BRL'];
    const rates = ratesOf(quotation);
    const totals: Partial<Record<Currency, { amount: number; approximate: boolean }>> = {};
    for (const currency of currencies) {
        let amount = 0;
        let approximate = false;
        for (const leg of chosen.trechos) {
            const resolved = legPrice(leg.preco, currency, rates);
            if (!resolved) return { error: 'missing_exchange_rate' };
            amount += resolved.amount;
            approximate ||= resolved.approximate;
        }
        totals[currency] = { amount: round2(amount), approximate };
    }

    const brl = totals.BRL!;
    const usd = shown.includes('USD') ? totals.USD : undefined;
    const anyApproximate = Object.values(totals).some((total) => total?.approximate);
    const notes = [
        LOCAL_TIMES_NOTE,
        ...(quotation.observacoes ?? []).map(plain),
        exchangeNote(quotation, anyApproximate),
        chosen.total_obs ? plain(chosen.total_obs) : undefined,
    ].filter((note): note is string => Boolean(note));

    const content = proposalContentSchema.safeParse({
        firstName: options.firstName,
        destination: plain(quotation.titulo),
        travelers,
        flights: chosen.trechos.flatMap((leg) => leg.voos.map((flight) => ({
            airline: leg.cia,
            number: flight.numero,
            from: flight.origem,
            to: flight.destino,
            departure: flight.partida,
            arrival: flight.chegada,
            duration: duration(flight.duracao),
            leg: leg.rotulo?.trim() || undefined,
            baggage: leg.bagagem?.trim() || undefined,
        }))),
        transfers: [],
        extras: [],
        total: {
            amount: brl.amount,
            currency: 'BRL',
            ...(brl.approximate ? { approximate: true } : {}),
            ...(usd ? { usd: { amount: usd.amount, ...(usd.approximate ? { approximate: true } : {}), primary: shown[0] === 'USD' } } : {}),
            note: AEREO_PRICE_NOTE,
        },
        notes,
    });
    if (!content.success) return { error: 'invalid_content' };
    return { content: content.data };
}
