import { captureLoggerError } from './error-tracking';

const STORAGE_KEY_PREFIX = 'av-stale-chunk-reload-attempts:';
const MAX_RELOAD_ATTEMPTS = 1;
const UNKNOWN_ASSET_KEY = 'unknown';
const UNKNOWN_BUILD_KEY = 'unknown-build';

// Browser-reported wording for a dynamic-import/chunk-preload failure caused
// by a superseded, content-hashed deploy asset. Shared by the Sentry noise
// filter (lib/sentry-client.ts) and the render-time boundary
// (components/ChunkErrorBoundary.tsx) so both classify the same failure the
// same way instead of drifting apart.
const STALE_CHUNK_MESSAGE_PATTERN =
    /Unable to preload CSS for|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i;

export function isStaleChunkErrorMessage(message: string | null | undefined): boolean {
    return !!message && STALE_CHUNK_MESSAGE_PATTERN.test(message);
}

// Sentry tag set on the deliberate report below. lib/sentry-client.ts's
// beforeSend checks for it and lets the event through unconditionally,
// *before* running isStaleChunkMessage — the report's own Error necessarily
// still mentions the original stale-chunk wording (for a readable message),
// so the ordinary message-pattern filter would otherwise self-filter this
// exact signal right back out.
export const STALE_CHUNK_EXHAUSTED_TAG_KEY = 'stale_chunk_exhausted';
export const STALE_CHUNK_EXHAUSTED_TAG_VALUE = 'true';

// Not every browser's failure message embeds the failing asset's URL (e.g.
// the bare "Importing a module script failed"), so the message alone can't
// always distinguish one deploy's failure from another's. The entry script
// tag's own `src` does: Vite rewrites it to a content-hashed URL on every
// build, stable for the lifetime of the current page and different after
// the next deploy — exactly the fingerprint the budget key needs.
function currentBuildFingerprint(): string {
    try {
        const script = window.document?.querySelector?.('script[type="module"][src]') as
            | { src?: string }
            | null
            | undefined;
        return script?.src || UNKNOWN_BUILD_KEY;
    } catch {
        return UNKNOWN_BUILD_KEY;
    }
}

// Keyed by (current build, failing message): repeats of the same failure
// within one deploy share — and exhaust — one budget; a later deploy's
// failure (different script src, and often a different message) gets its
// own fresh budget, even in a long-lived tab that survives both deploys.
function storageKeyFor(message: string | null | undefined): string {
    return STORAGE_KEY_PREFIX + currentBuildFingerprint() + ':' + (message ?? UNKNOWN_ASSET_KEY);
}

// Returns null when sessionStorage is unavailable (private browsing, disabled
// storage) so callers fail safe toward "already exhausted" instead of risking
// a reload loop with no way to track how many attempts already happened.
function readAttempts(key: string): number | null {
    try {
        return Number(window.sessionStorage.getItem(key) ?? '0');
    } catch {
        return null;
    }
}

// Reports a stale-chunk failure that we are NOT silently auto-recovering
// (reload budget spent, or sessionStorage unavailable so it can't be
// tracked). We report this directly rather than relying on the underlying
// JS exception happening to reach Sentry on its own: ChunkErrorBoundary
// swallows render-time chunk errors without reporting them at all, and
// (see handleStaleChunkPreloadError below) we deliberately don't suppress
// or observe Vite's own re-thrown error either.
//
// Tagged with STALE_CHUNK_EXHAUSTED_TAG_KEY so lib/sentry-client.ts's
// beforeSend lets it through unconditionally — its message necessarily still
// contains the original stale-chunk wording, which the ordinary
// message-pattern filter would otherwise drop right back out.
function reportUnrecoveredStaleChunk(message: string | null | undefined): void {
    const originalMessage = message || 'Unknown stale-chunk failure (no message, or sessionStorage unavailable)';

    captureLoggerError(
        `Stale-chunk reload did not recover the app: ${originalMessage}`,
        undefined,
        { [STALE_CHUNK_EXHAUSTED_TAG_KEY]: STALE_CHUNK_EXHAUSTED_TAG_VALUE }
    );
}

// Reloads the page once per (build, failing message) pair. A newer deploy
// replaced the hashed asset the stale bundle requested, so one reload should
// fetch the current build; past that budget, the deploy itself is assumed
// broken rather than stale, so no further reloads are attempted and the
// failure is reported instead (see reportUnrecoveredStaleChunk).
//
// Shared by both recovery paths below (the `vite:preloadError` listener and
// `ChunkErrorBoundary`) against the *same* sessionStorage budget: a single
// stale-chunk failure can reach both — the preload event first, then a
// render-time throw — and they must not each reload independently, or one
// failure triggers two uncoordinated reloads instead of one.
function attemptBoundedReload(message: string | null | undefined): boolean {
    const key = storageKeyFor(message);
    const attempts = readAttempts(key);

    if (attempts !== null && attempts < MAX_RELOAD_ATTEMPTS) {
        try {
            window.sessionStorage.setItem(key, String(attempts + 1));
            window.location.reload();
            return true;
        } catch {
            // Storage write failed after the read succeeded (rare) — fall
            // through to reporting below rather than reloading blindly.
        }
    }

    reportUnrecoveredStaleChunk(message);
    return false;
}

// Deliberately does NOT call `event.preventDefault()`. Vite's `__vitePreload`
// helper — which every `React.lazy(() => import(...))` compiles to in a
// production build — is `baseModule().catch(handlePreloadError)`, where
// `handlePreloadError` re-throws the original error only if the event's
// default wasn't prevented. Calling preventDefault() here would make that
// promise resolve to `undefined` instead of rejecting, which breaks
// React.lazy's contract: React reads `.default` off the resolved module and
// throws a new, unrelated `TypeError` — the exact noise this module exists
// to avoid, just with a message our classifier no longer recognizes.
//
// Letting the original error propagate is safe: ChunkErrorBoundary already
// swallows it without reporting to Sentry, and lib/sentry-client.ts's
// beforeSend filters it by message for any case that isn't boundary-wrapped.
// Genuinely broken deploys still get a signal via reportUnrecoveredStaleChunk
// above once the reload budget is spent — a signal we generate ourselves
// rather than one we'd have to hope the browser surfaces.
//
// Vite attaches the original error as `event.payload` (see its
// `handlePreloadError` helper) — that's where the failing asset's message
// comes from for keying the budget.
export function handleStaleChunkPreloadError(event: { payload?: unknown }): void {
    const message = event.payload instanceof Error ? event.payload.message : undefined;
    attemptBoundedReload(message);
}

// Used by ChunkErrorBoundary.componentDidCatch: reloads once per (build,
// failing message) pair, sharing the listener's budget above. Returns false
// once that budget is spent, so the boundary renders its fallback UI instead
// of reloading (or looping) again.
export function attemptStaleChunkBoundaryReload(error: Error): boolean {
    return attemptBoundedReload(error?.message);
}
