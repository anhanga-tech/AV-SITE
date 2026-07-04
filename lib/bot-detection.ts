/**
 * Lightweight, provider-agnostic bot heuristics for the public `submit-*` forms.
 *
 * Two zero-friction signals, checked at the request boundary before any Odoo
 * write (see `lib/n8n-submit-handler`):
 *  - honeypot: a hidden field no human ever fills; a non-empty value means a bot
 *    that blindly populated every input.
 *  - timing: forms submitted implausibly fast (< {@link MIN_FORM_ELAPSED_MS} of
 *    elapsed time on the client since the UI mounted) are almost always automated.
 *
 * The elapsed time is measured **entirely on the client** (`Date.now()` at mount
 * minus `Date.now()` at submit) and sent as a plain duration, so there is no
 * cross-clock comparison and clock skew between the browser and the edge can
 * never produce a false positive.
 *
 * Both signals fail **open**: a missing or mangled field never blocks a submit,
 * so a genuine lead is never lost to a false positive. This is spam hygiene, not
 * a security control — rate limiting and schema validation remain the hard
 * boundaries. The field-name constants are shared with the client (`useAntiBot`)
 * so the wire contract has a single source of truth.
 */

/** Hidden input name. Plausible-but-unused so blind form-fillers target it. */
export const HONEYPOT_FIELD = 'website';

/** Client-measured elapsed time (ms) between the form mounting and submit. */
export const ELAPSED_TIME_FIELD = 'elapsedMs';

// A human needs at least a couple of seconds to read and fill even the shortest
// form (NPS is a single tap + submit). Kept conservative to avoid dropping fast
// but genuine users; anything under this is bot-shaped.
export const MIN_FORM_ELAPSED_MS = 2500;

export type BotSignal = 'honeypot' | 'timing';

export type BotDetection =
    | { bot: false }
    | { bot: true; reason: BotSignal };

/**
 * Classifies a raw request body against the two heuristics. Never throws and
 * never blocks on absent/odd input.
 */
export function detectBot(body: unknown): BotDetection {
    if (typeof body !== 'object' || body === null) return { bot: false };

    const record = body as Record<string, unknown>;

    const honeypot = record[HONEYPOT_FIELD];
    if (honeypot != null && String(honeypot).trim() !== '') {
        return { bot: true, reason: 'honeypot' };
    }

    const elapsed = record[ELAPSED_TIME_FIELD];
    if (typeof elapsed === 'number' && Number.isFinite(elapsed)) {
        // Only the "too fast" window is bot-shaped. A negative duration can only
        // come from a spoofed/monotonic-clock oddity, so treat it as human.
        if (elapsed >= 0 && elapsed < MIN_FORM_ELAPSED_MS) {
            return { bot: true, reason: 'timing' };
        }
    }

    return { bot: false };
}
