import { expect, test } from '@playwright/test';

test('Destinations map keeps marker selection working after SPA remount', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.route('https://*.basemaps.cartocdn.com/**', route => route.abort());
  await page.goto('/');
  await page.evaluate(() => window.dispatchEvent(new Event('scroll')));
  await page.locator('div#destinos').scrollIntoViewIfNeeded();

  const destinations = page.locator('section#destinos');
  const map = destinations.locator('.leaflet-container');
  const orlandoMarker = map.locator('.leaflet-marker-icon').first();
  const dialog = page.getByRole('dialog');

  await expect(destinations.getByText('Mapa Mundi')).toBeVisible({ timeout: 10_000 });
  await expect(map).toBeVisible();
  await expect(map.locator('.leaflet-marker-icon')).toHaveCount(22);

  await orlandoMarker.dispatchEvent('click');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Orlando' })).toBeVisible();

  await page.getByRole('link', { name: 'Ver detalhes do pacote' }).click();
  await expect(page).toHaveURL(/\/orlando\/?$/);
  await expect(destinations).toHaveCount(0);

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await page.evaluate(() => window.dispatchEvent(new Event('scroll')));
  await page.locator('div#destinos').scrollIntoViewIfNeeded();
  await expect(map).toBeVisible({ timeout: 10_000 });
  await expect(map.locator('.leaflet-marker-icon')).toHaveCount(22);

  await orlandoMarker.dispatchEvent('click');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Orlando' })).toBeVisible();

  expect(pageErrors.filter(message => /Map container is already initialized|Map container is being reused|leaflet/i.test(message))).toEqual([]);
});
