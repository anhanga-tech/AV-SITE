import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readHero = () => readFile(new URL('../components/Hero.tsx', import.meta.url), 'utf8');

test('Hero replaces generic quick features with the AI research bar', async () => {
  const source = await readHero();

  assert.match(source, /import AIResearchBar from ['"]\.\/AIResearchBar['"]/);
  assert.match(source, /<AIResearchBar\s*\/>/);
  assert.doesNotMatch(source, /QUICK_FEATURES/);
});
