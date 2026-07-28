import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Guard ratchet: o namespace Tailwind legado `brand-*` (definido em
// tailwind.config.mjs) coexiste com o namespace canônico `anhanga-*`, cuja
// fonte de verdade são os tokens semânticos em lib/design-tokens.ts. Migração
// completa de `brand-*` → `anhanga-*` está fora de escopo deste guard — o
// objetivo aqui é apenas impedir que o uso do namespace legado CRESÇA.
// Ao migrar usos de brand-* para anhanga-*, ABAIXE o baseline abaixo para
// travar o ganho (nunca aumente sem justificativa documentada).
const LEGACY_BRAND =
  /(?<![\w-])(text|bg|border|fill|stroke|ring(?:-offset)?|placeholder|from|to|via|divide|decoration|outline|accent|caret|shadow)-brand-[a-z][a-zA-Z]*(?![\w-])/g;

// Espelha o `content` do tailwind.config.mjs — qualquer arquivo que o Tailwind
// processa pode introduzir uma utility brand-*, então o guard precisa varrer o
// mesmo escopo (dirs + extensões).
const SCAN_DIRS = ['components', 'pages', 'services', 'utils', 'data'];
const TARGET_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];
const ROOT = process.cwd();

function collectTailwindFiles(dir: string): string[] {
  const abs = path.resolve(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const full = path.join(abs, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectTailwindFiles(path.relative(ROOT, full)));
    } else if (entry.isFile() && TARGET_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
}

// O content do tailwind.config.mjs também inclui `./*.{js,ts,jsx,tsx}` —
// arquivos na raiz (ex: App.tsx, index.tsx, ssr.tsx). Varremos a raiz (não
// recursivo) para o guard cobrir todo o escopo que o Tailwind compila.
function collectRootFiles(): string[] {
  return fs
    .readdirSync(ROOT, { withFileTypes: true })
    .filter((entry) => entry.isFile() && TARGET_EXTENSIONS.some((ext) => entry.name.endsWith(ext)))
    .map((entry) => path.join(ROOT, entry.name));
}

// Baseline medido em 2026-07-05 (migração de components/about/* para
// anhanga-* nos fixes de /impeccable critique). Ao migrar usos de brand-*
// para anhanga-*, ABAIXE este número para travar o ganho.
// 2026-07-07: 594 → 592 (CookieConsentBanner migrado na auditoria LGPD).
// 2026-07-07: 592 → 587 (BackToTop migrado no follow-up de review da PR #1107).
// 2026-07-16: 587 → 562 (ContactModal.tsx migrado — P3 do critique de
// /consultoria-de-viagem, débito registrado na PR #1203; baseline reajustado
// para a contagem real após a migração, não apenas os 9 usos removidos aqui).
// 2026-07-16: 562 → 552 (LandingFAQ.tsx migrado na rodada 3 do critique de
// /consultoria-de-viagem — cluster do FAQ apontado pelo detector).
// 2026-07-27: 552 → 509 (MelhorIdadeLanding.tsx migrado no pivô de design
// da landing /melhor-idade).
const BRAND_NAMESPACE_BASELINE = 509;

test('legacy brand-* namespace does not grow (ratchet)', () => {
  const files = [...SCAN_DIRS.flatMap(collectTailwindFiles), ...collectRootFiles()];
  assert.ok(files.length > 0, 'Expected to scan at least one Tailwind file');
  const offenders: string[] = [];
  let total = 0;
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, i) => {
      for (const m of line.matchAll(LEGACY_BRAND)) {
        total += 1;
        offenders.push(`${path.relative(ROOT, file)}:${i + 1} → ${m[0]}`);
      }
    });
  }
  assert.ok(
    total <= BRAND_NAMESPACE_BASELINE,
    `Uso de brand-* (legado) cresceu para ${total} (baseline ${BRAND_NAMESPACE_BASELINE}).\n` +
    `Use o namespace canônico anhanga-* (ver lib/design-tokens.ts). Novos usos:\n${offenders.join('\n')}`,
  );
});
