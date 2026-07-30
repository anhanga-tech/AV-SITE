import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { selectImagePreset } from '../lib/media-url.ts';

/*
  Guards da issue #1326 — dimensionamento das imagens da /orlando.

  Ficam em node:test e não em Playwright de propósito: a decisão de preset é
  lógica pura, e um e2e dela dependeria de `VITE_MEDIA_ENABLE_TRANSFORMS`, que
  está desligado no dev server que o Playwright levanta. Um teste que só roda
  com transforms ligados ficaria permanentemente `skipped` no CI — verde sem
  verificar nada.

  Os testes de logo (PNG via optimizeRemoteImageUrl, fallback de transform
  quebrado, SVG cru) foram removidos na issue #1330: os logotipos de
  Disney/Universal saíram da página (implicação de marca registrada sem
  autorização de uso) e deram lugar a nome do parque em texto.
*/

const GALLERY_SOURCE = 'components/landings/orlando/OrlandoParksGallery.tsx';

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

test('a galeria não reintroduz srcSet, que neste repo é markup morto', async () => {
    const source = await argumentosDaGaleria();

    // selectImagePreset normaliza qualquer largura para um conjunto fixo de
    // presets, então todo candidato de um srcSet colapsaria na MESMA URL. Se
    // alguém adicionar srcSet aqui achando que economiza bytes, este teste
    // explica por que não economiza.
    assert.ok(
        !/srcSet=/.test(source),
        'srcSet na galeria da /orlando gera candidatos idênticos — ver o comentário no topo do arquivo',
    );
});

test('cada parque tem o nome em texto visível, não só como alt de logo', async () => {
    const source = await argumentosDaGaleria();

    assert.match(
        source,
        /<h3>\{name\}<\/h3>/,
        'o nome do parque precisa aparecer como <h3> visível — issue #1330',
    );
});
