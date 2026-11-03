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

test('stack sans (texto corrido) passa pelos fallbacks de Arial e de Android antes do sans-serif genérico', () => {
  // A Arial vem antes: um desktop com Roboto instalada fica na face medida contra a Arial (#1982).
  assert.deepEqual(families.sans, ['Poppins', 'Poppins Fallback', 'Poppins Fallback Android', 'sans-serif']);
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

const familyOf = (face: string) => face.match(/font-family:\s*'([^']+)'/)?.[1];
const weightOf = (face: string) => Number(face.match(/font-weight:\s*(\d+)/)?.[1]);
const srcOf = (face: string) => face.match(/src:\s*([^;]+);/)?.[1] ?? '';
const facesOf = (family: string) => faces.filter((face) => familyOf(face) === family);

test('só as duas famílias de fallback, cada uma com uma face por peso da Poppins', () => {
  assert.deepEqual([...new Set(faces.map(familyOf))], ['Poppins Fallback', 'Poppins Fallback Android']);
  for (const family of ['Poppins Fallback', 'Poppins Fallback Android']) {
    assert.deepEqual(facesOf(family).map(weightOf), [400, 600, 700, 900], family);
  }
});

test('toda face de fallback usa só local() e traz as quatro métricas ajustadas', () => {
  for (const face of faces) {
    assert.doesNotMatch(face, /url\(/, 'fallback não pode baixar arquivo');
    assert.match(srcOf(face), /^local\('[^']+'\)(,\s*local\('[^']+'\))*$/);
    for (const descriptor of ['size-adjust', 'ascent-override', 'descent-override', 'line-gap-override']) {
      assert.match(face, new RegExp(`${descriptor}:\\s*\\d+(\\.\\d+)?%`), descriptor);
    }
  }
});

test('Poppins Fallback: Arial, com Arial Bold nos pesos ≥ 600 em vez de negrito sintético', () => {
  for (const face of facesOf('Poppins Fallback')) {
    const src = srcOf(face);
    assert.match(src, /local\('Arial[^']*'\)/);
    if (weightOf(face) >= 600) assert.match(src, /local\('Arial Bold'\)/, String(weightOf(face)));
    else assert.doesNotMatch(src, /Bold/, String(weightOf(face)));
  }
});

test('Poppins Fallback Android: Roboto, com Bold em 600/700 e Black em 900 (#1982)', () => {
  const expected: Record<number, RegExp> = {
    400: /^local\('Roboto'\), local\('Roboto Regular'\), local\('Roboto-Regular'\)$/,
    600: /^local\('Roboto Bold'\), local\('Roboto-Bold'\)$/,
    700: /^local\('Roboto Bold'\), local\('Roboto-Bold'\)$/,
    900: /^local\('Roboto Black'\), local\('Roboto-Black'\)$/,
  };
  for (const face of facesOf('Poppins Fallback Android')) {
    assert.match(srcOf(face), expected[weightOf(face)], String(weightOf(face)));
  }
});
