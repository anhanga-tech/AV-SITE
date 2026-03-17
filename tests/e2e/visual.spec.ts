import { test, expect } from '@playwright/test';
import { AIChat } from './pages/AIChat';

test.describe('Visual Regression Suite', () => {
  test('home page should look correct', async ({ page }) => {
    await page.goto('/');
    // Use a large enough timeout for everything to stabilize
    await page.waitForLoadState('networkidle');
    // Hide dynamic elements if necessary, but here we want to see the "Hero"
    await expect(page).toHaveScreenshot('home-page.png', {
      fullPage: true,
      mask: [page.locator('.dynamic-blog-content')],
      maxDiffPixelRatio: 0.05,
    });
  });

  test('ai chat drawer should look correct', async ({ page }) => {
    const aiChat = new AIChat(page);
    await page.goto('/');
    await aiChat.open();
    // Wait for animation to finish
    await page.waitForTimeout(600);
    await expect(aiChat.chatDialog).toHaveScreenshot('chat-drawer.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  test('mobile menu should look correct', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test is for mobile only');
    await page.goto('/');
    await page.locator('button[aria-label="Abrir menu"]').click();
    await page.waitForTimeout(300);
    await expect(page.locator('#mobile-menu')).toHaveScreenshot('mobile-menu.png', {
      maxDiffPixelRatio: 0.05,
    });
  });
});
