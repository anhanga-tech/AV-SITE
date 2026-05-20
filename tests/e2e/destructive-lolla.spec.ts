import { test, expect } from '@playwright/test';
import { LollapaloozaPage } from './pages/LollapaloozaPage';

test.describe('Lollapalooza Waitlist Destructive Tests', () => {
  let lollaPage: LollapaloozaPage;

  test.beforeEach(async ({ page }) => {
    lollaPage = new LollapaloozaPage(page);
    await lollaPage.goto();
  });

  test('should handle XSS payloads gracefully', async ({ page }) => {
    await lollaPage.fillForm({
      name: '<script>alert("xss")</script>Felipe',
      email: 'felipe@qa.com'
    });

    await page.route('**/api/submit-waitlist', route => {
      const payload = route.request().postDataJSON();
      expect(payload.name).not.toContain('<script>');
      return route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
    });

    await lollaPage.submit();
  });

  test('should prevent duplicate submissions on rapid clicks', async ({ page }) => {
    await lollaPage.fillForm({
      name: 'Rage Clicker',
      email: 'rage@qa.com'
    });

    let requestCount = 0;
    await page.route('**/api/submit-waitlist', async (route) => {
      requestCount++;
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
    });

    const btn = lollaPage.submitBtn;

    // We fire the first click and immediately fire subsequent ones without waiting
    await btn.click().catch(() => {});
    await btn.click({ force: true }).catch(() => {});
    await btn.click({ force: true }).catch(() => {});

    // Wait for the first request to finish processing in our mock
    await page.waitForTimeout(1500);

    expect(requestCount).toBe(1);
  });

  test('should show error message on 500 server error', async ({ page }) => {
    await lollaPage.fillForm({
      name: 'Error Test',
      email: 'error@qa.com'
    });

    await page.route('**/api/submit-waitlist', route =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );

    await lollaPage.submit();
    await expect(lollaPage.errorMessage).toBeVisible();
  });

  test('should handle network timeout gracefully', async ({ page }) => {
    await lollaPage.fillForm({
      name: 'Timeout Test',
      email: 'timeout@qa.com'
    });

    await page.route('**/api/submit-waitlist', route => route.abort('timedout'));

    await lollaPage.submit();
    await expect(lollaPage.errorMessage).toBeVisible();
  });
});
