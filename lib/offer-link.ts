/**
 * Pure rules for the offer short link `/o/<slug>` (canal Anhangá Ofertas).
 *
 * The public URL carries only the slug. The WhatsApp text stays on the server
 * so a caption cannot be edited into someone else's message, and so the link
 * never contains a phone number or a third-party URL.
 *
 * The destination number is the Anhangá line already used by `utils/whatsapp.ts`.
 * This module does not import that file: it runs on the edge and that module
 * boots browser tracking.
 */

export const ANHANGA_WHATSAPP_NUMBER = '5511955021519';

export const OFFER_PUBLIC_ORIGIN = 'https://www.anhanga.tur.br';

/** Date-only `expiresAt` is midnight in São Paulo. Brazil has no DST since 2019. */
export const OFFER_EXPIRY_OFFSET = '-03:00';

export const OFFER_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const OFFER_SLUG_MIN = 3;
export const OFFER_SLUG_MAX = 60;
export const OFFER_MESSAGE_MAX = 300;
export const OFFER_TITLE_MAX = 140;

const DAY_SECONDS = 24 * 60 * 60;
/** Click events: 90 days from the first human click, fixed with `EXPIRE NX`. */
export const OFFER_CLICKS_RETENTION_SECONDS = 90 * DAY_SECONDS;
/**
 * After `expiresAt` the record stays only so the link can say the offer ended
 * instead of looking like a typo. Same grace the proposal tombstone uses.
 */
export const OFFER_EXPIRED_GRACE_SECONDS = 30 * DAY_SECONDS;
/**
 * An offer with no `expiresAt` still gets a TTL, refreshed on every update.
 * A year covers a season posted ahead of time; the next POST renews it.
 */
export const OFFER_RECORD_DEFAULT_SECONDS = 366 * DAY_SECONDS;
/** How far ahead `expiresAt` may sit. Stops a typo from pinning a key for decades. */
export const OFFER_EXPIRES_MAX_AHEAD_MS = 3 * 366 * DAY_SECONDS * 1000;

const URL_IN_TEXT = /(?:https?:\/\/|www\.)|(?:^|[^\w.-])(?:[a-z0-9-]+\.)+[a-z]{2,24}\b/i;

export function offerPublicUrl(slug: string): string {
    return `${OFFER_PUBLIC_ORIGIN}/o/${slug}`;
}

export function isValidOfferSlug(value: unknown): value is string {
    return typeof value === 'string'
        && value.length >= OFFER_SLUG_MIN
        && value.length <= OFFER_SLUG_MAX
        && OFFER_SLUG_PATTERN.test(value);
}

/**
 * True when the text carries a URL. Whitespace is removed first so a broken
 * line cannot hide `https://`. A dotted token needs a letter TLD, so dates
 * like "jan.2027" and versions like "2.0" stay allowed.
 */
export function containsUrl(value: string): boolean {
    const compact = value.replace(/\s+/g, '');
    if (/(?:https?:\/\/|www\.)/i.test(compact)) return true;
    return URL_IN_TEXT.test(value);
}

/**
 * `YYYY-MM-DD` as 00:00 America/Sao_Paulo, or null when it is not a real date.
 * The offer is valid until that instant and expired from then on.
 */
export function parseOfferExpiryDate(value: string): number | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const parsed = Date.parse(`${value}T00:00:00${OFFER_EXPIRY_OFFSET}`);
    if (Number.isNaN(parsed)) return null;
    const check = new Date(parsed);
    // 00:00 at UTC−3 is 03:00 UTC on the same calendar day. A rolled date
    // (2027-02-31) fails this comparison.
    if (check.getUTCFullYear() !== year || check.getUTCMonth() + 1 !== month || check.getUTCDate() !== day) {
        return null;
    }
    if (check.getUTCHours() !== 3 || check.getUTCMinutes() !== 0 || check.getUTCSeconds() !== 0) return null;
    return parsed;
}

export function offerRecordTtlSeconds(expiresAtMs: number | null, now: number): number {
    if (expiresAtMs === null) return OFFER_RECORD_DEFAULT_SECONDS;
    const untilExpiry = Math.ceil((expiresAtMs - now) / 1000);
    return Math.max(untilExpiry + OFFER_EXPIRED_GRACE_SECONDS, 1);
}

/** Always the Anhangá number. The message is the stored text, never a caller-supplied URL. */
export function offerWhatsAppUrl(message: string): string {
    return `https://wa.me/${ANHANGA_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/** Generic Anhangá chat, with no offer text. Used when the offer has ended or the slug is unknown. */
export function genericWhatsAppUrl(): string {
    return `https://wa.me/${ANHANGA_WHATSAPP_NUMBER}`;
}
