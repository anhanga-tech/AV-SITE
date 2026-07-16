import { test, expect } from '@playwright/test';

// Cobre só o <Navigate> do React Router (App.tsx). O 301 equivalente em
// public/_redirects roda na Cloudflare, não no dev server, então fica fora do
// alcance deste spec — verificar no preview deploy da PR.
test.describe('Cruzeiros Redirect', () => {
  test('should redirect /curadoria-cruzeiros-brasil to /cruzeiros', async ({ page }) => {
    await page.goto('/curadoria-cruzeiros-brasil');
    await expect(page).toHaveURL(/\/cruzeiros$/);
  });

  test('should render the cruzeiros landing after redirecting', async ({ page }) => {
    await page.goto('/curadoria-cruzeiros-brasil');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
