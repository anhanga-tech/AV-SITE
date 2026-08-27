import { expect, test } from '@playwright/test';

test('Destinations map keeps marker selection working after SPA remount', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.route('https://*.tile.openstreetmap.org/**', route => route.abort());
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

  await destinations.evaluate(async section => {
    const mapElement = section.querySelector<HTMLElement>('.leaflet-container');
    const zoomInButton = section.querySelector<HTMLButtonElement>('button[aria-label="Aumentar zoom no mapa"]');
    const detailsLink = [...document.querySelectorAll<HTMLAnchorElement>('a')]
      .find(link => link.textContent?.includes('Ver detalhes do pacote'));

    if (!mapElement) throw new Error('Destinations Leaflet map not found');
    if (!zoomInButton) throw new Error('Destinations zoom-in button not found');
    if (!detailsLink) throw new Error('Destination details link not found');

    const waitForZoomAnimation = async (active: boolean) => {
      const deadline = performance.now() + 1_000;
      while (performance.now() < deadline) {
        const mapPane = mapElement.querySelector('.leaflet-map-pane');
        if (mapPane?.classList.contains('leaflet-zoom-anim') === active) return;
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      }
      throw new Error(`Leaflet zoom animation did not become ${active ? 'active' : 'idle'}`);
    };

    await waitForZoomAnimation(false);
    zoomInButton.click();
    await waitForZoomAnimation(true);
    detailsLink.click();
  });
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

  expect(pageErrors.filter(message => /Map container is already initialized|Map container is being reused|_leaflet_pos|leaflet/i.test(message))).toEqual([]);
});
