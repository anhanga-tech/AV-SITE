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

    await expect(homePage.destinationInput).toBeVisible();
    await expect(homePage.submitSearchBtn).toBeVisible();
  });

  test('should open AI Chatbot via "Fale Conosco" button', async ({ page, isMobile }) => {
    await page.goto('/');
    const homePage = new HomePage(page);
    const aiChat = new AIChat(page);

    await homePage.openChat(isMobile);

    await aiChat.expectVisible();
    await aiChat.expectOnlineStatus();
    await aiChat.expectMessageContaining('Gostaria de falar com um especialista');
  });

  test('should navigate to basic landing pages', async ({ page }) => {
    const landingPages = [
      { path: '/orlando', title: /Orlando/i },
      { path: '/beto-carrero', title: /Beto Carrero/i },
      { path: '/lollapalooza-2026', title: /Lollapalooza/i },
    ];

    for (const landing of landingPages) {
      await page.goto(landing.path);
      await expect(page).toHaveTitle(landing.title);
      await expect(page.locator('header.fixed.top-0')).not.toBeVisible();
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

    // Lollapalooza
    await page.goto('/lollapalooza-2026');
    await page.getByTestId('cta-lollapalooza-specialist').click();
    await aiChat.expectVisible();
    await aiChat.expectMessageContaining('Lollapalooza');
  });
});
