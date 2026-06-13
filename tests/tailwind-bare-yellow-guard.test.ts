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
// o lookahead `(?![\w-])` garante que só pegamos a forma bare.
const BARE_YELLOW = /(?<![\w-])(text|bg|border|fill|ring|from|to|via|divide)-yellow(?![\w-])/g;

const SCAN_DIRS = ['components', 'pages'];
const ROOT = process.cwd();

function collectTsxFiles(dir: string): string[] {
  const abs = path.resolve(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const full = path.join(abs, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectTsxFiles(path.relative(ROOT, full)));
    } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
      out.push(full);
    }
  }
  return out;
}

test('no bare *-yellow Tailwind utilities (they resolve to no-op)', () => {
  const files = SCAN_DIRS.flatMap(collectTsxFiles);
  assert.ok(files.length > 0, 'Expected to scan at least one .tsx file');

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
