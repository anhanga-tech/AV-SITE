import { test, expect } from '@playwright/test';

test.describe('404 Page', () => {
  test('should show the 404 page for non-existent routes', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');

    // Check title
    await expect(page).toHaveTitle(/Página não encontrada | Anhangá Viagens/);

    // Check friendly message
    await expect(page.getByText('Ops! Essa página')).toBeVisible();
    await expect(page.getByText('pegou outro rumo.')).toBeVisible();

    // Check links are present in the 404 section
    const main404Section = page.getByTestId('not-found-section');
    await expect(main404Section.getByRole('link', { name: 'Página Inicial' })).toBeVisible();
    await expect(main404Section.getByRole('link', { name: 'Blog de Viagens' })).toBeVisible();
    await expect(main404Section.getByRole('link', { name: 'Orlando' })).toBeVisible();
    await expect(main404Section.getByRole('link', { name: 'Beto Carrero' })).toBeVisible();
    await expect(main404Section.getByRole('link', { name: 'Lollapalooza' })).toBeVisible();

    // Check Breadcrumb schema
    const jsonLd = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      return scripts
        .map(s => JSON.parse(s.innerHTML))
        .find(j => j['@type'] === 'BreadcrumbList');
    });

    expect(jsonLd).not.toBeNull();
    expect(jsonLd['@type']).toBe('BreadcrumbList');
    expect(jsonLd.itemListElement).toHaveLength(2);
    expect(jsonLd.itemListElement[0].name).toBe('Home');
    expect(jsonLd.itemListElement[1].name).toBe('Página não encontrada');

    // Check Robots tag
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots).toBe('noindex, follow');
  });

  test('should navigate back to home from 404 page', async ({ page }) => {
    await page.goto('/404-test');
    // Relativo de propósito (não aponta pra produção) — clicar nele em dev/teste
    // local nunca sai do host atual, mesmo que algum teste futuro clique de verdade
    // em vez de só checar o atributo.
    const homeLink = page.getByTestId('not-found-section').getByRole('link', { name: 'Página Inicial' });
    await expect(homeLink).toHaveAttribute('href', '/');
  });
});
