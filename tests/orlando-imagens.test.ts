import './helpers/dom-setup.ts';

import React from 'react';
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { render, cleanup, fireEvent } from '@testing-library/react';

import { selectImagePreset } from '../lib/media-url.ts';
import { OrlandoParksGallery } from '../components/landings/orlando/OrlandoParksGallery.tsx';
import { ALL_PARK_NAMES } from '../components/landings/orlando/orlandoParksData.ts';

/*
  Guards da issue #1326 — dimensionamento das imagens da /orlando.

  Os testes de "o que renderiza" (srcSet morto, nome do parque visível) usam
  o terceiro nível de teste (happy-dom + @testing-library/react, ver
  docs/standards/dom-testing-tier-decision.md): montam OrlandoParksGallery de
  verdade e checam o DOM real, em vez de regex sobre o texto-fonte do
  componente — cobre exatamente o que muda quando alguém reintroduz um
  `srcSet` ou troca `<h3>{name}</h3>` por um `alt` de imagem.

  O teste de preset (abaixo) continua em regex de propósito: a decisão que ele
  prova é sobre o ARGUMENTO passado para `optimizeRemoteImageUrl` na chamada
  — não sobre nada que apareça no DOM. Com
  `VITE_MEDIA_ENABLE_TRANSFORMS` desligado (o padrão neste processo de teste,
  fora do Vite), a URL renderizada é idêntica não importa qual preset a
  chamada resolveria, então nem DOM real nem browser (Playwright) enxergam
  essa diferença — só o texto-fonte prova o argumento. Mockar o módulo
  (`node:test`'s `mock.module`) resolveria isso sem regex, mas exige a flag
  `--experimental-test-module-mocks` no `test:regression` inteiro para um
  único teste — fora de escopo desta avaliação (ver decisão, seção
  "Limites").

  Os testes de logo (PNG via optimizeRemoteImageUrl, fallback de transform
  quebrado, SVG cru) foram removidos na issue #1330: os logotipos de
  Disney/Universal saíram da página (implicação de marca registrada sem
  autorização de uso) e deram lugar a nome do parque em texto.
*/

const GALLERY_SOURCE = 'components/landings/orlando/OrlandoParksGallery.tsx';

afterEach(cleanup);

/**
 * Lê o argumento de largura que a galeria passa para uma chamada específica.
 * Testar `selectImagePreset` isolado não trava nada: ele passa com qualquer
 * coisa que o componente faça. O que precisa ficar travado é o ARGUMENTO.
 */
async function argumentosDaGaleria(): Promise<string> {
  return readFile(new URL(`../${GALLERY_SOURCE}`, import.meta.url), 'utf8');
}

test('a foto do parque é pedida sem height, caindo num preset abaixo de 1200', async () => {
  const source = await argumentosDaGaleria();

  const chamada = source.match(/src=\{optimizeRemoteImageUrl\(image,\s*([^)]*)\)\}/);
  assert.ok(chamada, 'a foto do parque precisa vir de optimizeRemoteImageUrl(image, ...)');

  const args = chamada[1].split(',').map((a) => a.trim()).filter(Boolean);
  assert.equal(
    args.length,
    1,
    `passar height reativa o fallback de 1200x675: selectImagePreset(600, 400) -> ${selectImagePreset(600, 400).width}px`,
  );

  const preset = selectImagePreset(Number(args[0]));
  assert.equal(preset.width, 800, 'a largura pedida deve cair no preset de 800');
  assert.equal(preset.fit, 'scale-down');
});

test('a galeria não reintroduz srcSet, que neste repo é markup morto', () => {
  const { container } = render(React.createElement(OrlandoParksGallery));

  // selectImagePreset normaliza qualquer largura para um conjunto fixo de
  // presets, então todo candidato de um srcSet colapsaria na MESMA URL. Se
  // alguém adicionar srcSet aqui achando que economiza bytes, este teste
  // explica por que não economiza (ver comentário no topo do arquivo).
  // `[srcset]` (não só `img`) cobre o padrão <picture><source srcSet=...>
  // também — o mesmo markup morto reaparece se alguém migrar pra <picture>.
  const images = container.querySelectorAll('img');
  assert.ok(images.length > 0, 'a galeria deve renderizar ao menos uma foto de parque');
  const withSrcset = container.querySelectorAll('[srcset]');
  assert.equal(withSrcset.length, 0, 'nenhum elemento (img ou <source>) deveria ter srcSet');
});

test('cada parque tem o nome em texto visível, não só como alt de logo', () => {
  const { container, getByRole } = render(React.createElement(OrlandoParksGallery));

  // Os cards dos grupos recolhidos já estão no DOM mesmo antes do clique — o
  // toggle "ver todos" só troca classe/aria-hidden via CSS, não desmonta nada
  // (ver comentário de OTHER_PARK_GROUPS no componente), e happy-dom não
  // aplica CSS nem filtra `aria-hidden` em `querySelectorAll`. O clique não é
  // o que garante a cobertura dos parques recolhidos hoje; serve pra travar
  // essa premissa — se uma versão futura passar a renderizar os grupos só
  // condicionalmente a `showAll`, este clique passa a ser necessário e sua
  // ausência quebraria o teste de forma óbvia, não silenciosa.
  fireEvent.click(getByRole('button', { name: /ver todos os \d+ parques/i }));

  const cards = container.querySelectorAll('.park-card');
  assert.ok(cards.length > 1, 'a galeria deve renderizar múltiplos parques');

  // Checar TODO card contra o nome real, não só presença de texto: um <h3>
  // genérico ("Conheça o parque") passaria num check de "não vazio" mas
  // ainda seria a regressão da issue #1330 (nome só como alt de imagem).
  // ALL_PARK_NAMES vem do próprio componente — nenhuma lista duplicada aqui
  // para dessincronizar quando um parque for adicionado/renomeado.
  const headingNames = Array.from(cards).map((card) => card.querySelector('h3')?.textContent?.trim());
  assert.deepEqual(
    [...headingNames].sort(),
    [...ALL_PARK_NAMES].sort(),
    'cada park-card precisa exibir o nome real do parque em <h3> — issue #1330',
  );
});

/*
  Guard da issue #1602 — peso da textura de fundo.

  O `felt.png` cru pesa 131.898 bytes e é o recurso mais pesado da /orlando
  depois dos cartões. Servido pelo resizer da própria zona de mídia ele sai em
  AVIF a 24.903 bytes. Duas armadilhas ficam travadas aqui porque nenhuma delas
  aparece na tela — as duas só se manifestam no peso baixado:

  1. `width` precisa ser MENOR que os 500px nativos: em 500 o resizer conclui
     que não há o que reduzir e devolve o PNG original para quem não aceita
     AVIF (verificado contra a zona de produção).
  2. `background-size` precisa devolver o ladrilho ao passo nativo, senão o
     grão encolhe 20% junto com a imagem — mudança visual não pedida.
*/
test('a textura de fundo é servida pelo resizer, com o ladrilho no passo nativo', async () => {
  const css = await readFile(new URL('../pages/landings/orlando.css', import.meta.url), 'utf8');

  const transform = css.match(
    /https:\/\/media\.anhanga\.tur\.br\/cdn-cgi\/image\/([^/]+)\/images\/textures\/felt\.png/,
  );
  assert.ok(transform, 'a textura precisa passar pelo /cdn-cgi/image da zona de mídia');

  const options = transform[1];
  assert.match(options, /format=auto/, 'format=auto é o que negocia AVIF/WebP pelo Accept');

  const width = options.match(/width=(\d+)/);
  assert.ok(width, 'a transformação precisa declarar uma largura');
  assert.ok(
    Number(width[1]) < 500,
    `width=${width?.[1]} não reduz nada: o original tem 500px e o resizer devolveria o PNG cru`,
  );

  assert.match(
    css,
    /background-size:\s*auto,\s*500px 466px/,
    'sem background-size o ladrilho encolhe junto com a imagem',
  );
});

/*
  Guard da issue #1602 — peso dos três cartões do hero.

  Eles pediam o preset quadrado de 640px para renderizar no máximo 356px de
  largura (mobile, 90% de um cartão de 380px). O degrau de 512px ainda cobre
  esses 356 CSS px a DPR 1,75. Como no teste de preset acima, o que precisa
  ficar travado é o ARGUMENTO: a URL renderizada é idêntica neste processo.
*/
test('os cartões do hero pedem o degrau de 512px e a qualidade de decoração', async () => {
  const source = await readFile(
    new URL('../components/landings/orlando/OrlandoHero.tsx', import.meta.url),
    'utf8',
  );

  const constante = source.match(/const CARD_QUALITY = (\d+);/);
  assert.ok(constante, 'os cartões precisam declarar sua própria qualidade');
  assert.ok(
    Number(constante[1]) < 85,
    `CARD_QUALITY=${constante?.[1]} não reduz nada: 85 já é o padrão compartilhado`,
  );

  const chamadas = [...source.matchAll(/optimizeRemoteImageUrl\(\s*"images\/orlando\/cards\/[^"]+",\s*(\d+),\s*(\d+),[^)]*\)/g)];
  assert.equal(chamadas.length, 3, 'a colagem do hero tem três cartões');

  for (const [chamada, largura, altura] of chamadas) {
    const preset = selectImagePreset(Number(largura), Number(altura));
    assert.equal(preset.width, 512, `o cartão caiu no preset de ${preset.width}px, não no de 512`);
    assert.match(chamada, /CARD_QUALITY/, `cartão sem a qualidade reduzida: ${chamada}`);
  }
});
