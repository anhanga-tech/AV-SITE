import test from 'node:test';
import assert from 'node:assert/strict';
import {
  __resetHapticsLoaderForTests,
  __setHapticsLoaderForTests,
  destroyHaptics,
  triggerHaptic,
} from '../utils/haptics.ts';

test.afterEach(async () => {
  destroyHaptics();
  __resetHapticsLoaderForTests();
  delete (globalThis as { window?: unknown }).window;
  await Promise.resolve();
});

test('triggerHaptic lazily creates and reuses the singleton instance', async () => {
  let constructorCalls = 0;
  const triggerCalls: string[] = [];
  let destroyCalls = 0;

  __setHapticsLoaderForTests(async () => {
    constructorCalls += 1;
    return {
      async trigger(pattern) {
        triggerCalls.push(pattern);
      },
      destroy() {
        destroyCalls += 1;
      }
    };
  });

  (globalThis as { window?: unknown }).window = {};

  assert.equal(constructorCalls, 0);

  await triggerHaptic('medium');
  await triggerHaptic('heavy');

  assert.equal(constructorCalls, 1);
  assert.deepEqual(triggerCalls, ['medium', 'heavy']);

  destroyHaptics();
  await Promise.resolve();

  assert.equal(destroyCalls, 1);
});

test('triggerHaptic is a no-op outside the client environment', async () => {
  let constructorCalls = 0;

  __setHapticsLoaderForTests(async () => {
    constructorCalls += 1;
    return {
      async trigger() {},
      destroy() {}
    };
  });

  await assert.doesNotReject(triggerHaptic('light'));
  assert.equal(constructorCalls, 0);
});

test('triggerHaptic swallows loader and runtime failures', async () => {
  (globalThis as { window?: unknown }).window = {};

  __setHapticsLoaderForTests(async () => ({
    async trigger() {
      throw new Error('boom');
    },
    destroy() {}
  }));

  await assert.doesNotReject(triggerHaptic('light'));

  __setHapticsLoaderForTests(async () => {
    throw new Error('loader failed');
  });

  await assert.doesNotReject(triggerHaptic('heavy'));
});
