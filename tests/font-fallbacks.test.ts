import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import tailwindConfig from '../tailwind.config.mjs';

/*
  #1972 — sem fallback com métricas, o texto renderizava no sans-serif do sistema
  (mais estreito que a Poppins) até o swap e ganhava uma linha quando a Poppins
  chegava: o subtítulo do hero crescia 32px e empurrava o resto da home.
  O CSS é gerado por scripts/build-font-fallbacks.mjs; aqui fica o contrato.
*/

const root = process.cwd();
const css = fs.readFileSync(path.join(root, 'src/font-fallbacks.css'), 'utf8');
const faces = [...css.matchAll(/@font-face\s*\{([\s\S]*?)\}/g)].map(([, body]) => body);

const families = (tailwindConfig as { theme: { extend: { fontFamily: Record<string, string[]> } } }).theme.extend.fontFamily;

test('stack sans (texto corrido) passa pelo Poppins Fallback antes do sans-serif genérico', () => {
  assert.deepEqual(families.sans, ['Poppins', 'Poppins Fallback', 'sans-serif']);
});

test('stack display fica sem o fallback ajustado (caixa alta não segue a razão do texto corrido)', () => {
  // Em caixa alta a Poppins Black é mais estreita que a Arial Bold: com o size-adjust do
  // texto corrido, o "É SURREAL." da /orlando/ ficava 18% mais largo e estourava 320px.
  assert.deepEqual(families.display, ['Poppins', 'sans-serif']);
});

test('index.css importa os fallbacks junto com as faces da Poppins', () => {
  const index = fs.readFileSync(path.join(root, 'src/index.css'), 'utf8');

  assert.ok(index.indexOf('@import "./font-fallbacks.css"') > index.indexOf('@import "./fonts.css"'));
});

test('uma face de fallback por peso da Poppins, só local() e com métricas ajustadas', () => {
  const weights = faces.map((face) => face.match(/font-weight:\s*(\d+)/)?.[1]);
  assert.deepEqual(weights, ['400', '600', '700', '900']);

  for (const face of faces) {
    assert.match(face, /font-family:\s*'Poppins Fallback'/);
    assert.doesNotMatch(face, /url\(/, 'fallback não pode baixar arquivo');
    assert.match(face, /src:\s*local\('Arial[^']*'\)/);
    for (const descriptor of ['size-adjust', 'ascent-override', 'descent-override', 'line-gap-override']) {
      assert.match(face, new RegExp(`${descriptor}:\\s*\\d+(\\.\\d+)?%`), descriptor);
    }
  }
});

test('pesos ≥ 600 usam a Arial Bold, não negrito sintético da Regular', () => {
  for (const face of faces) {
    const weight = Number(face.match(/font-weight:\s*(\d+)/)?.[1]);
    const src = face.match(/src:\s*([^;]+);/)?.[1] ?? '';
    if (weight >= 600) assert.match(src, /local\('Arial Bold'\)/, String(weight));
    else assert.doesNotMatch(src, /Bold/, String(weight));
  }
});
