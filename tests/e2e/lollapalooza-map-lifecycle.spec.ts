import { expect, test } from '@playwright/test';

test('VenueMap survives SPA unmount and remount without Leaflet lifecycle errors', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.route('https://*.basemaps.cartocdn.com/**', route => route.abort());
  await page.goto('/lollapalooza');

  const map = page.locator('section.leaflet-container[aria-label="Mapa interativo com pontos de interesse"]');
  await expect(map).toBeVisible();
  await expect(map.locator('.leaflet-marker-icon')).toHaveCount(6);

  await page.getByRole('link', { name: 'Voltar para o site principal' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(map).toHaveCount(0);

  await page.goBack();
  await expect(page).toHaveURL(/\/lollapalooza\/?$/);
  await expect(map).toBeVisible();
  await expect(map.locator('.leaflet-marker-icon')).toHaveCount(6);

  await map.getByRole('button', { name: 'Aeroporto de Congonhas (CGH)', exact: true }).click();
  await expect(map.locator('.leaflet-popup-content')).toContainText('Aeroporto de Congonhas (CGH)');
  await expect(page.locator('button').filter({ hasText: 'Aeroporto de Congonhas (CGH)' })).toHaveClass(/border-anhanga-blue/);

  expect(pageErrors.filter(message => /Map container is already initialized|Map container is being reused|leaflet/i.test(message))).toEqual([]);
});
