export type ErrorCaptureContext = {
    extra: Record<string, unknown>;
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

export function captureLoggerError(message: string, data?: unknown): void {
    if (errorTracker === noopErrorTracker) return;

    const error = data instanceof Error ? data : new Error(message);
    const extra: Record<string, unknown> = { message };

    if (data !== undefined && !(data instanceof Error)) {
        extra.data = sanitizeForErrorTracking(data);
    }

    errorTracker(error, { extra });
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
