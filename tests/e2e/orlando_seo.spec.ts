import { test, expect } from "@playwright/test";

test.describe("Orlando Landing SEO", () => {
  test("should have a single visible H1 with combined content", async ({
    page,
  }) => {
    await page.goto("/orlando");

    // Check for exactly one H1
    const h1s = page.locator("h1");
    await expect(h1s).toHaveCount(1);

    // Check that it is visible
    await expect(h1s).toBeVisible();

    // Check content (both descriptive and branding)
    const h1Text = await h1s.innerText();
    expect(h1Text).toMatch(/Pacote para Orlando 2026/i);
    expect(h1Text).toMatch(/Orlando/i);
    expect(h1Text).toMatch(/É SURREAL/i);

    // Verify it's not sr-only (check height/width/overflow)
    const box = await h1s.boundingBox();
    expect(box?.height).toBeGreaterThan(10);
    expect(box?.width).toBeGreaterThan(10);
  });

  // Regressão da #1328: o FAQ renderizava DEPOIS do rodapé (`<OrlandoApp>` —
  // que termina em `<OrlandoFooter>` — vinha antes dele em OrlandoLanding.tsx).
  // As cinco respostas de maior valor de conversão ficavam abaixo de "todos os
  // direitos reservados", onde a taxa de leitura é mínima. O bloco
  // institucional de SEO segue depois do rodapé de propósito — é conteúdo
  // para robô, a issue só pediu para tirar os links que vazavam o funil dali.
  test('FAQ renderiza antes do rodapé', async ({ page }) => {
    await page.goto('/orlando/');
    await page.getByRole('heading', { level: 1 }).waitFor();

    const faq = page.locator('#faq');
    const footer = page.locator('.landing-orlando footer.main-footer');

    await expect(faq).toBeVisible();
    await expect(footer).toBeVisible();

    const faqBox = await faq.boundingBox();
    const footerBox = await footer.boundingBox();

    expect(faqBox?.y).toBeLessThan(footerBox?.y ?? 0);
  });

  // Companion da #1328: os 3 links que tiravam o visitante do funil bem no
  // ponto de maior intenção de conversão (cross-sell, blog, guia externo)
  // saíram do bloco institucional de SEO. Só o CTA de contato continua ali.
  test('bloco institucional de SEO não tem mais os links que vazavam o funil', async ({ page }) => {
    await page.goto('/orlando/');
    await page.getByRole('heading', { level: 1 }).waitFor();

    await expect(page.getByRole('link', { name: 'Ver pacote Beto Carrero' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Ler dicas no blog' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Guia Oficial Visit Orlando' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Falar com especialista' })).toBeVisible();
  });
});
