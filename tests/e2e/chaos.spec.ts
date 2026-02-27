import { test, expect } from '@playwright/test';
import { HomePage } from './pages/HomePage';
import { AIChat } from './pages/AIChat';

test.describe('Chaos & Unhappy Path Suite', () => {
  test('should handle Gemini API 500 error gracefully', async ({ page }) => {
    const homePage = new HomePage(page);
    const aiChat = new AIChat(page);

    // Mock the API response to return a 500 error
    await page.route('**/api/generate', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await homePage.goto();
    await aiChat.open();
    await aiChat.sendMessage('Quero viajar para o Japão');

    // Verify UI shows error message
    await expect(page.locator('div', { hasText: /tivemos um problema técnico interno/i }).first()).toBeVisible();
  });

  test('should handle slow network simulation during chat', async ({ page }) => {
    const homePage = new HomePage(page);
    const aiChat = new AIChat(page);

    // Simulate slow network for the API call
    await page.route('**/api/generate', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ text: 'Respondendo após delay' }),
      });
    });

    await homePage.goto();
    await aiChat.open();
    await aiChat.sendMessage('Testando lentidão');

    // Verify typing indicator is visible
    await expect(page.locator('span', { hasText: /digitando/i })).toBeVisible();

    // Wait for response after delay
    await aiChat.expectMessageContaining('Respondendo após delay');
  });

  test('should handle invalid destination input in search bar', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // Fill with empty or nonsense
    await homePage.fillDestination('    ');
    await homePage.submitSearch();

    // Should stay on home or show validation (depends on implementation)
    await expect(page).toHaveURL(/\/$/);
  });
});
