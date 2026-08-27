import { expect, test } from '@playwright/test';

test('VenueMap survives SPA unmount and remount without Leaflet lifecycle errors', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.route('https://tile.openstreetmap.org/**', route => route.abort());
  await page.goto('/lollapalooza');

  const map = page.locator('section.leaflet-container[aria-label="Mapa interativo com pontos de interesse"]');
  await expect(map).toBeVisible();
  await expect(map.locator('.leaflet-marker-icon')).toHaveCount(6);

  await map.evaluate(async mapElement => {
    const zoomInButton = mapElement.querySelector<HTMLAnchorElement>('.leaflet-control-zoom-in');
    const backLink = [...document.querySelectorAll<HTMLAnchorElement>('a')]
      .find(link => link.textContent?.includes('Voltar para o site principal'));

    if (!zoomInButton) throw new Error('Zoom-in button not found');
    if (!backLink) throw new Error('Back link not found');

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
    backLink.click();
  });
  await expect(page).toHaveURL(/\/$/);
  await expect(map).toHaveCount(0);

  await page.goBack();
  await expect(page).toHaveURL(/\/lollapalooza\/?$/);
  await expect(map).toBeVisible();
  await expect(map.locator('.leaflet-marker-icon')).toHaveCount(6);

  await map.getByRole('button', { name: 'Aeroporto de Congonhas (CGH)', exact: true }).click();
  await expect(map.locator('.leaflet-popup-content')).toContainText('Aeroporto de Congonhas (CGH)');
  await expect(page.locator('button').filter({ hasText: 'Aeroporto de Congonhas (CGH)' })).toHaveClass(/border-anhanga-blue/);

  expect(pageErrors.filter(message => /Map container is already initialized|Map container is being reused|_leaflet_pos|leaflet/i.test(message))).toEqual([]);
});
