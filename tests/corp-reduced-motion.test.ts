import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prefersReducedMotion } from '../components/landings/shared/motion';

// Guards the corporativo globe auto-rotation / arc animation gate. The helper is
// the single source of truth read by CorpGlobe to honor the OS reduced-motion
// setting (PRODUCT.md: "Reduced motion não é opcional").

const originalWindow = (globalThis as { window?: unknown }).window;

function setWindow(value: unknown) {
    (globalThis as { window?: unknown }).window = value;
}

test.afterEach(() => {
    if (originalWindow === undefined) {
        delete (globalThis as { window?: unknown }).window;
    } else {
        setWindow(originalWindow);
    }
});

test('returns false when window is unavailable (SSR / prerender / node)', () => {
    setWindow(undefined);
    assert.equal(prefersReducedMotion(), false);
});

test('returns false when matchMedia is not a function', () => {
    setWindow({});
    assert.equal(prefersReducedMotion(), false);
});

test('returns true when the user prefers reduced motion', () => {
    setWindow({
        matchMedia: (query: string) => ({ matches: query.includes('reduce') }),
    });
    assert.equal(prefersReducedMotion(), true);
});

test('returns false when the user has no reduced-motion preference', () => {
    setWindow({
        matchMedia: () => ({ matches: false }),
    });
    assert.equal(prefersReducedMotion(), false);
});
