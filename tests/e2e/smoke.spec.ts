import { test, expect } from '@playwright/test';
import { HomePage } from './pages/HomePage';
import { AIChat } from './pages/AIChat';

test.describe('Smoke Suite', () => {
  test('should load home page and verify key elements', async ({ page, isMobile }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

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
    const homePage = new HomePage(page);
    const aiChat = new AIChat(page);

    await homePage.goto();
    await homePage.openChat(isMobile);

    await aiChat.expectVisible();
    await aiChat.expectMessageContaining('Gostaria de falar com um especialista');
  });

  test('should navigate to landing pages', async ({ page }) => {
    const landingPages = [
      { path: '/orlando', title: /Orlando/i },
      { path: '/beto-carrero', title: /Beto Carrero/i },
      { path: '/lollapalooza-2026', title: /Lollapalooza/i },
    ];

    for (const landing of landingPages) {
      await page.goto(landing.path);
      await expect(page).toHaveTitle(landing.title);
      // Verify no GLOBAL header on landings (which has the .fixed class)
      await expect(page.locator('header.fixed.top-0')).not.toBeVisible();
    }
  });

  test('should verify mobile menu visibility', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test is for mobile only');
    const homePage = new HomePage(page);
    await homePage.goto();

    await expect(homePage.mobileMenuBtn).toBeVisible();
    await homePage.openMobileMenu();
    await expect(page.locator('#mobile-menu')).toBeVisible();
  });
});
