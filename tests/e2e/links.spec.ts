import { test, expect } from '@playwright/test';

test.describe('Link Integrity Suite', () => {
  test('should verify all links in footer return 200', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    const links = await footer.locator('a').all();

    console.log(`Found ${links.length} links in footer`);

    for (const link of links) {
      const href = await link.getAttribute('href');
      if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) continue;

      const targetUrl = new URL(href, page.url()).href;

      // Skip external links to avoid flakiness in local env, or use request.head
      if (!targetUrl.includes('localhost') && !targetUrl.includes('anhanga.tur.br')) {
          console.log(`Skipping external link: ${targetUrl}`);
          continue;
      }

      console.log(`Verifying: ${targetUrl}`);
      const response = await page.request.get(targetUrl);
      expect(response.status(), `Link ${targetUrl} returned ${response.status()}`).toBe(200);
    }
  });

  test('should verify main navigation links', async ({ page }) => {
    const navLinks = [
      '/',
      '/sobre/',
      '/orlando/',
      '/beto-carrero/',
      '/lollapalooza-2026/',
      '/termos-de-uso/',
      '/politica-privacidade/',
    ];

    for (const path of navLinks) {
      const response = await page.request.get(path);
      expect(response.status(), `Path ${path} returned ${response.status()}`).toBe(200);
    }
  });
});
