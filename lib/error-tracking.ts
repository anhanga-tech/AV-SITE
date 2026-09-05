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
// catches `apiKey`, and `signature` covers webhook signatures (NPS invite
// HMAC) — both are named in docs/standards/security.md but were not
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
 * Only the parameter *name* is matched, so attribution params
 * (gclid/fbclid/utm_*) survive and Sentry URLs stay useful.
 */
// Names that carry a credential in a URL but are far too generic to add to
// SENSITIVE_KEY_PATTERN, which also guards structured log payloads: nearly every
// JSON response in this codebase carries a `code` field
// (`{ ok: false, code: 'VALIDATION_ERROR' }`), so redacting it there would erase
// the error taxonomy. In a URL, `code`/`state` are the GitHub OAuth callback's
// authorization code and CSRF state (api/auth/callback.ts) — the code is
// exchangeable for a `repo,user`-scoped token until it is spent.
const SENSITIVE_URL_PARAM_PATTERN = /^(?:code|state)$/i;

function isSensitiveParamName(rawKey: string): boolean {
    // A percent-encoded name still reaches the app decoded — `?%74oken=` is read
    // as `token` by URLSearchParams — so match on the decoded spelling.
    // decodeURIComponent throws on a malformed `%` sequence, and a scrubber must
    // never throw inside beforeSend; fall back to the raw spelling.
    let key: string;
    try {
        key = decodeURIComponent(rawKey);
    } catch {
        key = rawKey;
    }

    return SENSITIVE_KEY_PATTERN.test(key) || SENSITIVE_URL_PARAM_PATTERN.test(key);
}

/** Redacts values in a raw `a=1&b=2` query string, preserving each key verbatim. */
function scrubQueryPairs(query: string): string {
    return query
        .split('&')
        .map((pair) => {
            const separator = pair.indexOf('=');
            if (separator < 0) return pair;
            const key = pair.slice(0, separator);
            return isSensitiveParamName(key) ? `${key}=${REDACTED_VALUE}` : pair;
        })
        .join('&');
}

export function scrubSensitiveUrl(url: string): string {
    const queryStart = url.indexOf('?');
    if (queryStart < 0) return url;

    const hashStart = url.indexOf('#', queryStart);
    const query = hashStart < 0 ? url.slice(queryStart + 1) : url.slice(queryStart + 1, hashStart);
    const scrubbed = scrubQueryPairs(query);

    return `${url.slice(0, queryStart + 1)}${scrubbed}${hashStart < 0 ? '' : url.slice(hashStart)}`;
}

/** Sentry's `QueryParams`: a raw query string, a key→value map, or pairs. */
export type QueryParamsLike = string | Record<string, string> | Array<[string, string]>;

export function scrubQueryParams(query: QueryParamsLike): QueryParamsLike {
    if (typeof query === 'string') return scrubQueryPairs(query);

    if (Array.isArray(query)) {
        return query.map(([key, value]): [string, string] =>
            isSensitiveParamName(key) ? [key, REDACTED_VALUE] : [key, value]
        );
    }

    return Object.fromEntries(
        Object.entries(query).map(([key, value]) => [key, isSensitiveParamName(key) ? REDACTED_VALUE : value])
    );
}

// Keys under which a Sentry SDK stores a raw URL: navigation breadcrumbs use
// `from`/`to`, fetch/xhr breadcrumbs use `url`, and tracing spans use the
// OpenTelemetry `url.full` / `http.url` attributes.
const URL_DATA_KEYS: readonly string[] = ['from', 'to', 'url', 'url.full', 'http.url'];

// Headers whose value is a full URL, so they carry the referring page's query
// string. `Referrer-Policy: strict-origin-when-cross-origin` (public/_headers)
// strips the path only CROSS-origin — a same-origin request still sends the
// full URL. `NpsPage` posts to `/api/submit-nps` from `/nps?token=…`, so that
// request's `Referer` carries the invite credential.
const URL_HEADER_NAMES = new Set(['referer', 'referrer']);

function isUrlDataKey(key: string): boolean {
    if (URL_DATA_KEYS.includes(key)) return true;
    // Span attributes namespace headers as `http.request.header.referer`.
    return URL_HEADER_NAMES.has(key.slice(key.lastIndexOf('.') + 1).toLowerCase());
}

/** Structural subset of a Sentry event — keeps this module free of an SDK import
 *  so the Cloudflare Pages middleware and the browser bundle can share it. */
type UrlBearingEvent = {
    request?: { url?: string; query_string?: QueryParamsLike; headers?: Record<string, string> };
    contexts?: { trace?: { data?: Record<string, unknown> } };
    spans?: Array<{ data?: Record<string, unknown> }>;
};

export function scrubUrlBag<T extends Record<string, unknown>>(bag: T | undefined): T | undefined {
    if (!bag) return bag;

    let scrubbed: T | undefined;
    for (const [key, value] of Object.entries(bag)) {
        if (typeof value !== 'string' || !isUrlDataKey(key)) continue;
        const safe = scrubSensitiveUrl(value);
        if (safe === value) continue;
        scrubbed ??= { ...bag };
        (scrubbed as Record<string, unknown>)[key] = safe;
    }

    return scrubbed ?? bag;
}

/** Redacts URL-bearing request headers (see URL_HEADER_NAMES). */
function scrubRequestHeaders(
    headers: Record<string, string> | undefined,
): Record<string, string> | undefined {
    if (!headers) return headers;

    let scrubbed: Record<string, string> | undefined;
    for (const [name, value] of Object.entries(headers)) {
        if (typeof value !== 'string' || !URL_HEADER_NAMES.has(name.toLowerCase())) continue;
        const safe = scrubSensitiveUrl(value);
        if (safe === value) continue;
        scrubbed ??= { ...headers };
        scrubbed[name] = safe;
    }

    return scrubbed ?? headers;
}

/**
 * Strips credentials out of every URL an event carries (see scrubSensitiveUrl).
 * Applies to errors AND transactions — a sampled pageload/request transaction
 * reports `request.url` even when nothing went wrong.
 */
export function scrubEventUrls<T extends UrlBearingEvent>(event: T): T {
    const request = event.request;
    if (request) {
        event.request = {
            ...request,
            ...(request.url ? { url: scrubSensitiveUrl(request.url) } : {}),
            // `@sentry/cloudflare` builds `event.request` through
            // `winterCGRequestToRequestData`, which derives `query_string` from the
            // same URL but stores it as its own field. Redacting only `url` would
            // leave the credential fully intact on the server path.
            ...(request.query_string ? { query_string: scrubQueryParams(request.query_string) } : {}),
            // Headers ride along too: `requestdata.js` includes them by default
            // and strips only `cookie`/IP headers, never `referer`.
            ...(request.headers ? { headers: scrubRequestHeaders(request.headers) } : {}),
        };
    }

    const trace = event.contexts?.trace;
    if (trace?.data) {
        event.contexts = { ...event.contexts, trace: { ...trace, data: scrubUrlBag(trace.data) } };
    }

    // Child spans of a sampled transaction carry outbound request URLs in their
    // attributes. That matters here beyond the NPS token: the GA4 Measurement
    // Protocol offers no alternative to `api_secret` in the query string
    // (lib/conversions/google.ts), so that secret rides in a span URL by design.
    if (event.spans) {
        event.spans = event.spans.map((span) =>
            span.data ? { ...span, data: scrubUrlBag(span.data) } : span
        );
    }

    return event;
}

/** Breadcrumb scrubber shaped structurally so the Worker bundle can use it
 *  without importing the browser SDK's `Breadcrumb` type. */
export function scrubBreadcrumbUrls<T extends { data?: Record<string, unknown> }>(breadcrumb: T): T {
    const scrubbed = scrubUrlBag(breadcrumb.data);
    return scrubbed === breadcrumb.data ? breadcrumb : { ...breadcrumb, data: scrubbed };
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
