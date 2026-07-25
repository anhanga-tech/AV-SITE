import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const heroSource = await readFile(
  new URL('../components/landings/consultoria/ConsultoriaLandingSections.tsx', import.meta.url),
  'utf8',
);

test('consultoria hero uses the managed noise texture asset', () => {
  assert.match(heroSource, /NOISE_TEXTURE_URL/);
  assert.doesNotMatch(heroSource, /url\(['"]\/noise\.png['"]\)/);
});

test('consultoria hero only uses animation utilities available in the project', () => {
  assert.match(heroSource, /animate-pop-in/);
  assert.doesNotMatch(
    heroSource,
    /\b(?:animate-in|slide-in-from-bottom-4|fill-mode-both)\b/,
  );
});

test('consultoria hero limits transitions to the properties it changes', () => {
  assert.doesNotMatch(heroSource, /\btransition-all\b/);
  assert.match(heroSource, /transition-\[background-color,box-shadow,transform\]/);
});
