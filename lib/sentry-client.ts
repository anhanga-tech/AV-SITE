import * as Sentry from '@sentry/react';

import { setErrorTracker } from './error-tracking';
import {
    isStaleChunkErrorMessage,
    STALE_CHUNK_EXHAUSTED_TAG_KEY,
    STALE_CHUNK_EXHAUSTED_TAG_VALUE,
} from './stale-chunk-recovery';

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
// The `vite:preloadError` listener in index.tsx (lib/stale-chunk-recovery.ts)
// already reloads once to recover, and reports the failure itself if that
// reload doesn't fix it — so this filter can drop the message unconditionally
// rather than trying to distinguish "recoverable" from "genuinely broken"
// here too. See handleStaleChunkPreloadError for why the underlying
// exception isn't a reliable signal to gate on.
export function isStaleChunkMessage(values: Array<{ value?: string }> | undefined): boolean {
    return !!values?.some((exception) => isStaleChunkErrorMessage(exception.value));
}

// Exported standalone (rather than left inline in Sentry.init below) so it
// can be exercised directly in tests against constructed event objects,
// instead of only through a stubbed error tracker — a stubbed tracker can't
// catch a bug where this function itself drops the event.
export function sentryBeforeSend(event: Sentry.ErrorEvent): Sentry.ErrorEvent | null {
    // A deliberate report from lib/stale-chunk-recovery.ts once its reload
    // budget is exhausted — its message necessarily still contains the
    // stale-chunk wording (for readability), which isStaleChunkMessage below
    // would otherwise drop right back out. Let it through unconditionally,
    // before any other filter runs.
    if (event.tags?.[STALE_CHUNK_EXHAUSTED_TAG_KEY] === STALE_CHUNK_EXHAUSTED_TAG_VALUE) {
        return event;
    }

    const exceptions = event.exception?.values;
    const frames = exceptions?.flatMap(
        (exception) => exception.stacktrace?.frames ?? []
    ) ?? [];

    if (frames.some(isBrowserExtensionFrame)) return null;
    if (isBrowserExtensionMessage(exceptions)) return null;
    if (isStaleChunkMessage(exceptions)) return null;

    return event;
}

// `beforeSend` above only filters error/exception events. React logs every
// error a boundary catches (ChunkErrorBoundary included) to `console.error`
// by default, and `consoleLoggingIntegration` below forwards console output
// through Sentry's separate Logs pipeline — so without this hook, the same
// stale-chunk noise `beforeSend` drops would still show up there.
export function sentryBeforeSendLog(log: Sentry.Log): Sentry.Log | null {
    if (isStaleChunkErrorMessage(String(log.message))) return null;

    return log;
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
        beforeSend: sentryBeforeSend,
        beforeSendLog: sentryBeforeSendLog,
    });

    setErrorTracker(Sentry.captureException);
}
