import { test, expect } from '@playwright/test';

test.describe('Link Integrity Suite', () => {
  test('should verify all links in footer return 200', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    const links = await footer.locator('a').all();

    console.log(`Found ${links.length} links in footer`);

    // Only verify links served by the local dev server; production-domain URLs
    // are treated as external and skipped — Cloudflare blocks CI runner IPs.
    const allowedHosts = new Set(['localhost']);

    const hrefs = await Promise.all(links.map((link) => link.getAttribute('href')));
    const targetUrls = hrefs.flatMap((href): string[] => {
      if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return [];
      const targetUrl = new URL(href, page.url()).href;
      const isLocal = allowedHosts.has(new URL(targetUrl).hostname.replace(/^www\./, '')) ||
        targetUrl.includes('localhost');
      if (!isLocal) console.log(`Skipping external link: ${targetUrl}`);
      return isLocal ? [targetUrl] : [];
    });

    await Promise.all(
      targetUrls.map(async (targetUrl) => {
        console.log(`Verifying: ${targetUrl}`);
        const response = await page.request.get(targetUrl);
        expect(response.status(), `Link ${targetUrl} returned ${response.status()}`).toBe(200);
      }),
    );
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
      '/exclusao-de-dados/',
    ];

    await Promise.all(
      navLinks.map(async (path) => {
        const response = await page.request.get(path);
        expect(response.status(), `Path ${path} returned ${response.status()}`).toBe(200);
      }),
    );
  });
});
