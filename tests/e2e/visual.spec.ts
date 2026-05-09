import { test, expect } from '@playwright/test';
import { AIChat } from './pages/AIChat';

test.describe('Visual Regression Suite', () => {
  test('home page should look correct', async ({ page }) => {
    // Freeze Math.random so Hero background selection is deterministic across runs
    await page.addInitScript(() => { Math.random = () => 0; });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Extra wait for JS-driven Framer Motion animations to complete
    await page.waitForTimeout(1500);
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
