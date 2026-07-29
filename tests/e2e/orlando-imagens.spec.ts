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

  // Cobre o fallback de transform: o magic-kingdom.png devolve HTTP 422 no
  // resizer da Cloudflare, e sem o onError o logo sumiria da página.
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
