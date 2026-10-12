import { test, expect } from '@playwright/test';

for (const [route, faces] of [
  ['/beto-carrero/', ['400 18px Poppins', '700 18px Poppins']],
  ['/lollapalooza/', ['300 18px Outfit', '400 18px Outfit', '600 18px Outfit', '700 18px Outfit', '900 18px Outfit']],
  ['/orlando/', ['400 18px Outfit', '500 18px Outfit', '600 18px Outfit', '700 18px Outfit', '900 18px Outfit', '400 18px "Space Mono"', '700 18px "Space Mono"']],
] as const) {
  test(`${route} carrega as fontes da própria origem sem Google Fonts`, async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const loaded = await page.evaluate(async (specs) => {
      const results = await Promise.all(specs.map((spec) => document.fonts.load(spec, 'Férias São Paulo')));
      await document.fonts.ready;
      return results.map((result) => result.length > 0 && result.every((face) => face.status === 'loaded'));
    }, [...faces]);
    expect(loaded).toEqual(faces.map(() => true));
    expect(requests.filter((url) => /fonts\.(googleapis|gstatic)\.com/.test(url))).toEqual([]);
    const fonts = requests.filter((url) => /\.woff2(?:\?|$)/.test(url));
    expect(fonts.length).toBeGreaterThan(0);
    const origin = new URL(page.url()).origin;
    expect(fonts.every((url) => new URL(url).origin === origin)).toBe(true);
  });
}

test('a home não baixa fontes exclusivas das landings', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  expect(requests.filter((url) => /(?:outfit|space-mono).*\.woff2/.test(url))).toEqual([]);
  const families = await page.evaluate(() => [...document.fonts].map((face) => face.family));
  expect(families).not.toContain('Outfit');
  expect(families).not.toContain('Space Mono');
});
