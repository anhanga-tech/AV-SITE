import { test, expect } from '@playwright/test';

test.describe('CTA do hero não fica coberto pelo banner de cookies em mobile curto', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE — o mobile mais curto testado no critique

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('anhanga_cookie_consent');
      localStorage.removeItem('anhanga_cookie_consent_meta');
    });
  });

  test('CTA "Falar com um consultor" e o disclaimer ficam acima do banner', async ({ page }) => {
    await page.goto('/consultoria-de-viagem');

    const banner = page.getByRole('dialog', { name: 'Preferências de cookies' });
    await expect(banner).toBeVisible();

    const cta = page.locator('[data-tracking="hero-consultoria-viagem"]');
    const disclaimer = page.getByText('Sem taxa de consultoria. Gratuito.');

    const bannerBox = await banner.boundingBox();
    const ctaBox = await cta.boundingBox();
    const disclaimerBox = await disclaimer.boundingBox();
    expect(bannerBox).not.toBeNull();
    expect(ctaBox).not.toBeNull();
    expect(disclaimerBox).not.toBeNull();

    // Ambos precisam terminar acima do topo do banner (fixed bottom-0) — ver
    // critique de /consultoria-de-viagem: em telas curtas o disclaimer ficava
    // coberto mesmo com o CTA já visível.
    expect(ctaBox!.y + ctaBox!.height).toBeLessThanOrEqual(bannerBox!.y);
    expect(disclaimerBox!.y + disclaimerBox!.height).toBeLessThanOrEqual(bannerBox!.y);
  });
});

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

test('landing de consultoria mostra uma foto real do Rio de Janeiro na seção "Sobre"', async ({ page }) => {
  await page.goto('/consultoria-de-viagem');

  await page.getByRole('heading', { name: 'Sobre a Anhangá Viagens' }).scrollIntoViewIfNeeded();

  const photo = page.getByRole('img', { name: /rio de janeiro/i });
  await expect(photo).toBeVisible();
  await expect(photo).toHaveAttribute('src', /rio-de-janeiro/);
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
