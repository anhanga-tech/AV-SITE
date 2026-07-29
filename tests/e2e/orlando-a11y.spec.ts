import { test, expect } from '@playwright/test';

/*
  Guards da issue #1329. Ao contrário do fallback de imagem da #1326 — cujo
  gatilho depende de `VITE_MEDIA_ENABLE_TRANSFORMS` e por isso teve de ir para
  node:test —, aqui o ambiente do teste CONSEGUE produzir os dois defeitos: o
  Playwright emula `prefers-reduced-motion` nativamente e o foco por teclado é
  um evento real do browser. Então e2e é o lugar certo.
*/

test.describe('/orlando — acessibilidade', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('o parallax do hero não move nada com reduced-motion ligado', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/orlando/');
    await page.getByRole('heading', { level: 1 }).waitFor();

    const card = page.locator('.landing-orlando .card').first();
    await expect(card).toBeVisible();

    const antes = await card.evaluate((el) => getComputedStyle(el).transform);

    // O parallax é dirigido por mousemove acima de 1100px de viewport. O reset
    // global de CSS não alcança este transform: ele é inline, aplicado por JS.
    await page.mouse.move(200, 200);
    await page.mouse.move(1200, 700);
    await page.mouse.move(400, 300);
    await page.waitForTimeout(300);

    const depois = await card.evaluate((el) => getComputedStyle(el).transform);
    expect(depois, 'o cartão se moveu com prefers-reduced-motion: reduce').toBe(antes);
  });

  test('sem reduced-motion o parallax continua funcionando', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/orlando/');
    await page.getByRole('heading', { level: 1 }).waitFor();

    const card = page.locator('.landing-orlando .card').first();
    await expect(card).toBeVisible();
    const antes = await card.evaluate((el) => getComputedStyle(el).transform);

    await page.mouse.move(200, 200);
    await page.mouse.move(1300, 800);
    await page.waitForTimeout(300);

    // Contraprova do teste acima: sem isto, um parallax quebrado passaria nos
    // dois testes e o guard não significaria nada.
    const depois = await card.evaluate((el) => getComputedStyle(el).transform);
    expect(depois, 'o parallax deixou de funcionar sem a preferência ligada').not.toBe(antes);
  });

  test('os interativos têm anel de foco próprio, não o padrão do browser', async ({ page }) => {
    await page.goto('/orlando/');
    await page.getByRole('heading', { level: 1 }).waitFor();

    const link = page.getByRole('link', { name: 'Parques', exact: true });
    await link.focus();

    const estilo = await link.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { width: cs.outlineWidth, style: cs.outlineStyle, color: cs.outlineColor };
    });

    // O padrão do Chrome é `auto 1px rgb(0,95,204)` — some numa página de
    // bordas pretas de 2–4px. O DESIGN.md pede dois sinais visíveis.
    expect(parseFloat(estilo.width)).toBeGreaterThanOrEqual(3);
    expect(estilo.style).toBe('solid');
  });
});
