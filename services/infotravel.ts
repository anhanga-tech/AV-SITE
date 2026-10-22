/**
 * Read-only client for the Infotravel (RCA) quotation page's tRPC API (#1906,
 * epic #1894): the same public GETs the operator's proposal page makes with
 * only the link token — no login, no cookie.
 *
 * - `main.getBooking` `{token, clientUrl}` → the quotation (items, prices);
 * - `main.getHotel` `{companyCode, hotelKey}` → the hotel's photos, amenities
 *   and description.
 *
 * The base URL is fixed: the caller's link never chooses the host. Both calls
 * share one deadline. Any non-2xx, tRPC error envelope or unexpected shape is a
 * failure; the caller falls back to the tracked redirect.
 *
 * The request URL carries the booking token twice (`token` and `clientUrl` in
 * `input`): never log it, nor the upstream body (an error can echo the input).
 */
import { z } from 'zod';

const API_BASE = 'https://premium.infotravel.com.br/orcamento-web/api/trpc/';
const TOTAL_DEADLINE_MS = 6000;

export type InfotravelFailureReason = 'invalid_token' | 'timeout' | 'http_error' | 'unexpected_response';

export class InfotravelError extends Error {
    constructor(readonly reason: InfotravelFailureReason, readonly status?: number) {
        super(`INFOTRAVEL:${reason}${status ? `:${status}` : ''}`);
        this.name = 'InfotravelError';
    }
}

export interface InfotravelDeps {
    fetch?: typeof fetch;
    now?: () => number;
}

export interface InfotravelQuotation {
    booking: unknown;
    hotel: unknown | null;
}

const trpcSuccessSchema = z.array(z.object({ result: z.object({ data: z.object({ json: z.unknown() }) }) })).length(1);

const bookingHotelKeySchema = z.object({
    bookingPackages: z.array(z.object({
        bookingHotels: z.array(z.object({ hotel: z.object({ keyDetail: z.string().min(1).max(200) }) })).nullish(),
    })).min(1),
});

/**
 * The token from the operator link, read from the raw query: `searchParams`
 * would turn a base64 `+` into a space.
 */
export function extractInfotravelToken(link: string): string | null {
    let search: string;
    try {
        search = new URL(link).search;
    } catch {
        return null;
    }
    for (const pair of search.replace(/^\?/, '').split('&')) {
        const separator = pair.indexOf('=');
        if (separator <= 0 || pair.slice(0, separator) !== 'token') continue;
        try {
            const token = decodeURIComponent(pair.slice(separator + 1));
            return /^[A-Za-z0-9+/=_-]{8,512}$/.test(token) ? token : null;
        } catch {
            return null;
        }
    }
    return null;
}

/** The token is base64 of `RCA | <booking> | <hash>`; the first part is the company code. */
export function companyCodeFromToken(token: string): string | null {
    try {
        const [company] = atob(token.replace(/-/g, '+').replace(/_/g, '/')).split(' | ');
        return /^[A-Z0-9]{2,10}$/.test(company ?? '') ? company : null;
    } catch {
        return null;
    }
}

async function callProcedure(
    procedure: string,
    input: Record<string, unknown>,
    deadline: number,
    deps: InfotravelDeps,
): Promise<unknown> {
    const remaining = deadline - (deps.now ?? Date.now)();
    if (remaining <= 0) throw new InfotravelError('timeout');

    const url = `${API_BASE}${procedure}?batch=1&input=${encodeURIComponent(JSON.stringify({ 0: { json: input } }))}`;
    let response: Response;
    try {
        response = await (deps.fetch ?? fetch)(url, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            redirect: 'manual',
            signal: AbortSignal.timeout(remaining),
        });
    } catch (error) {
        throw new InfotravelError(error instanceof Error && error.name === 'TimeoutError' ? 'timeout' : 'http_error');
    }
    if (!response.ok) throw new InfotravelError('http_error', response.status);

    let body: unknown;
    try {
        body = await response.json();
    } catch (error) {
        // The deadline can also hit while the body is still streaming.
        const timedOut = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
        throw new InfotravelError(timedOut ? 'timeout' : 'unexpected_response');
    }
    const parsed = trpcSuccessSchema.safeParse(body);
    if (!parsed.success) throw new InfotravelError('unexpected_response');
    return parsed.data[0].result.data.json;
}

/** Fetches the quotation behind an operator link. Throws InfotravelError. */
export async function fetchInfotravelQuotation(link: string, deps: InfotravelDeps = {}): Promise<InfotravelQuotation> {
    const token = extractInfotravelToken(link);
    const companyCode = token ? companyCodeFromToken(token) : null;
    if (!token || !companyCode) throw new InfotravelError('invalid_token');

    const deadline = (deps.now ?? Date.now)() + TOTAL_DEADLINE_MS;
    const booking = await callProcedure('main.getBooking', { token, clientUrl: link }, deadline, deps);

    const keys = bookingHotelKeySchema.safeParse(booking);
    if (!keys.success) throw new InfotravelError('unexpected_response');
    const hotelKey = keys.data.bookingPackages[0].bookingHotels?.[0]?.hotel.keyDetail;
    const hotel = hotelKey
        ? await callProcedure('main.getHotel', { companyCode, hotelKey, clientUrl: link }, deadline, deps)
        : null;

    return { booking, hotel };
}
