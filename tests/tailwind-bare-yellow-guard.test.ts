import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Guard contra issue #877: as utilities Tailwind "bare" `*-yellow` (sem sufixo
// numérico) não têm token correspondente neste projeto — `theme.extend.colors`
// só define `brand.yellow` e `anhanga.yellow`, nunca um `yellow` top-level. Logo
// `text-yellow` / `bg-yellow` / `border-yellow` renderizam como no-op.
// Use os tokens que resolvem (`*-brand-yellow`, `*-anhanga-yellow`) ou a escala
// numérica padrão do Tailwind (`*-yellow-500`).
//
// NÃO confundir com a escala numérica `*-yellow-NNN`, que resolve normalmente:
// o lookahead `(?![\w-])` garante que só pegamos a forma bare. A lista de
// prefixos cobre toda utility de cor do Tailwind que aceita um valor de cor.
const BARE_YELLOW =
  /(?<![\w-])(text|bg|border|fill|stroke|ring|from|to|via|divide|decoration|outline|accent|caret|shadow)-yellow(?![\w-])/g;

// Espelha o `content` do tailwind.config.mjs — qualquer arquivo que o Tailwind
// processa pode introduzir uma utility bare, então o guard precisa varrer o
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

test('no bare *-yellow Tailwind utilities (they resolve to no-op)', () => {
  const files = SCAN_DIRS.flatMap(collectTailwindFiles);
  assert.ok(files.length > 0, 'Expected to scan at least one Tailwind file');

  const offenders: string[] = [];
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const match of line.matchAll(BARE_YELLOW)) {
        offenders.push(`${path.relative(ROOT, file)}:${index + 1} → ${match[0]}`);
      }
    });
  }

  assert.deepEqual(
    offenders,
    [],
    `Bare *-yellow utilities não resolvem (issue #877). Troque por *-brand-yellow ou a escala numérica:\n${offenders.join('\n')}`,
  );
});
