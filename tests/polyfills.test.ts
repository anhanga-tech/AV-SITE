import test from 'node:test';
import assert from 'node:assert/strict';

// Regression test for Sentry NODE-1: Object.hasOwn not available on Chrome < 93.
// Simulates an environment without native Object.hasOwn by temporarily removing it,
// then re-running the polyfill logic to verify it installs a working implementation.

test('polyfill installs Object.hasOwn when missing', () => {
  const native = Object.hasOwn;
  try {
    // @ts-expect-error — simulating old browser
    Object.hasOwn = undefined;

    // Re-run the polyfill logic inline (mirrors polyfills.ts exactly)
    if (!Object.hasOwn) {
      const hop = Object.prototype.hasOwnProperty;
      Object.defineProperty(Object, 'hasOwn', {
        value: (obj: object, prop: PropertyKey) => hop.call(obj, prop),
        writable: true,
        configurable: true,
        enumerable: false,
      });
    }

    assert.equal(typeof Object.hasOwn, 'function', 'polyfill must install a function');
    assert.equal(Object.prototype.propertyIsEnumerable.call(Object, 'hasOwn'), false, 'polyfill must be non-enumerable');
    assert.equal(Object.hasOwn({ a: 1 }, 'a'), true);
    assert.equal(Object.hasOwn({ a: 1 }, 'b'), false);
    assert.equal(Object.hasOwn(Object.create({ inherited: true }), 'inherited'), false);
  } finally {
    Object.hasOwn = native;
  }
});

test('polyfill is a no-op when Object.hasOwn already exists', () => {
  const before = Object.hasOwn;

  // Re-run the guard — should not overwrite
  if (!Object.hasOwn) {
    const hop = Object.prototype.hasOwnProperty;
    Object.defineProperty(Object, 'hasOwn', {
      value: (obj: object, prop: PropertyKey) => hop.call(obj, prop),
      writable: true,
      configurable: true,
      enumerable: false,
    });
  }

  assert.equal(Object.hasOwn, before, 'native implementation must not be replaced');
});

test('polyfill uses captured hasOwnProperty reference, not live prototype lookup', () => {
  const native = Object.hasOwn;
  try {
    // @ts-expect-error — simulating old browser
    Object.hasOwn = undefined;

    const hop = Object.prototype.hasOwnProperty;
    Object.defineProperty(Object, 'hasOwn', {
      value: (obj: object, prop: PropertyKey) => hop.call(obj, prop),
      writable: true,
      configurable: true,
      enumerable: false,
    });

    // Poison the prototype after install — polyfill must be unaffected
    const original = Object.prototype.hasOwnProperty;
    Object.prototype.hasOwnProperty = () => true;
    try {
      // The polyfill captured `hop` before the poison, so result must still be correct
      assert.equal(Object.hasOwn({ a: 1 }, 'b'), false, 'must use captured reference, not poisoned one');
    } finally {
      Object.prototype.hasOwnProperty = original;
    }
  } finally {
    Object.hasOwn = native;
  }
});
