import { test, expect } from '@playwright/test';

test.describe('Landing Page FAQ Suite', () => {
  const landingPages = [
    {
      path: '/orlando',
      firstQuestion: 'Qual a melhor época para viajar para Orlando?',
      firstAnswerFragment: 'maio, setembro'
    },
    {
      path: '/beto-carrero',
      firstQuestion: 'Quanto custa em média um pacote para o Beto Carrero?',
      firstAnswerFragment: 'R$ 1.200'
    },
    {
      path: '/lollapalooza',
      firstQuestion: 'Os pacotes para o Lollapalooza 2026 estão esgotados?',
      firstAnswerFragment: 'campanha de pacotes 2026 foi encerrada'
    },
  ];

  for (const landing of landingPages) {
    test(`should display FAQ correctly on ${landing.path}`, async ({ page }) => {
      await page.goto(landing.path);

      // Check if FAQ section title is visible
      await expect(page.getByText('Dúvidas Frequentes', { exact: true })).toBeVisible();

      // Check if the first question is visible
      const question = page.getByText(landing.firstQuestion);
      await expect(question).toBeVisible();

      // By default the first item is open (openIndex = 0 in LandingFAQ.tsx)
      // Verify the answer panel is expanded and its text is visible
      await expect(page.getByText(landing.firstAnswerFragment, { exact: false })).toBeVisible();

      // Check for Schema.org JSON-LD
      const script = await page.locator('script[type="application/ld+json"]').evaluateAll(scripts =>
        scripts.find(s => s.innerHTML.includes('FAQPage'))
      );
      expect(script).toBeTruthy();
    });
  }
});
