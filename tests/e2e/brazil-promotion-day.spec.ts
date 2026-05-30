import { test, expect } from '@playwright/test';

test.describe('Brazil Promotion Day Redirect', () => {
  test('should redirect /brazil-promotion-day to /corporativo', async ({ page }) => {
    await page.goto('/brazil-promotion-day');
    await expect(page).toHaveURL(/\/corporativo$/);
  });
});
