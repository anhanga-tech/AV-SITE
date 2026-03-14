import { test, expect } from '@playwright/test';

test.describe('Sobre Page E-E-A-T Verification', () => {
  test('should load the about page and display key E-E-A-T elements', async ({ page }) => {
    await page.goto('/sobre');

    // Check SEO Title
    await expect(page).toHaveTitle(/Sobre a Anhangá Viagens | Agência Boutique em São Paulo/);

    // Check H1
    const h1 = page.locator('h1');
    await expect(h1).toContainText('Viagens com alma');

    // Check for Cadastur (Trust element)
    await expect(page.locator('text=37.036.732/0001-41').first()).toBeVisible();
    await expect(page.locator('text=Cadastur Oficial')).toBeVisible();

    // Check for History section
    await expect(page.locator('#nossa-historia')).toBeVisible();
    await expect(page.locator('h2').filter({ hasText: 'Nossa História' })).toBeVisible();

    // Check for Expertise/Differentiators
    await expect(page.locator('text=Atendimento Humano')).toBeVisible();
    await expect(page.locator('text=Curadoria Premium')).toBeVisible();

    // Check for Schema tags (Organization)
    const schema = await page.locator('script[type="application/ld+json"][data-av-head="script:ld-json:organization"]').first().innerHTML();
    // StructuredData uses escapeScriptContent which replaces < with \u003c
    const schemaData = JSON.parse(schema.replace(/\\u003c/g, '<'));
    expect(schemaData['@type']).toContain('TravelAgency');
    expect(schemaData['taxID']).toBe('37.036.732/0001-41');
  });

  test('should navigate to about page from header', async ({ page, isMobile }) => {
    await page.goto('/');

    if (isMobile) {
      // Open mobile menu
      await page.getByLabel('Abrir menu').click();
      // Click 'A Anhangá' in the mobile menu (within the header/menu container)
      await page.locator('#mobile-menu').getByRole('link', { name: 'A Anhangá' }).click();
    } else {
      // Hover over 'Sobre Nós' (Desktop)
      await page.getByRole('button', { name: 'Sobre Nós' }).hover();
      // Click 'A Anhangá' in the header
      await page.locator('nav').getByRole('link', { name: 'A Anhangá' }).click();
    }

    await expect(page).toHaveURL(/\/sobre/);
  });
});
