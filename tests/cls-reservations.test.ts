import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

/*
  Auditoria 01/11/2026 (#1969) — CLS mobile medido com fontes atrasadas (Playwright,
  375px): o swap de fonte mudava a altura de dois elementos.
  1. /orlando/: a 420px ou menos a .nav-links cabia numa linha com a fonte de fallback
     e quebrava em duas com a Space Mono, empurrando o hero 44px (~0,12 de CLS).
  2. Banner de cookies: o parágrafo ganhava uma linha com a Poppins entre 390 e 640px.
  As reservas abaixo são o contrato; mudar a copy do banner exige rever a de 4 linhas.
*/

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

test('/orlando/ reserva as duas linhas da nav no mobile estreito', () => {
  const css = read('pages/landings/orlando.css');
  const narrow = css.match(/@media \(max-width: 420px\)\s*\{([\s\S]*?)\n\}/);

  assert.ok(narrow, 'media query de 420px não encontrada');
  const navRule = narrow[1].match(/\.landing-orlando \.nav-links\s*\{([^}]*)\}/);
  assert.ok(navRule, '.nav-links não encontrada no media query de 420px');
  assert.match(navRule[1], /min-height:\s*88px/);
});

test('parágrafo do banner de cookies reserva as linhas do mobile (5 abaixo de 360px, 4 até o sm)', () => {
  const source = read('components/CookieConsentBanner.tsx');

  // 5 linhas abaixo de 360px: ali o Poppins Fallback (#1972) quebra numa linha a mais.
  assert.match(source, /<p className="min-h-\[5lh\] min-\[360px\]:min-h-\[4lh\] sm:min-h-0 /);
});
