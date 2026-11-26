import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { optimizeImageUrl } from '../lib/media-url';

// As fotos inline do post são <img> JSX dentro de <figure>, que o MDX não passa
// pelo `img` de mdxComponents. Sem o /cdn-cgi/image o navegador baixava o JPEG
// cru (523 KB e 315 KB). A URL tem de ser a mesma que o preset inline-lg gera.
const FOTOS = [
  'carnaval-2027-galo-da-madrugada-recife.jpg',
  'carnaval-2027-frevo-olinda.jpg',
];

test('fotos inline do carnaval 2027 passam pelo Image Transformations com format=auto', async () => {
  const mdx = await readFile(new URL('../content/blog/carnaval-2027-data.mdx', import.meta.url), 'utf8');
  for (const foto of FOTOS) {
    const esperado = optimizeImageUrl(`https://media.anhanga.tur.br/images/blog/${foto}`, {
      mediaBaseUrl: 'https://media.anhanga.tur.br',
      transformZoneUrl: 'https://media.anhanga.tur.br',
      enableTransforms: true,
      width: 1200,
    });
    assert.match(esperado, /\/cdn-cgi\/image\/format=auto,/);
    assert.ok(mdx.includes(`src="${esperado}"`), `${foto} deve usar ${esperado}`);
    assert.ok(!mdx.includes(`src="https://media.anhanga.tur.br/images/blog/${foto}"`), `${foto} não pode ficar com a URL crua`);
  }
});
