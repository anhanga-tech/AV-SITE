import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, contentTypeFor, encodeCopySource } from '../scripts/optimize-r2-images';

test('parseArgs defaults to a safe dry-run', () => {
  const opts = parseArgs([]);
  assert.equal(opts.apply, false);
  assert.equal(opts.prefix, 'images/');
  assert.equal(opts.limit, null);
});

test('parseArgs reads all flags', () => {
  const opts = parseArgs(['--apply', '--prefix', 'images/blog/', '--limit', '3', '--max-width', '1800', '--min-kb', '500', '--quality', '70', '--backup-prefix', 'bak/']);
  assert.equal(opts.apply, true);
  assert.equal(opts.prefix, 'images/blog/');
  assert.equal(opts.limit, 3);
  assert.equal(opts.maxWidth, 1800);
  assert.equal(opts.minBytes, 500 * 1024);
  assert.equal(opts.quality, 70);
  assert.equal(opts.backupPrefix, 'bak/');
});

test('parseArgs rejects a flag missing its value', () => {
  assert.throws(() => parseArgs(['--prefix']), /Missing value for argument: --prefix/);
  assert.throws(() => parseArgs(['--limit']), /Missing value for argument: --limit/);
});

test('parseArgs rejects non-numeric values', () => {
  assert.throws(() => parseArgs(['--limit', 'abc']), /Invalid numeric value for argument: --limit/);
  assert.throws(() => parseArgs(['--quality', 'x']), /Invalid numeric value for argument: --quality/);
});

test('parseArgs rejects unknown arguments', () => {
  assert.throws(() => parseArgs(['--nope']), /Unknown argument: --nope/);
});

test('contentTypeFor keeps a valid image/* type and corrects generic ones', () => {
  assert.equal(contentTypeFor('jpeg', 'image/jpeg'), 'image/jpeg');
  assert.equal(contentTypeFor('png', 'image/png'), 'image/png');
  assert.equal(contentTypeFor('jpeg', 'application/octet-stream'), 'image/jpeg');
  assert.equal(contentTypeFor('png', 'binary/octet-stream'), 'image/png');
  assert.equal(contentTypeFor('jpeg', undefined), 'image/jpeg');
  assert.equal(contentTypeFor('png'), 'image/png');
});

test('encodeCopySource encodes specials per segment but keeps slashes literal', () => {
  assert.equal(
    encodeCopySource('av-site-media', 'images/blog/foo.jpg'),
    'av-site-media/images/blog/foo.jpg',
  );
  assert.equal(
    encodeCopySource('av-site-media', 'images/authors/perfil felipe.png'),
    'av-site-media/images/authors/perfil%20felipe.png',
  );
});
