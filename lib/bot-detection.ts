/**
 * Lightweight, provider-agnostic bot heuristics for the public `submit-*` forms.
 *
 * Two zero-friction signals, checked at the request boundary before any Odoo
 * write (see `lib/n8n-submit-handler`):
 *  - honeypot: a hidden field no human ever fills; a non-empty value means a bot
 *    that blindly populated every input.
 *  - timing: forms submitted implausibly fast (< {@link MIN_FORM_ELAPSED_MS}
 *    after the UI mounted) are almost always automated.
 *
 * Both signals fail **open**: a missing or mangled field never blocks a submit,
 * so a genuine lead is never lost to a false positive. This is spam hygiene, not
 * a security control — rate limiting and schema validation remain the hard
 * boundaries. The field-name constants are shared with the client (`useAntiBot`)
 * so the wire contract has a single source of truth.
 */

/** Hidden input name. Plausible-but-unused so blind form-fillers target it. */
export const HONEYPOT_FIELD = 'website';

/** Epoch-ms timestamp of when the form UI mounted (client clock). */
export const RENDERED_AT_FIELD = 'renderedAt';

// A human needs at least a couple of seconds to read and fill even the shortest
// form (NPS is a single tap + submit). Kept conservative to avoid dropping fast
// but genuine users; anything under this is bot-shaped.
export const MIN_FORM_ELAPSED_MS = 2500;

export type BotSignal = 'honeypot' | 'timing';

export type BotDetection =
    | { bot: false }
    | { bot: true; reason: BotSignal };

/**
 * Classifies a raw request body against the two heuristics. `now` is injectable
 * for deterministic tests. Never throws and never blocks on absent/odd input.
 */
export function detectBot(body: unknown, now: number = Date.now()): BotDetection {
    if (typeof body !== 'object' || body === null) return { bot: false };

    const record = body as Record<string, unknown>;

    const honeypot = record[HONEYPOT_FIELD];
    if (honeypot != null && String(honeypot).trim() !== '') {
        return { bot: true, reason: 'honeypot' };
    }

    const renderedAt = record[RENDERED_AT_FIELD];
    if (typeof renderedAt === 'number' && Number.isFinite(renderedAt)) {
        const elapsed = now - renderedAt;
        // Only the "too fast" window is bot-shaped. Negative elapsed (client clock
        // ahead of the edge) or a large gap are treated as human — fail open.
        if (elapsed >= 0 && elapsed < MIN_FORM_ELAPSED_MS) {
            return { bot: true, reason: 'timing' };
        }
    }

    return { bot: false };
}
