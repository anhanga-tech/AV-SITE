import { test, expect } from '@playwright/test';

for (const mode of ['mobile', 'desktop', 'desktop-timeout', 'reduced-motion', 'save-data'] as const) {
  test(`hero keeps the preloaded poster with forced alternate randomness: ${mode}`, async ({ page }) => {
    await page.setViewportSize(mode === 'mobile' ? { width: 412, height: 823 } : { width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: mode === 'reduced-motion' ? 'reduce' : 'no-preference' });
    await page.addInitScript((saveData) => {
      Math.random = () => 0.99; // Previously selected Natureza instead of the preloaded Rio.
      Object.defineProperty(navigator, 'connection', { value: { saveData }, configurable: true });
    }, mode === 'save-data');
    const posters: string[] = [];
    const hydrationErrors: string[] = [];
    page.on('console', message => {
      if (message.type() === 'error' && /hydrat|Minified React error #4(18|23|25)/i.test(message.text())) hydrationErrors.push(message.text());
    });
    page.on('pageerror', error => hydrationErrors.push(error.message));
    // Fulfill media locally so CI neither depends on the CDN nor adds media costs.
    await page.route('https://media.anhanga.tur.br/**', async route => {
      if (/images\/hero\/.*-poster.jpg/.test(route.request().url())) posters.push(route.request().url());
      await route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"/>' });
    });
    const start = new Date('2026-09-08T12:00:00Z');
    await page.clock.install({ time: start });
    await page.clock.pauseAt(start);
    await page.goto('/');
    const poster = page.locator('img[src*="/images/hero/"]');
    await expect(poster).toHaveAttribute('src', /rio-poster.jpg/);
    const preload = page.locator('link[data-av-preload="home-hero"]');
    const normalize = (value: string | null) => value?.replace(/\s+/g, ' ').trim();
    expect(normalize(await poster.getAttribute('srcset'))).toBe(normalize(await preload.getAttribute('imagesrcset')));
    expect(await poster.getAttribute('sizes')).toBe(await preload.getAttribute('imagesizes'));
    await page.clock.runFor(1000);
    expect(posters).toHaveLength(1);
    expect(posters[0]).toContain('/rio-poster.jpg');
    await expect(page.locator('video')).toHaveCount(0);
    if (mode !== 'desktop-timeout') {
      await page.evaluate(() => window.dispatchEvent(new Event('pointerdown')));
    }
    await page.clock.runFor(7000);
    if (mode === 'desktop' || mode === 'desktop-timeout') {
      const video = page.locator('video');
      await expect(video).toHaveCount(1);
      await expect(video.locator('source')).toHaveAttribute('src', /videos\/hero\/rio.mp4/);
      await expect(video).toHaveAttribute('poster', /rio-poster.jpg/);
      expect(await video.evaluate((element: HTMLVideoElement) => element.muted)).toBe(true);
    } else {
      await expect(page.locator('video')).toHaveCount(0);
      expect(posters).toHaveLength(1);
    }
    expect(hydrationErrors).toEqual([]);
  });
}
