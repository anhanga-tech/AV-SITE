import './helpers/dom-setup.ts';

import React from 'react';
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { render, cleanup } from '@testing-library/react';

import { selectImagePreset } from '../lib/media-url.ts';
import { OrlandoParksGallery } from '../components/landings/orlando/OrlandoParksGallery.tsx';

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
  const images = container.querySelectorAll('img');
  assert.ok(images.length > 0, 'a galeria deve renderizar ao menos uma foto de parque');
  for (const img of images) {
    assert.ok(!img.hasAttribute('srcset'), `${img.getAttribute('alt')} não deveria ter srcSet`);
  }
});

test('cada parque tem o nome em texto visível, não só como alt de logo', () => {
  const { container } = render(React.createElement(OrlandoParksGallery));

  const headingNames = Array.from(container.querySelectorAll('h3')).map((el) => el.textContent);
  assert.ok(
    headingNames.includes('Magic Kingdom'),
    'o nome do parque precisa aparecer como <h3> visível — issue #1330',
  );
  assert.ok(headingNames.length > 0, 'a galeria deve ter ao menos um <h3> de parque');
});
