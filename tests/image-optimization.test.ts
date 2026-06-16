import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_MAX_WIDTH,
  DEFAULT_MIN_BYTES,
  buildBackupKey,
  detectFormatFromKey,
  formatBytes,
  isBackupKey,
  isRecompressibleFormat,
  isWorthOverwriting,
  planResize,
  shouldOptimize,
} from '../lib/image-optimization';

test('detectFormatFromKey maps extensions case-insensitively', () => {
  assert.equal(detectFormatFromKey('images/blog/foo.jpg'), 'jpeg');
  assert.equal(detectFormatFromKey('images/blog/FOO.JPEG'), 'jpeg');
  assert.equal(detectFormatFromKey('images/blog/bar.PNG'), 'png');
  assert.equal(detectFormatFromKey('images/blog/baz.webp'), 'webp');
  assert.equal(detectFormatFromKey('images/blog/anim.gif'), 'gif');
  assert.equal(detectFormatFromKey('images/icon.svg'), 'svg');
  assert.equal(detectFormatFromKey('images/no-extension'), 'unknown');
});

test('isRecompressibleFormat only accepts jpeg and png', () => {
  assert.equal(isRecompressibleFormat('jpeg'), true);
  assert.equal(isRecompressibleFormat('png'), true);
  assert.equal(isRecompressibleFormat('webp'), false);
  assert.equal(isRecompressibleFormat('avif'), false);
  assert.equal(isRecompressibleFormat('gif'), false);
  assert.equal(isRecompressibleFormat('svg'), false);
  assert.equal(isRecompressibleFormat('unknown'), false);
});

test('shouldOptimize processes a heavy jpeg', () => {
  const decision = shouldOptimize({ key: 'images/blog/documentos.jpg', sizeBytes: 3_938 * 1024 });
  assert.deepEqual(decision, { process: true, reason: 'ok' });
});

test('shouldOptimize skips objects under the size threshold', () => {
  const decision = shouldOptimize({ key: 'images/blog/5-segredos-disney.jpg', sizeBytes: 284 * 1024 });
  assert.deepEqual(decision, { process: false, reason: 'already-light' });
});

test('shouldOptimize skips already-efficient and vector formats', () => {
  assert.equal(shouldOptimize({ key: 'images/x.webp', sizeBytes: 2_000_000 }).reason, 'unsupported-format');
  assert.equal(shouldOptimize({ key: 'images/x.avif', sizeBytes: 2_000_000 }).reason, 'unsupported-format');
  assert.equal(shouldOptimize({ key: 'images/x.svg', sizeBytes: 2_000_000 }).reason, 'unsupported-format');
  assert.equal(shouldOptimize({ key: 'images/x.gif', sizeBytes: 2_000_000 }).reason, 'unsupported-format');
});

test('shouldOptimize never re-processes objects already under the backup prefix', () => {
  const decision = shouldOptimize({ key: 'originals/images/blog/documentos.jpg', sizeBytes: 3_938 * 1024 });
  assert.deepEqual(decision, { process: false, reason: 'backup-object' });
});

test('shouldOptimize honours a custom min size', () => {
  assert.equal(shouldOptimize({ key: 'a.jpg', sizeBytes: 150 * 1024, minBytes: 100 * 1024 }).process, true);
  assert.equal(shouldOptimize({ key: 'a.jpg', sizeBytes: 90 * 1024, minBytes: 100 * 1024 }).process, false);
});

test('planResize only downscales wider-than-max originals', () => {
  assert.deepEqual(planResize(4000), { targetWidth: DEFAULT_MAX_WIDTH, willResize: true });
  assert.deepEqual(planResize(2400), { targetWidth: null, willResize: false });
  assert.deepEqual(planResize(1600), { targetWidth: null, willResize: false });
});

test('planResize never upscales a small original to the max width', () => {
  const plan = planResize(800);
  assert.equal(plan.willResize, false);
  assert.equal(plan.targetWidth, null);
});

test('planResize respects a custom max width', () => {
  assert.deepEqual(planResize(3000, 1800), { targetWidth: 1800, willResize: true });
});

test('isWorthOverwriting requires a strict size reduction', () => {
  assert.equal(isWorthOverwriting(1000, 800), true);
  assert.equal(isWorthOverwriting(1000, 1000), false);
  assert.equal(isWorthOverwriting(1000, 1200), false);
  assert.equal(isWorthOverwriting(1000, 0), false);
});

test('backup key helpers round-trip', () => {
  const key = 'images/blog/documentos.jpg';
  const backup = buildBackupKey(key);
  assert.equal(backup, 'originals/images/blog/documentos.jpg');
  assert.equal(isBackupKey(backup), true);
  assert.equal(isBackupKey(key), false);
});

test('formatBytes renders human units', () => {
  assert.equal(formatBytes(512), '512 B');
  assert.equal(formatBytes(300 * 1024), '300.0 KB');
  assert.equal(formatBytes(3_938 * 1024), '3.85 MB');
});

test('default thresholds match the documented policy', () => {
  assert.equal(DEFAULT_MIN_BYTES, 300 * 1024);
  assert.equal(DEFAULT_MAX_WIDTH, 2400);
});
