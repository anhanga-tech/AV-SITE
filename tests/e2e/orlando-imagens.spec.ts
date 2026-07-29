import { test, expect } from '@playwright/test';

/*
  A parte lógica dos guards da issue #1326 vive em `tests/orlando-imagens.test.ts`
  (node:test): a decisão de preset é lógica pura, e um e2e dela dependeria de
  `VITE_MEDIA_ENABLE_TRANSFORMS`, desligado no dev server que o Playwright
  levanta — o teste ficaria permanentemente `skipped`, verde sem verificar nada.

  O que sobra aqui é o que só o browser prova: que nenhuma imagem termina
  quebrada na tela.
*/

test('/orlando — nenhuma imagem fica quebrada', async ({ page }) => {
  await page.goto('/orlando/');
  await page.getByRole('heading', { level: 1 }).waitFor();

  // Força o carregamento das lazy antes de medir.
  await page.evaluate(() => {
    document.querySelectorAll('img').forEach((img) => {
      img.loading = 'eager';
    });
  });
  await page.waitForLoadState('networkidle');

  // ATENÇÃO: isto NÃO cobre o fallback de transform. Este teste roda contra o
  // dev server, onde `VITE_MEDIA_ENABLE_TRANSFORMS` está desligado, então o
  // logo é servido cru, o HTTP 422 do resizer nunca acontece e o
  // `handleLogoTransformError` jamais é exercitado — ficaria verde com o
  // fallback implementado errado (achado do review da PR #1347).
  // Quem cobre o comportamento do handler é `tests/orlando-imagens.test.ts`.
  // O que este teste prova é o básico que só o browser mostra: que a página
  // não termina com imagem quebrada na tela.
  const broken = await page.evaluate(() =>
    [...document.querySelectorAll('.landing-orlando img')]
      .filter((el) => {
        const img = el as HTMLImageElement;
        return img.complete && img.naturalWidth === 0;
      })
      .map((el) => (el as HTMLImageElement).currentSrc),
  );

  expect(broken).toEqual([]);
});
