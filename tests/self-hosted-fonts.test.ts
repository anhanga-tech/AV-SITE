import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const fontsCssPath = path.join(root, 'src', 'fonts.css');
const fontsCss = fs.readFileSync(fontsCssPath, 'utf8');
const fontsDir = path.join(root, 'src', 'fonts');
const indexCss = fs.readFileSync(path.join(root, 'src', 'index.css'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

interface FontFace {
  family: string;
  style: string;
  weight: string;
  display: string;
  file: string;
  unicodeRange: string;
}

function parseFontFaces(css: string): FontFace[] {
  return [...css.matchAll(/@font-face\s*\{([\s\S]*?)\}/g)].map(([, body]) => {
    const value = (property: string) =>
      body.match(new RegExp(`${property}:\\s*([^;]+);`))?.[1].trim() ?? '';
    return {
      family: value('font-family').replace(/'/g, ''),
      style: value('font-style'),
      weight: value('font-weight'),
      display: value('font-display'),
      file: body.match(/url\('([^']+)'\)/)?.[1] ?? '',
      unicodeRange: value('unicode-range'),
    };
  });
}

const faces = parseFontFaces(fontsCss);

// Os pesos que o código realmente usa: `font-sans`/`font-display` (Poppins) cobrem
// body 400, semibold 600, bold 700 e as headings 800/900 — que o CSS resolve para
// 900. `font-serif` (Merriweather) cobre o corpo editorial do blog, o <strong> em
// 700 dentro do MDX e o itálico das citações/depoimentos.
const EXPECTED_FACES = [
  { family: 'Poppins', style: 'normal', weight: '400' },
  { family: 'Poppins', style: 'normal', weight: '600' },
  { family: 'Poppins', style: 'normal', weight: '700' },
  { family: 'Poppins', style: 'normal', weight: '900' },
  { family: 'Merriweather', style: 'normal', weight: '400' },
  { family: 'Merriweather', style: 'normal', weight: '700' },
  { family: 'Merriweather', style: 'italic', weight: '400' },
];

const SUBSETS = ['latin', 'latin-ext'];

test('src/fonts.css declara exatamente as faces que o site usa, em latin e latin-ext', () => {
  const declared = faces.map((face) => `${face.family}/${face.style}/${face.weight}`);

  for (const expected of EXPECTED_FACES) {
    const key = `${expected.family}/${expected.style}/${expected.weight}`;
    assert.equal(
      declared.filter((entry) => entry === key).length,
      SUBSETS.length,
      `${key} deve ter uma @font-face por subconjunto (${SUBSETS.join(', ')})`,
    );
  }

  assert.equal(
    faces.length,
    EXPECTED_FACES.length * SUBSETS.length,
    'nenhuma face extra deve ser declarada — peso não usado é byte baixado à toa',
  );
});

test('toda @font-face aponta para um arquivo versionado e usa font-display: swap', () => {
  for (const face of faces) {
    assert.equal(face.display, 'swap', `${face.file} deve usar font-display: swap`);
    assert.match(face.file, /^\.\/fonts\/[a-z0-9-]+\.woff2$/, 'src deve ser um woff2 local');
    assert.ok(
      fs.existsSync(path.join(root, 'src', face.file.replace('./', ''))),
      `${face.file} não existe em src/fonts/`,
    );
    assert.ok(face.unicodeRange.startsWith('U+'), `${face.file} deve declarar unicode-range`);
  }
});

test('não há woff2 órfão em src/fonts/', () => {
  const referenced = new Set(faces.map((face) => path.basename(face.file)));
  const onDisk = fs.readdirSync(fontsDir).filter((name) => name.endsWith('.woff2'));

  for (const name of onDisk) {
    assert.ok(referenced.has(name), `${name} não é referenciado por src/fonts.css`);
  }
  assert.equal(onDisk.length, referenced.size);
});

test('as licenças OFL das duas famílias acompanham os arquivos', () => {
  for (const license of ['OFL-Merriweather.txt', 'OFL-Poppins.txt']) {
    assert.ok(fs.existsSync(path.join(fontsDir, license)), `${license} deve estar versionada`);
  }
});

// Orçamento da issue #1603. Os números vêm da medição de 09/09/2026 documentada em
// docs/design/fonts-inventory.md — antes, o Google Fonts servia 30,6 KiB de Poppins
// e 145,8 KiB de Merriweather no artigo do blog. O teto abaixo dá folga para
// regerar os arquivos sem travar o build, mas quebra se alguém reintroduzir a
// tabela `kern` do Merriweather (~30 KiB por face) ou um peso novo sem pensar.
test('o subconjunto latin cabe no orçamento de bytes por família', () => {
  const budgets = { Poppins: 34 * 1024, Merriweather: 50 * 1024 };

  for (const [family, budget] of Object.entries(budgets)) {
    const bytes = faces
      .filter((face) => face.family === family && face.unicodeRange.includes('U+0000-00FF'))
      .reduce(
        (sum, face) => sum + fs.statSync(path.join(root, 'src', face.file.replace('./', ''))).size,
        0,
      );

    assert.ok(bytes > 0, `${family} deve ter faces latin`);
    assert.ok(
      bytes <= budget,
      `${family} latin soma ${(bytes / 1024).toFixed(1)} KiB, acima do orçamento de ${budget / 1024} KiB`,
    );
  }
});

test('o bundle carrega as fontes e o index.html não fala com o Google Fonts', () => {
  assert.match(indexCss, /@import\s+"\.\/fonts\.css";/, 'src/index.css deve importar fonts.css');

  // Auto-hospedar só rende se o caminho crítico deixar de abrir conexão com terceiro:
  // o CSS de fonts.googleapis.com era uma request extra em duas origens novas.
  assert.doesNotMatch(indexHtml, /fonts\.googleapis\.com/, 'index.html não deve carregar CSS de fonte de terceiro');
  assert.doesNotMatch(indexHtml, /fonts\.gstatic\.com/, 'index.html não deve mais fazer preconnect ao gstatic');
});
