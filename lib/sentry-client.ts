import * as Sentry from '@sentry/react';

import { setErrorTracker } from './error-tracking';
import { hasExhaustedStaleChunkReloads, isStaleChunkErrorMessage } from './stale-chunk-recovery';

function isBrowserExtensionFrame(frame: { filename?: string }): boolean {
    const filename = frame.filename ?? '';

    return filename.includes('extension://')
        || filename.includes('chrome-extension://')
        || filename.includes('moz-extension://')
        || filename.includes('safari-web-extension://');
}

// Some browser extension errors arrive as unhandled rejections with no stack
// frames (e.g. `runtime.sendMessage()` messaging failures). The frame-based
// filter above cannot catch these, so we also match against known extension
// error message patterns.
function isBrowserExtensionMessage(values: Array<{ value?: string }> | undefined): boolean {
    return !!values?.some(({ value }) =>
        !!value && /runtime\.sendMessage|Extension context invalidated/i.test(value)
    );
}

// Fires when a browser holds a pre-deploy bundle and tries to fetch a
// content-hashed chunk/CSS file that a newer deploy has already replaced.
// The `vite:preloadError` listener in index.tsx reloads the page once to
// recover, so this is expected noise — unless that reload budget is already
// spent (see `hasExhaustedStaleChunkReloads`), in which case the deploy is
// genuinely broken and the event should reach Sentry instead of being dropped.
export function isStaleChunkMessage(values: Array<{ value?: string }> | undefined): boolean {
    return !!values?.some(({ value }) => isStaleChunkErrorMessage(value));
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
            const exceptions = event.exception?.values;
            const frames = exceptions?.flatMap(
                (exception) => exception.stacktrace?.frames ?? []
            ) ?? [];

            if (frames.some(isBrowserExtensionFrame)) return null;
            if (isBrowserExtensionMessage(exceptions)) return null;
            if (isStaleChunkMessage(exceptions) && !hasExhaustedStaleChunkReloads()) return null;

            return event;
        },
    });

    setErrorTracker(Sentry.captureException);
}
