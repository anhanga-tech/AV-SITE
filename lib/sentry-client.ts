import * as Sentry from '@sentry/react';

import { setErrorTracker } from './error-tracking';

function isBrowserExtensionFrame(frame: { filename?: string }): boolean {
    const filename = frame.filename ?? '';

    return filename.includes('extension://')
        || filename.includes('chrome-extension://')
        || filename.includes('moz-extension://')
        || filename.includes('safari-web-extension://');
}

export function initClientErrorTracking(): void {
    const dsn = import.meta.env.VITE_SENTRY_DSN;

    if (typeof dsn !== 'string' || dsn.trim().length === 0) return;

    Sentry.init({
        dsn,
        environment: import.meta.env.MODE,
        tracesSampleRate: 0.1,
        enableLogs: true,
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
        ],
        tracePropagationTargets: ['localhost', /^https:\/\/(?:www\.)?anhanga\.tur\.br\/api/],
        beforeSend(event) {
            const frames = event.exception?.values?.flatMap(
                (exception) => exception.stacktrace?.frames ?? []
            ) ?? [];

            if (frames.some(isBrowserExtensionFrame)) return null;

            return event;
        },
    });

    setErrorTracker(Sentry.captureException);
}
