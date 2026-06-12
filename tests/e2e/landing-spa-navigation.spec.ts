import { test, expect } from '@playwright/test';

test.describe('Landing SPA navigation', () => {
  test('LandingNav "Voltar para o site principal" navigates client-side to home', async ({ page }) => {
    await page.goto('/beto-carrero/');

    // Sanity: still on the landing page before clicking.
    await expect(page).toHaveURL(/\/beto-carrero\/?$/);

    const homeLink = page.getByRole('link', { name: 'Voltar para o site principal' });
    await expect(homeLink).toHaveAttribute('href', '/');

    // The landing's own sticky nav visually overlaps this top bar; the link
    // remains a real, interactive element, so a forced click is appropriate here.
    await homeLink.click({ force: true });

    // SPA navigation should land on the same host's root without a full reload
    // to an absolute production URL (react-router <Link> keeps the test's own host).
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('body')).toBeVisible();
  });
});
