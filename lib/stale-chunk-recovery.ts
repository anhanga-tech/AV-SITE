const STORAGE_KEY = 'av-stale-chunk-reload-attempts';
const MAX_RELOAD_ATTEMPTS = 1;

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

// Reloads the page once per session on a stale-chunk preload failure — a
// newer deploy replaced the hashed asset the stale bundle requested, so one
// reload should fetch the current build. Past that budget, the deploy itself
// is assumed broken rather than stale, so no further reloads are attempted.
//
// Vite re-throws the original preload error once `vite:preloadError`
// listeners return, unless a listener calls `event.preventDefault()` — so
// preventDefault() must be called precisely when (and only when) a reload is
// actually attempted here. Otherwise the very failure this function recovers
// from still propagates as an unhandled rejection straight to Sentry.
export function handleStaleChunkPreloadError(event: { preventDefault(): void }): void {
    const attempts = readAttempts();
    if (attempts === null || attempts >= MAX_RELOAD_ATTEMPTS) return;

    try {
        window.sessionStorage.setItem(STORAGE_KEY, String(attempts + 1));
    } catch {
        return;
    }

    event.preventDefault();
    window.location.reload();
}

// True once the reload budget above is spent, meaning the stale-chunk error
// isn't being auto-recovered and should be treated as a real signal.
export function hasExhaustedStaleChunkReloads(): boolean {
    const attempts = readAttempts();
    return attempts === null || attempts >= MAX_RELOAD_ATTEMPTS;
}
