import { test, expect } from '@playwright/test';

/**
 * Test to verify that SEO metadata (title, description, canonical)
 * are correctly set, not duplicated, and follow the canonical standards
 * (absolute URLs, www, and trailing slash).
 */
test.describe('SEO Metadata Verification', () => {
  const routes = [
    { path: '/', expectedCanonical: 'https://www.anhanga.tur.br/' },
    { path: '/orlando/', expectedCanonical: 'https://www.anhanga.tur.br/orlando/' },
    { path: '/beto-carrero/', expectedCanonical: 'https://www.anhanga.tur.br/beto-carrero/' },
    { path: '/lollapalooza-2026/', expectedCanonical: 'https://www.anhanga.tur.br/lollapalooza-2026/' },
    { path: '/termos-de-uso/', expectedCanonical: 'https://www.anhanga.tur.br/termos-de-uso/' },
  ];

  for (const route of routes) {
    test(`Checking metadata for ${route.path}`, async ({ page }) => {
      // Navigate to the route and wait for network to settle
      await page.goto(route.path, { waitUntil: 'domcontentloaded' });

      // Since we removed all SEO tags from index.html, we must wait for Helmet to inject them.
      // Use toHaveTitle to wait for the title to be updated by Helmet as the first signal.
      await expect(page).toHaveTitle(/Anhangá Viagens/, { timeout: 15000 });

      // 1. Verify Title (must be unique)
      const titles = page.locator('title');
      await expect(titles).toHaveCount(1, { timeout: 10000 });

      // 2. Verify Description (must be unique)
      const descriptions = page.locator('meta[name="description"]');
      // Wait for it to be attached and have content
      await expect(descriptions).toHaveCount(1, { timeout: 10000 });
      const descriptionContent = await descriptions.getAttribute('content');
      expect(descriptionContent?.length).toBeGreaterThan(50);

      // 3. Verify Canonical (must be unique and follow the standard)
      const canonicals = page.locator('link[rel="canonical"]');
      await expect(canonicals).toHaveCount(1, { timeout: 10000 });
      const canonicalHref = await canonicals.getAttribute('href');
      expect(canonicalHref).toBe(route.expectedCanonical);

      // 4. Verify Open Graph Title (must be unique)
      const ogTitles = page.locator('meta[property="og:title"]');
      await expect(ogTitles).toHaveCount(1, { timeout: 10000 });

      // 5. Verify Open Graph URL (must be unique and match canonical)
      const ogUrls = page.locator('meta[property="og:url"]');
      await expect(ogUrls).toHaveCount(1, { timeout: 10000 });
      expect(await ogUrls.getAttribute('content')).toBe(route.expectedCanonical);
    });
  }
});
