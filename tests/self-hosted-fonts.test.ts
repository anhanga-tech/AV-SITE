import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { decompress } from 'wawoff2';

import { readSfntNames } from '../scripts/sfnt-rename.mjs';

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
// `Anhanga Serif` é o Merriweather subsetado e renomeado por exigência da OFL —
// ver scripts/sfnt-rename.mjs e docs/design/fonts-inventory.md.
const EXPECTED_FACES = [
  { family: 'Poppins', style: 'normal', weight: '400' },
  { family: 'Poppins', style: 'normal', weight: '600' },
  { family: 'Poppins', style: 'normal', weight: '700' },
  { family: 'Poppins', style: 'normal', weight: '900' },
  { family: 'Anhanga Serif', style: 'normal', weight: '400' },
  { family: 'Anhanga Serif', style: 'normal', weight: '700' },
  { family: 'Anhanga Serif', style: 'italic', weight: '400' },
];

// A cobertura de cada subconjunto é identificada pelo trecho de unicode-range que só
// ele tem: `latin` começa no bloco ASCII, `latin-ext` no Latin Extended-A.
const SUBSETS = {
  'latin-ext': 'U+0100-02BA',
  latin: 'U+0000-00FF',
};

const subsetOf = (face: FontFace) =>
  Object.entries(SUBSETS).find(([, marker]) => face.unicodeRange.startsWith(marker))?.[0];

test('src/fonts.css declara exatamente as faces que o site usa, uma por subconjunto', () => {
  for (const expected of EXPECTED_FACES) {
    const key = `${expected.family}/${expected.style}/${expected.weight}`;
    const matching = faces.filter(
      (face) =>
        face.family === expected.family &&
        face.style === expected.style &&
        face.weight === expected.weight,
    );

    // Contar faces não basta: duas declarações `latin` passariam no total e
    // deixariam o texto com acentuação estendida caindo na fonte de fallback.
    for (const [subset, marker] of Object.entries(SUBSETS)) {
      const forSubset = matching.filter((face) => subsetOf(face) === subset);
      assert.equal(forSubset.length, 1, `${key} deve ter exatamente uma @font-face ${subset}`);
      assert.ok(
        forSubset[0].file.endsWith(`-${subset}.woff2`),
        `${key}/${subset} deve apontar para o arquivo -${subset}.woff2, e não ${forSubset[0].file}`,
      );
      assert.ok(
        forSubset[0].unicodeRange.startsWith(marker),
        `${key}/${subset} deve declarar o unicode-range de ${subset}`,
      );
    }

    assert.equal(matching.length, Object.keys(SUBSETS).length, `${key} tem face sobrando`);
  }

  assert.equal(
    faces.length,
    EXPECTED_FACES.length * Object.keys(SUBSETS).length,
    'nenhuma face extra deve ser declarada — peso não usado é byte baixado à toa',
  );
});

test('latin-ext é declarado antes de latin, para o menor vencer na sobreposição', () => {
  // Os dois conjuntos compartilham U+0304, U+0308 e U+0329. O CSS resolve faces
  // equivalentes na ordem inversa da declaração, então `latin` precisa vir por
  // último para que essas combining marks não puxem o arquivo maior. Mesma ordem
  // que o Google Fonts emite.
  for (const expected of EXPECTED_FACES) {
    const indexes = faces
      .map((face, index) => ({ face, index }))
      .filter(
        ({ face }) =>
          face.family === expected.family &&
          face.style === expected.style &&
          face.weight === expected.weight,
      );

    const latinExt = indexes.find(({ face }) => subsetOf(face) === 'latin-ext');
    const latin = indexes.find(({ face }) => subsetOf(face) === 'latin');

    assert.ok(
      latinExt !== undefined && latin !== undefined && latinExt.index < latin.index,
      `${expected.family}/${expected.style}/${expected.weight}: latin-ext deve vir antes de latin`,
    );
  }
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
  const budgets = { Poppins: 34 * 1024, 'Anhanga Serif': 50 * 1024 };

  for (const [family, budget] of Object.entries(budgets)) {
    const bytes = faces
      .filter((face) => face.family === family && face.unicodeRange.startsWith('U+0000-00FF'))
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

// A OFL proíbe uma Modified Version de usar o Reserved Font Name da original como
// nome primário (cláusula 3). Subsetar é modificar (OFL-FAQ 2.6), e estes arquivos
// ainda instanciam os eixos e removem `kern` — longe da Functional Equivalence que a
// FAQ 2.7/2.8 exigiria para manter o nome. Só o Merriweather declara RFN; o Poppins
// não, e por isso mantém o dele.
const RESERVED_FONT_NAMES = ['Merriweather'];
// Família (1), identificador único (3), nome completo (4) e nome PostScript (6) —
// os campos que a licença chama de "primary font name as presented to the users".
const PRIMARY_NAME_IDS = [1, 3, 4, 6];

test('nenhum WOFF2 gerado carrega um Reserved Font Name como nome primário', async () => {
  const files = fs.readdirSync(fontsDir).filter((name) => name.endsWith('.woff2'));

  for (const file of files) {
    const sfnt = Buffer.from(await decompress(fs.readFileSync(path.join(fontsDir, file))));
    const names = readSfntNames(sfnt);

    for (const nameId of PRIMARY_NAME_IDS) {
      const value = names[nameId];
      if (value === undefined) continue;
      for (const reserved of RESERVED_FONT_NAMES) {
        assert.ok(
          !value.includes(reserved),
          `${file}: nameId ${nameId} ("${value}") usa o Reserved Font Name "${reserved}"`,
        );
      }
    }
  }
});

test('os WOFF2 gerados preservam copyright e licença da fonte original', async () => {
  // OFL-FAQ 2.8: metadados de autoria e licença devem sobreviver à otimização.
  const files = fs.readdirSync(fontsDir).filter((name) => name.endsWith('.woff2'));

  for (const file of files) {
    const sfnt = Buffer.from(await decompress(fs.readFileSync(path.join(fontsDir, file))));
    const names = readSfntNames(sfnt);

    assert.match(names[0] ?? '', /Copyright/i, `${file} deve manter o aviso de copyright (nameId 0)`);
    assert.match(
      names[13] ?? '',
      /SIL Open Font License/i,
      `${file} deve manter o texto de licença (nameId 13)`,
    );
  }
});

test('a família serifada renomeada declara sua origem nos metadados', async () => {
  // Renomear não pode apagar a procedência: a FAQ pede que referências à original
  // continuem disponíveis em campos que não sejam o nome primário.
  const sfnt = Buffer.from(
    await decompress(fs.readFileSync(path.join(fontsDir, 'merriweather-400-latin.woff2'))),
  );
  const names = readSfntNames(sfnt);

  assert.equal(names[1], 'Anhanga Serif');
  assert.match(names[10] ?? '', /Merriweather/, 'a descrição (nameId 10) deve citar a fonte original');
});
