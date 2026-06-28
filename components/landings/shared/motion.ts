/**
 * Reads the user's OS-level "reduce motion" preference at call time.
 *
 * SSR-safe: returns false when `window`/`matchMedia` are unavailable (prerender,
 * Node test runner). Callers that need to react to live changes should also
 * subscribe to the media query; this helper is a point-in-time read.
 */
export function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches === true;
}
