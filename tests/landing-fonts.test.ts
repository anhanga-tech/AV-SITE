import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { decompress } from 'wawoff2';
import { readSfntNames } from '../scripts/sfnt-rename.mjs';

const root = process.cwd();
const fontsDir = path.join(root, 'src/fonts/landings');

test('pages e components não abrem conexões com Google Fonts', () => {
  for (const directory of ['pages', 'components']) {
    for (const file of fs.readdirSync(path.join(root, directory), { recursive: true })) {
      if (!/\.(tsx?|jsx?|css)$/.test(String(file))) continue;
      const source = fs.readFileSync(path.join(root, directory, String(file)), 'utf8');
      assert.doesNotMatch(source, /fonts\.(googleapis|gstatic)\.com/, `${directory}/${file}`);
    }
  }
});

test('as faces de landing têm arquivos locais, subsets, swap e licenças', async () => {
  const referenced = new Set<string>();
  for (const [family, stem, weights, license] of [
    ['Outfit', 'outfit', ['300 900'], 'OFL-Outfit.txt'],
    ['Space Mono', 'space-mono', ['400', '700'], 'OFL-SpaceMono.txt'],
  ] as const) {
    const css = fs.readFileSync(path.join(root, `src/fonts/${stem}.css`), 'utf8');
    const blocks = [...css.matchAll(/@font-face\s*\{([\s\S]*?)\}/g)].map((match) => match[1]);
    assert.equal(blocks.length, weights.length * 2);
    for (const weight of weights) {
      for (const subset of ['latin-ext', 'latin']) {
        const file = `${stem}-${weight.replace(' ', '-')}-${subset}.woff2`;
        const face = blocks.find((block) => block.includes(`/${file}'`));
        assert.ok(face, `${file} deve ser declarado`);
        assert.ok(face.includes(`font-family: '${family}';`));
        assert.ok(face.includes(`font-weight: ${weight};`));
        assert.match(face, /font-display:\s*swap;/);
        assert.match(face, subset === 'latin' ? /unicode-range:\s*U\+0000-00FF/ : /unicode-range:\s*U\+0100-02BA/);
        assert.ok(css.indexOf(`${stem}-${weight.replace(' ', '-')}-latin-ext.woff2`) < css.indexOf(`${stem}-${weight.replace(' ', '-')}-latin.woff2`));
        referenced.add(file);
        const sfnt = Buffer.from(await decompress(fs.readFileSync(path.join(fontsDir, file))));
        const names = readSfntNames(sfnt);
        // Outfit upstream usa o nome legado "Outfit Thin" no nameId 1;
        // o nome da face web vem do @font-face e o peso do eixo variável.
        assert.ok(names[1]?.startsWith(family), `${file}: família original preservada`);
        assert.match(names[0] ?? '', /Copyright/i);
        assert.match(names[13] ?? '', /SIL Open Font License/i);
      }
    }
    const ofl = fs.readFileSync(path.join(fontsDir, license), 'utf8');
    assert.match(ofl, /SIL OPEN FONT LICENSE/);
    // RFNs na definição genérica da licença não contam: só o cabeçalho declara um.
    assert.doesNotMatch(ofl.split('SIL OPEN FONT LICENSE')[0], /Reserved Font Name/i);
  }
  assert.deepEqual(fs.readdirSync(fontsDir).filter((file) => file.endsWith('.woff2')).sort(), [...referenced].sort());
});
