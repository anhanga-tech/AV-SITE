export type ErrorCaptureContext = {
    extra: Record<string, unknown>;
    tags?: Record<string, string>;
};

type ErrorTracker = (error: unknown, context?: ErrorCaptureContext) => string | void;

const REDACTED_VALUE = '[redacted]';
const TRUNCATED_VALUE = '[truncated]';
// Any log data (console output + captured errors) flows through here on its way
// to Sentry, so this is the last-line net for the secrets/PII the security
// standard says must never be logged. Kept broad on purpose: `api[-_]?key` also
// catches `apiKey`, and `signature` covers webhook signatures (HubSpot, NPS
// invite HMAC) — both are named in docs/standards/security.md but were not
// previously redacted.
const SENSITIVE_KEY_PATTERN = /(?:api[-_]?key|authorization|bearer|cookie|credential|email|mail|password|phone|secret|senha|signature|token|telefone|whatsapp)/i;

const noopErrorTracker: ErrorTracker = () => undefined;

let errorTracker: ErrorTracker = noopErrorTracker;

function isPlainObject(value: unknown): value is Record<string, unknown> {
    if (typeof value !== 'object' || value === null) return false;
    // Only literal/plain objects. Native objects (Date, RegExp, Map, URL, …) are
    // left untouched by the sanitizer so logs keep their meaningful values instead
    // of being flattened into `{}`.
    const proto = Object.getPrototypeOf(value);
    return proto === null || proto === Object.prototype;
}

export function sanitizeForErrorTracking(value: unknown, depth = 0): unknown {
    if (depth > 4) return TRUNCATED_VALUE;

    if (value instanceof Error) {
        return {
            name: value.name,
            message: value.message,
        };
    }

    if (Array.isArray(value)) {
        return value.map((item) => sanitizeForErrorTracking(item, depth + 1));
    }

    if (isPlainObject(value)) {
        return Object.fromEntries(
            Object.entries(value).map(([key, item]) => [
                key,
                SENSITIVE_KEY_PATTERN.test(key) ? REDACTED_VALUE : sanitizeForErrorTracking(item, depth + 1),
            ])
        );
    }

    return value;
}

/**
 * Redacts credential-bearing query-string values from a URL before it reaches
 * telemetry.
 *
 * `sanitizeForErrorTracking` only guards structured log payloads, so a secret
 * carried in a URL was never covered: the signed NPS invite link
 * (`/nps?token=…`, lib/nps-invite.ts) is a bearer credential that authorizes
 * writing to a customer's CRM record, and Sentry attaches the raw
 * `event.request.url` to every error AND to every sampled transaction
 * (`tracesSampleRate: 0.1` on both the browser and the Pages middleware).
 *
 * Only the parameter *name* is matched, using the same pattern as log payloads,
 * so attribution params (gclid/fbclid/utm_*) survive and Sentry URLs stay
 * useful. The raw (still-encoded) key is tested so a malformed `%` sequence
 * cannot throw here.
 */
export function scrubSensitiveUrl(url: string): string {
    const queryStart = url.indexOf('?');
    if (queryStart < 0) return url;

    const hashStart = url.indexOf('#', queryStart);
    const query = hashStart < 0 ? url.slice(queryStart + 1) : url.slice(queryStart + 1, hashStart);

    const scrubbed = query
        .split('&')
        .map((pair) => {
            const separator = pair.indexOf('=');
            if (separator < 0) return pair;
            const key = pair.slice(0, separator);
            return SENSITIVE_KEY_PATTERN.test(key) ? `${key}=${REDACTED_VALUE}` : pair;
        })
        .join('&');

    return `${url.slice(0, queryStart + 1)}${scrubbed}${hashStart < 0 ? '' : url.slice(hashStart)}`;
}

// Keys under which a Sentry SDK stores a raw URL: navigation breadcrumbs use
// `from`/`to`, fetch/xhr breadcrumbs use `url`, and tracing spans use the
// OpenTelemetry `url.full` / `http.url` attributes.
const URL_DATA_KEYS = ['from', 'to', 'url', 'url.full', 'http.url'] as const;

/** Structural subset of a Sentry event — keeps this module free of an SDK import
 *  so the Cloudflare Pages middleware and the browser bundle can share it. */
type UrlBearingEvent = {
    request?: { url?: string };
    contexts?: { trace?: { data?: Record<string, unknown> } };
};

export function scrubUrlBag<T extends Record<string, unknown>>(bag: T | undefined): T | undefined {
    if (!bag) return bag;

    let scrubbed: T | undefined;
    for (const key of URL_DATA_KEYS) {
        const value = bag[key];
        if (typeof value !== 'string') continue;
        const safe = scrubSensitiveUrl(value);
        if (safe === value) continue;
        scrubbed ??= { ...bag };
        (scrubbed as Record<string, unknown>)[key] = safe;
    }

    return scrubbed ?? bag;
}

/**
 * Strips credentials out of every URL an event carries (see scrubSensitiveUrl).
 * Applies to errors AND transactions — a sampled pageload/request transaction
 * reports `request.url` even when nothing went wrong.
 */
export function scrubEventUrls<T extends UrlBearingEvent>(event: T): T {
    if (event.request?.url) {
        event.request = { ...event.request, url: scrubSensitiveUrl(event.request.url) };
    }

    const trace = event.contexts?.trace;
    if (trace?.data) {
        event.contexts = { ...event.contexts, trace: { ...trace, data: scrubUrlBag(trace.data) } };
    }

    return event;
}

export function captureLoggerError(message: string, data?: unknown, tags?: Record<string, string>): void {
    if (errorTracker === noopErrorTracker) return;

    const error = data instanceof Error ? data : new Error(message);
    const extra: Record<string, unknown> = { message };

    if (data !== undefined && !(data instanceof Error)) {
        extra.data = sanitizeForErrorTracking(data);
    }

    errorTracker(error, tags ? { extra, tags } : { extra });
}

export function setErrorTracker(tracker: ErrorTracker): void {
    errorTracker = tracker;
}

export function clearErrorTracker(): void {
    errorTracker = noopErrorTracker;
}

export function setErrorTrackerForTests(tracker: ErrorTracker): void {
    errorTracker = tracker;
}

export function resetErrorTrackerForTests(): void {
    clearErrorTracker();
}
