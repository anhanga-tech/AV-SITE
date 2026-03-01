import { test, expect } from '@playwright/test';

test.describe('SEO Metadata Verification', () => {
  const routes = ['/', '/orlando', '/beto-carrero', '/lollapalooza-2026', '/termos-de-uso'];

  for (const route of routes) {
    test(`verify no duplicate meta tags for ${route}`, async ({ page }) => {
      await page.goto(route);

      // Check for duplicate titles
  const titles = await page.evaluate(() => Array.from(document.querySelectorAll('title')).length);
  console.log(`Number of titles: ${titles}`);
  expect(titles).toBe(1);

  // Check for duplicate descriptions
  const descriptions = await page.evaluate(() => Array.from(document.querySelectorAll('meta[name="description"]')).length);
  console.log(`Number of descriptions: ${descriptions}`);
  expect(descriptions).toBe(1);

  // Check for duplicate canonicals
  const canonicals = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('link[rel="canonical"]'));
    return els.map(el => el.getAttribute('href'));
  });
  console.log(`Canonicals found: ${JSON.stringify(canonicals)}`);
  expect(canonicals.length).toBe(1);

  // Check OG tags
  const ogTags = await page.evaluate(() => {
    const titles = Array.from(document.querySelectorAll('meta[property="og:title"]')).map(el => el.getAttribute('content'));
    const descriptions = Array.from(document.querySelectorAll('meta[property="og:description"]')).map(el => el.getAttribute('content'));
    return { titles, descriptions };
  });
  console.log(`OG Titles found: ${JSON.stringify(ogTags.titles)}`);
  console.log(`OG Descriptions found: ${JSON.stringify(ogTags.descriptions)}`);
      expect(ogTags.titles.length).toBe(1);
      expect(ogTags.descriptions.length).toBe(1);
    });
  }
});
