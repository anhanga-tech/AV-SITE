const STORAGE_KEY = 'av-stale-chunk-reload-attempts';
const MAX_RELOAD_ATTEMPTS = 1;

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

// Returns null when sessionStorage is unavailable (private browsing, disabled
// storage) so callers fail safe toward "already exhausted" instead of risking
// a reload loop with no way to track how many attempts already happened.
function readAttempts(): number | null {
    try {
        return Number(window.sessionStorage.getItem(STORAGE_KEY) ?? '0');
    } catch {
        return null;
    }
}

// Reloads the page once per session for a stale-chunk failure. A newer
// deploy replaced the hashed asset the stale bundle requested, so one reload
// should fetch the current build; past that budget, the deploy itself is
// assumed broken rather than stale, so no further reloads are attempted.
//
// Shared by both recovery paths below (the `vite:preloadError` listener and
// `ChunkErrorBoundary`) against the *same* sessionStorage budget: a single
// stale-chunk failure can reach both — the preload event first, then a
// render-time throw the event didn't manage to prevent — and they must not
// each reload independently, or one failure triggers two uncoordinated
// reloads instead of one.
function attemptBoundedReload(): boolean {
    const attempts = readAttempts();
    if (attempts === null || attempts >= MAX_RELOAD_ATTEMPTS) return false;

    try {
        window.sessionStorage.setItem(STORAGE_KEY, String(attempts + 1));
    } catch {
        return false;
    }

    window.location.reload();
    return true;
}

// Vite re-throws the original preload error once `vite:preloadError`
// listeners return, unless a listener calls `event.preventDefault()` — so
// preventDefault() must be called precisely when (and only when) a reload is
// actually attempted here. Otherwise the very failure this function recovers
// from still propagates (e.g. as an unhandled rejection straight to Sentry,
// or as a synchronous render-time throw into ChunkErrorBoundary).
export function handleStaleChunkPreloadError(event: { preventDefault(): void }): void {
    if (attemptBoundedReload()) {
        event.preventDefault();
    }
}

// Used by ChunkErrorBoundary.componentDidCatch: reloads once, sharing the
// listener's budget above. Returns false once that budget is spent, so the
// boundary renders its fallback UI instead of reloading (or looping) again.
export function attemptStaleChunkBoundaryReload(): boolean {
    return attemptBoundedReload();
}

// True once the reload budget above is spent, meaning the stale-chunk error
// isn't being auto-recovered and should be treated as a real signal.
export function hasExhaustedStaleChunkReloads(): boolean {
    const attempts = readAttempts();
    return attempts === null || attempts >= MAX_RELOAD_ATTEMPTS;
}
