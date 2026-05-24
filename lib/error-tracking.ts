export type ErrorCaptureContext = {
    extra: Record<string, unknown>;
};

type ErrorTracker = (error: unknown, context?: ErrorCaptureContext) => string | void;

const REDACTED_VALUE = '[redacted]';
const TRUNCATED_VALUE = '[truncated]';
const SENSITIVE_KEY_PATTERN = /(?:authorization|cookie|email|mail|password|phone|secret|senha|token|telefone|whatsapp)/i;

const noopErrorTracker: ErrorTracker = () => undefined;

let errorTracker: ErrorTracker = noopErrorTracker;

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Error);
}

function sanitizeForErrorTracking(value: unknown, depth = 0): unknown {
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

function isErrorTrackingConfigured(): boolean {
    return typeof process.env.SENTRY_DSN === 'string' && process.env.SENTRY_DSN.trim().length > 0;
}

export function captureLoggerError(message: string, data?: unknown): void {
    if (!isErrorTrackingConfigured()) return;

    const error = data instanceof Error ? data : new Error(message);
    const extra: Record<string, unknown> = { message };

    if (data !== undefined && !(data instanceof Error)) {
        extra.data = sanitizeForErrorTracking(data);
    }

    errorTracker(error, { extra });
}

export function setServerErrorTracker(tracker: ErrorTracker): void {
    errorTracker = tracker;
}

export function setErrorTrackerForTests(tracker: ErrorTracker): void {
    errorTracker = tracker;
}

export function resetErrorTrackerForTests(): void {
    errorTracker = noopErrorTracker;
}
