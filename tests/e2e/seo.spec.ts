import { test, expect } from '@playwright/test';

test.describe('SEO Canonical Tags', () => {
  const pages = [
    { path: '/', expected: 'https://www.anhanga.tur.br/' },
    { path: '/beto-carrero', expected: 'https://www.anhanga.tur.br/beto-carrero' },
    { path: '/orlando', expected: 'https://www.anhanga.tur.br/orlando' },
    { path: '/lollapalooza-2026', expected: 'https://www.anhanga.tur.br/lollapalooza-2026' },
    { path: '/termos-de-uso', expected: 'https://www.anhanga.tur.br/termos-de-uso' },
    { path: '/politica-privacidade', expected: 'https://www.anhanga.tur.br/politica-privacidade' },
    { path: '/mapa-do-site', expected: 'https://www.anhanga.tur.br/mapa-do-site' },
    { path: '/blog', expected: 'https://blog.anhanga.tur.br/' },
    { path: '/blog/roteiro-orlando', expected: 'https://blog.anhanga.tur.br/roteiro-orlando/' },
  ];

  for (const pageInfo of pages) {
    test(`should have correct canonical tag for ${pageInfo.path}`, async ({ page }) => {
      await page.goto(pageInfo.path);

      // Wait for the canonical tag to be present and have the expected value.
      // We use a locator with an attribute filter and verify it with a polling-based assertion.
      const canonical = page.locator('link[rel="canonical"]');

      // Use toHaveAttribute with a timeout to handle hydration delays
      await expect(canonical).toHaveAttribute('href', pageInfo.expected, { timeout: 10000 });

      // Ensure there's only one canonical tag
      await expect(canonical).toHaveCount(1);
    });
  }

  test('should normalize trailing slashes and www', async ({ page }) => {
    // Test that even if accessed without www (if possible in test env) or with trailing slash,
    // the canonical remains the standardized version.
    // Note: In local dev/preview, 'localhost' is used, but our SEO component
    // replaces 'anhanga.tur.br' with 'www.anhanga.tur.br'.

    await page.goto('/orlando/');
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', 'https://www.anhanga.tur.br/orlando', { timeout: 10000 });
  });
});
