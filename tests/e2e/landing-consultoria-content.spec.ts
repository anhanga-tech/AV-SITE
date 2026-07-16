import { test, expect } from '@playwright/test';

test('landing de consultoria mostra uma foto real do destino junto ao depoimento', async ({ page }) => {
  await page.goto('/consultoria-de-viagem');

  // LazyImage só renderiza a tag <img> quando o IntersectionObserver marca o
  // container como visível — precisa rolar até a seção (via o heading, que
  // renderiza imediatamente) antes de procurar a imagem pela role.
  await page.getByRole('heading', { name: 'Para quem é' }).scrollIntoViewIfNeeded();

  const photo = page.getByRole('img', { name: /lisboa, portugal/i });
  await expect(photo).toBeVisible();
  await expect(photo).toHaveAttribute('src', /lisboa/);
  await expect
    .poll(async () => photo.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
});

test('links de "Outros serviços" recebem foco visível ao navegar por teclado', async ({ page }) => {
  await page.goto('/consultoria-de-viagem');

  const firstLink = page.getByRole('link', { name: /viagens para executivos/i });
  const ctaFinal = page.locator('[data-tracking="footer-consultoria-viagem"]');
  // Foca programaticamente o elemento tabável imediatamente anterior (o CTA
  // final) e avança com um Tab real — só o Tab (não .focus() programático)
  // aciona o heurístico de :focus-visible do Chromium no destino.
  await ctaFinal.scrollIntoViewIfNeeded();
  await ctaFinal.focus();
  await page.keyboard.press('Tab');
  await expect(firstLink).toBeFocused();

  const outlineStyle = await firstLink.evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outlineStyle).not.toBe('none');
});
