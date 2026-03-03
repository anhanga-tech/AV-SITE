
import { test, expect } from '@playwright/test';

const routes = [
  '/',
  '/orlando/',
  '/beto-carrero/',
  '/lollapalooza-2026/',
  '/termos-de-uso/',
  '/politica-privacidade/',
  '/mapa-do-site/'
];

test.describe('SEO Smoke Check', () => {
  for (const route of routes) {
    test(`Checking SEO for ${route}`, async ({ page }) => {
      await page.goto(route);

      // Wait for metadata (React 19 might take a moment to update document.title)
      await page.waitForFunction(() => document.title.length > 0);

      // 1. Check Title
      const title = await page.title();
      console.log(`Route: ${route} | Title: ${title}`);
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(10);

      // 2. Check Meta Description
      const descriptionLocator = page.locator('meta[name="description"]');
      await expect(descriptionLocator).toBeAttached();
      const description = await descriptionLocator.getAttribute('content');
      console.log(`Route: ${route} | Description: ${description}`);
      expect(description).toBeTruthy();
      expect(description?.length).toBeGreaterThan(50);

      // 3. Check Canonical
      const canonicalLocator = page.locator('link[rel="canonical"]');
      await expect(canonicalLocator).toBeAttached();
      const canonical = await canonicalLocator.getAttribute('href');
      console.log(`Route: ${route} | Canonical: ${canonical}`);
      // Regex explanation: https://www.anhanga.tur.br/ followed by anything (or nothing) and a trailing slash
      // The home route is exactly https://www.anhanga.tur.br/
      expect(canonical).toMatch(/^https:\/\/www\.anhanga\.tur\.br\/([^\/].*\/|)$/);

      // 4. Check Robots
      const robotsLocator = page.locator('meta[name="robots"]');
      await expect(robotsLocator).toBeAttached();
      const robots = await robotsLocator.getAttribute('content');
      console.log(`Route: ${route} | Robots: ${robots}`);
      expect(robots).toContain('index');
      expect(robots).toContain('follow');

      // 5. Check H1 - Exactly 1 per page
      const h1 = page.locator('h1');
      const h1Count = await h1.count();
      console.log(`Route: ${route} | H1 Count: ${h1Count}`);

      if (h1Count > 0) {
        const h1Text = await h1.first().innerText();
        console.log(`Route: ${route} | H1 Text: ${h1Text}`);
      }

      expect(h1Count).toBe(1);
    });
  }
});
