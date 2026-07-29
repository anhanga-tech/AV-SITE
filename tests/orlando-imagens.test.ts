import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { optimizeImageUrl, selectImagePreset } from '../lib/media-url.ts';
import { getMediaUrl } from '../data/mediaConfig.ts';
import { handleLogoTransformError } from '../components/landings/orlando/OrlandoParksGallery.tsx';

/*
  Guards da issue #1326 — dimensionamento das imagens da /orlando.

  Ficam em node:test e não em Playwright de propósito: a decisão de preset é
  lógica pura, e um e2e dependeria de `VITE_MEDIA_ENABLE_TRANSFORMS`, que está
  desligado no dev server que o Playwright levanta. Um teste que só roda com
  transforms ligados ficaria permanentemente `skipped` no CI — verde sem
  verificar nada.
*/

const PROD_TRANSFORM_CONFIG = {
    mediaBaseUrl: 'https://media.anhanga.tur.br',
    transformZoneUrl: 'https://media.anhanga.tur.br',
    enableTransforms: true,
};

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

test('o logo PNG é pedido por optimizeRemoteImageUrl, não cru', async () => {
    const source = await argumentosDaGaleria();

    const chamada = source.match(/optimizeRemoteImageUrl\(logo,\s*(\d+)\)/);
    assert.ok(
        chamada,
        'o logo PNG precisa passar por optimizeRemoteImageUrl — cru é onde vivia o magic-kingdom.png de 243 KB',
    );

    const preset = selectImagePreset(Number(chamada[1]));
    assert.equal(preset.width, 800);
    assert.equal(preset.fit, 'scale-down');

    // E a URL resultante precisa mesmo atravessar a zona de transform.
    const url = optimizeImageUrl('images/orlando/logos/epcot.png', {
        ...PROD_TRANSFORM_CONFIG,
        width: Number(chamada[1]),
    });
    assert.match(url, /\/cdn-cgi\/image\//);
    assert.match(url, /width=800/);
});

test('a galeria não reintroduz srcSet, que neste repo é markup morto', async () => {
    const source = await readFile(new URL(`../${GALLERY_SOURCE}`, import.meta.url), 'utf8');

    // selectImagePreset normaliza qualquer largura para um conjunto fixo de
    // presets, então todo candidato de um srcSet colapsaria na MESMA URL. Se
    // alguém adicionar srcSet aqui achando que economiza bytes, este teste
    // explica por que não economiza.
    assert.ok(
        !/srcSet=/.test(source),
        'srcSet na galeria da /orlando gera candidatos idênticos — ver o comentário no topo do arquivo',
    );
});

test('o SVG do logo não é roteado para o transform raster', async () => {
    const source = await readFile(new URL(`../${GALLERY_SOURCE}`, import.meta.url), 'utf8');

    // Vetor não ganha byte nenhum com resize e pode ser rasterizado.
    assert.match(
        source,
        /isVector\(logo\)\s*\?\s*getMediaUrl\(logo\)\s*:\s*optimizeRemoteImageUrl\(logo,\s*200\)/,
        'os SVG precisam continuar indo por getMediaUrl, sem transform',
    );
});

test('o fallback de transform quebrado continua ligado nos logos', async () => {
    const source = await readFile(new URL(`../${GALLERY_SOURCE}`, import.meta.url), 'utf8');

    // magic-kingdom.png (11502×1942) devolve HTTP 422 no resizer da Cloudflare.
    // Sem o onError, o logo mais proeminente da página sumiria.
    assert.match(source, /onError=\{isVector\(logo\)\s*\?\s*undefined\s*:\s*handleLogoTransformError\(logo\)\}/);
});

/*
  Os testes acima provam que o onError está LIGADO. Estes provam que ele
  FUNCIONA — distinção que o review da PR #1347 (Codex, P2) apontou: o e2e roda
  contra o dev server sem `VITE_MEDIA_ENABLE_TRANSFORMS`, então o logo é
  servido cru, o HTTP 422 nunca acontece e o handler jamais é exercitado.
  Ficaria verde com o fallback implementado errado.
*/

const LOGO = 'images/orlando/logos/magic-kingdom.png';

function eventoDeErroFalso(srcAtual: string) {
    const img = { src: srcAtual };
    return { currentTarget: img, img };
}

test('o fallback troca a URL transformada pelo original', () => {
    const transformada =
        'https://media.anhanga.tur.br/cdn-cgi/image/format=auto,width=800/' + LOGO;
    const { currentTarget, img } = eventoDeErroFalso(transformada);

    handleLogoTransformError(LOGO)(
        { currentTarget } as unknown as Parameters<ReturnType<typeof handleLogoTransformError>>[0],
    );

    assert.equal(img.src, getMediaUrl(LOGO));
    assert.ok(!img.src.includes('/cdn-cgi/image/'), 'o fallback não pode apontar para o transform');
});

test('o fallback não entra em loop quando o próprio original falha', () => {
    const original = getMediaUrl(LOGO);
    const { currentTarget, img } = eventoDeErroFalso(original);

    handleLogoTransformError(LOGO)(
        { currentTarget } as unknown as Parameters<ReturnType<typeof handleLogoTransformError>>[0],
    );

    // Sem a guarda, reatribuir o mesmo src dispara onError de novo, em loop.
    assert.equal(img.src, original);
});
