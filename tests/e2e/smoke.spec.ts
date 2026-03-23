import { test, expect } from '@playwright/test';
import { HomePage } from './pages/HomePage';
import { AIChat } from './pages/AIChat';

test.describe('Smoke Suite', () => {
  test('should load home page and verify key elements', async ({ page, isMobile }) => {
    await page.goto('/');
    const homePage = new HomePage(page);
    await expect(homePage.headerLogo).toBeVisible();

    if (isMobile) {
      await expect(homePage.mobileMenuBtn).toBeVisible();
      await expect(homePage.faleConoscoBtn).not.toBeVisible();
    } else {
      await expect(homePage.faleConoscoBtn).toBeVisible();
    }

    if (isMobile) {
      await expect(homePage.mobileDestinationInput).toBeVisible();
      await expect(homePage.mobileSubmitSearchBtn).toBeVisible();
    } else {
      await expect(homePage.destinationInput).toBeVisible();
      await expect(homePage.submitSearchBtn).toBeVisible();
    }
  });

  test('should open AI Chatbot via "Fale Conosco" button', async ({ page, isMobile }) => {
    await page.goto('/');
    const homePage = new HomePage(page);
    const aiChat = new AIChat(page);

    await homePage.openChat(isMobile);

    await aiChat.expectVisible();
    await aiChat.expectOnlineStatus();
    // Initial greeting is hardcoded in AIChat.tsx state — not AI-generated, so always deterministic
    await aiChat.expectMessageContaining('Olá! Sou seu guia Anhangá');
  });

  test('should navigate to basic landing pages', async ({ page }) => {
    const landingPages = [
      { path: '/orlando', title: /Orlando/i },
      { path: '/beto-carrero', title: /Beto Carrero/i },
      { path: '/lollapalooza', title: /Lollapalooza/i },
    ];

    for (const landing of landingPages) {
      await page.goto(landing.path);
      await expect(page).toHaveTitle(landing.title);
      await expect(page.getByTestId('site-header')).not.toBeVisible();
    }
  });

  test('should verify mobile menu visibility', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test is for mobile only');
    await page.goto('/');
    const homePage = new HomePage(page);
    await expect(homePage.mobileMenuBtn).toBeVisible();
    await homePage.openMobileMenu();
    await expect(page.locator('#mobile-menu')).toBeVisible();
  });

  test('should trigger chatbot from landing pages CTAs', async ({ page }) => {
    const aiChat = new AIChat(page);

    // Intercept Gemini proxy so tests are deterministic and don't hit the real API
    await page.route('**/api/generate', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ text: 'Claro! Posso te ajudar com isso.' }),
      })
    );

    // Orlando
    await page.goto('/orlando');
    await page.getByTestId('cta-orlando-specialist').click();
    await aiChat.expectVisible();
    await aiChat.expectMessageContaining('Orlando');
    await aiChat.close();

    // Beto Carrero
    await page.goto('/beto-carrero');
    await page.getByTestId('cta-betocarrero-specialist').click();
    await aiChat.expectVisible();
    await aiChat.expectMessageContaining('Beto Carrero');
    await aiChat.close();

  });
});
