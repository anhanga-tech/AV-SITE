import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Regressão: os links do menu mobile do Navbar de /lollapalooza usavam
// `focus:outline-none` sem nenhum indicador de foco visível (só um
// `focus:text-anhanga-yellow`, texto amarelo sobre fundo branco tem contraste
// insuficiente — ~1.41:1 — para servir de indicador de foco confiável). Os
// demais links do mesmo arquivo (desktop + CTAs) já usam `focus:ring-*` com
// cor de contraste suficiente — este teste trava o mesmo padrão para os
// links do menu mobile, exigindo um `focus:ring-N` de largura não-zero
// sempre que `focus:outline-none` estiver presente.
const NAVBAR_PATH = path.resolve(process.cwd(), 'components/landings/lollapalooza/Navbar.tsx');

test('Lollapalooza Navbar mobile links keep a visible focus ring', () => {
  const source = fs.readFileSync(NAVBAR_PATH, 'utf8');
  const mobileMenuMatch = source.match(/Mobile Menu \*\/}[\s\S]*?<\/div>\s*\)\s*}\s*<\/nav>/);
  assert.ok(mobileMenuMatch, 'Expected to find the mobile menu block in Navbar.tsx');

  const mobileMenuBlock = mobileMenuMatch[0];
  const linkClassNames = [...mobileMenuBlock.matchAll(/className="([^"]*)"/g)].map((m) => m[1]);
  assert.ok(linkClassNames.length > 0, 'Expected at least one className in the mobile menu block');

  for (const className of linkClassNames) {
    if (!className.includes('focus:outline-none')) continue;
    assert.match(
      className,
      /\bfocus:ring-[1-9]\d*\b/,
      `Mobile menu element removes the default outline without a focus:ring fallback: "${className}"`,
    );
  }
});
