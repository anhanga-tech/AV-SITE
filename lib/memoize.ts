// PERFORMANCE: several handlers build a response purely from module-scope
// constants — the output never varies between requests within a deployment.
// `memoize0` caches a zero-argument builder's return value after the first
// call so repeat requests reuse the cached result instead of re-running the
// same array maps / string concatenation / object construction every time.
export function memoize0<T>(build: () => T): () => T {
    let cached: T | undefined;
    let hasCached = false;
    return () => {
        if (!hasCached) {
            cached = build();
            hasCached = true;
        }
        return cached as T;
    };
}
