import { test, expect } from '@playwright/test';
import { HomePage } from './pages/HomePage';
import { AIChat } from './pages/AIChat';
import { BrazilPromotionDayPage } from './pages/BrazilPromotionDayPage';

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
    await aiChat.expectMessageContaining('Tivemos um problema técnico interno');
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
    await expect(aiChat.typingIndicator).toBeVisible();

    // Wait for response after delay
    await aiChat.expectMessageContaining('Respondendo após delay');
  });

  test('should handle invalid destination input in search bar', async ({ page, isMobile }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    if (isMobile) {
      // Use mobile specific elements
      await homePage.mobileDestinationInput.fill('    ');
      await homePage.mobileSubmitSearchBtn.click();
    } else {
      // Fill with empty or nonsense
      await homePage.fillDestination('    ');
      await homePage.submitSearch();
    }

    // Should stay on home or show validation (depends on implementation)
    await expect(page).toHaveURL(/\/$/);
  });

  test('should handle API 500 error in Brazil Promotion Day form', async ({ page }) => {
    const landing = new BrazilPromotionDayPage(page);
    await page.route('**/api/submit-lead', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error', code: 'SERVER_ERROR' }),
      });
    });

    await landing.goto();

    await landing.fillForm({
      firstName: 'Chaos',
      lastName: 'Tester',
      email: 'chaos@test.com',
      whatsapp: '(11) 98831-4487',
      destination: 'Paris',
    });

    await landing.submit();

    await landing.expectError('Internal Server Error');
  });

  test('should handle network timeout in Brazil Promotion Day form', async ({ page }) => {
    const landing = new BrazilPromotionDayPage(page);
    await page.route('**/api/submit-lead', async route => {
      // Small delay to ensure it's not instantaneous but enough to trigger fetch failure
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.abort('timedout');
    });

    await landing.goto();

    await landing.fillForm({
      firstName: 'Timeout',
      lastName: 'Tester',
      email: 'timeout@test.com',
      whatsapp: '(11) 98831-4487',
      destination: 'Paris',
    });

    await landing.submit();

    // Since the request was aborted/timed out, useLeadCapture should catch the network error
    await landing.expectError();
  });
});
