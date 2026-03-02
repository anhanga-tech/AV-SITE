import { test, expect } from '@playwright/test';

/**
 * Test to verify that SEO metadata (title, description, canonical)
 * are correctly set, not duplicated, and follow the canonical standards
 * (absolute URLs, www, and trailing slash).
 *
 * Note: React 19 native hoisting is used. Metadata might take a moment
 * to stabilize during hydration.
 */
test.describe('SEO Metadata Verification', () => {
  const routes = [
    { path: '/', expectedCanonical: 'https://www.anhanga.tur.br/' },
    { path: '/orlando', expectedCanonical: 'https://www.anhanga.tur.br/orlando/' },
    { path: '/beto-carrero', expectedCanonical: 'https://www.anhanga.tur.br/beto-carrero/' },
    { path: '/lollapalooza-2026', expectedCanonical: 'https://www.anhanga.tur.br/lollapalooza-2026/' },
    { path: '/termos-de-uso', expectedCanonical: 'https://www.anhanga.tur.br/termos-de-uso/' },
  ];

  for (const route of routes) {
    test(`Checking metadata for ${route.path}`, async ({ page }) => {
      // Use longer timeout for slow CI environments
      test.setTimeout(60000);

      // Navigate and wait for full load
      await page.goto(route.path, { waitUntil: 'load', timeout: 30000 });

      // Since index.html has NO SEO tags, we wait for any SEO tag to appear
      // as a signal that React has hoisted the metadata.
      // Use .first() if multiple tags temporarily exist during hydration (though React 19 should merge them)
      const description = page.locator('meta[name="description"]').first();
      await expect(description).toHaveAttribute('content', /.+/, { timeout: 20000 });

      // 1. Verify Title (must be unique)
      // Note: React 19 handles title updates. We wait for it to contain our brand.
      await expect(page).toHaveTitle(/Anhangá Viagens/, { timeout: 10000 });
      const titles = page.locator('title');
      await expect(titles).toHaveCount(1);

      // 2. Verify Description Presence and Uniqueness
      const descriptions = page.locator('meta[name="description"]');
      await expect(descriptions).toHaveCount(1);
      const descriptionContent = await descriptions.getAttribute('content');
      expect(descriptionContent?.length).toBeGreaterThan(50);

      // 3. Verify Canonical Uniqueness and Value
      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveAttribute('href', route.expectedCanonical, { timeout: 15000 });
      await expect(canonical).toHaveCount(1);

      // 4. Verify Open Graph Title
      const ogTitle = page.locator('meta[property="og:title"]');
      await expect(ogTitle).toHaveAttribute('content', /.+/, { timeout: 10000 });
      await expect(ogTitle).toHaveCount(1);

      // 5. Verify Open Graph URL (must match canonical)
      const ogUrl = page.locator('meta[property="og:url"]');
      await expect(ogUrl).toHaveAttribute('content', route.expectedCanonical, { timeout: 10000 });
      await expect(ogUrl).toHaveCount(1);
    });
  }
});
