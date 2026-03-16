import { test, expect } from '@playwright/test';

test.describe('Landing Page FAQ Suite', () => {
  const landingPages = [
    { path: '/orlando', firstQuestion: 'Qual a melhor época para viajar para Orlando?' },
    { path: '/beto-carrero', firstQuestion: 'Quanto custa em média um pacote para o Beto Carrero?' },
    { path: '/lollapalooza', firstQuestion: 'Os pacotes para o Lollapalooza 2026 estão esgotados?' },
  ];

  for (const landing of landingPages) {
    test(`should display FAQ correctly on ${landing.path}`, async ({ page }) => {
      await page.goto(landing.path);

      // Check if FAQ section title is visible
      await expect(page.getByText('Dúvidas Frequentes', { exact: true })).toBeVisible();

      // Check if the first question is visible
      const question = page.getByText(landing.firstQuestion);
      await expect(question).toBeVisible();

      // Check if clicking the question reveals the answer
      // By default the first one is open (openIndex = 0 in LandingFAQ.tsx)
      // So we check if the answer is visible
      // We can look for the schema metadata or the text
      await expect(page.locator('div[itemprop="acceptedAnswer"]').first()).toBeVisible();

      // Check for Schema.org JSON-LD
      const script = await page.locator('script[type="application/ld+json"]').evaluateAll(scripts =>
        scripts.find(s => s.innerHTML.includes('FAQPage'))
      );
      expect(script).toBeTruthy();
    });
  }
});
