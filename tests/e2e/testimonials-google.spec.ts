import { test, expect } from '@playwright/test';
import { writeFileSync, copyFileSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';

const REVIEWS_PATH = resolve(import.meta.dirname, '../../data/googleReviews.json');
const BACKUP_PATH = resolve(import.meta.dirname, '../../data/googleReviews.json.bak');

const FIXTURE_DATA = {
  placeId: 'ChIJtest123',
  averageRating: 4.9,
  totalReviews: 47,
  lastFetched: '2026-05-31T12:00:00Z',
  reviews: [
    {
      id: 'e2e-rev1',
      authorName: 'Maria S.',
      rating: 5,
      text: 'Excelente atendimento! Superou todas as expectativas.',
      date: '2026-04-15',
      photoUrl: '',
      destination: 'Paris',
    },
    {
      id: 'e2e-rev2',
      authorName: 'João P.',
      rating: 4,
      text: 'Muito bom, recomendo para todos.',
      date: '2025-12-01',
      photoUrl: 'https://broken-url.invalid/photo.jpg',
      destination: 'Gramado',
    },
  ],
};

test.describe('Testimonials — seed data (empty)', () => {
  test('renders fallback manual testimonials without summary bar', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollBy(0, 3000));
    const section = page.locator('#depoimentos');
    await expect(section).toBeVisible({ timeout: 15000 });

    const summaryBar = section.locator('text=avaliações no Google');
    await expect(summaryBar).toHaveCount(0);

    const carousel = section.locator('[aria-roledescription="carousel"]');
    await expect(carousel).toBeVisible();
  });

  test('carousel navigation works', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollBy(0, 3000));
    const section = page.locator('#depoimentos');
    await expect(section).toBeVisible({ timeout: 15000 });

    const nextBtn = section.getByLabel('Próximo depoimento');
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();

    const dots = section.locator('button[aria-current="true"]');
    await expect(dots).toHaveCount(1);
  });
});

test.describe('Testimonials — Google data (fixture)', () => {
  test.beforeAll(() => {
    copyFileSync(REVIEWS_PATH, BACKUP_PATH);
    writeFileSync(REVIEWS_PATH, JSON.stringify(FIXTURE_DATA, null, 2) + '\n');
  });

  test.afterAll(() => {
    copyFileSync(BACKUP_PATH, REVIEWS_PATH);
    try { unlinkSync(BACKUP_PATH); } catch {}
  });

  test('summary bar shows rating and review count', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollBy(0, 3000));
    const section = page.locator('#depoimentos');
    await expect(section).toBeVisible({ timeout: 15000 });

    await expect(section.locator('text=4.9')).toBeVisible();
    await expect(section.locator('text=47')).toBeVisible();
    await expect(section.locator('text=avaliações no Google')).toBeVisible();
  });

  test('Google badge appears on avatar', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollBy(0, 3000));
    const section = page.locator('#depoimentos');
    await expect(section).toBeVisible({ timeout: 15000 });

    await expect(section.locator('text=Google').first()).toBeVisible();
  });

  test('broken photo URL shows initials fallback', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollBy(0, 3000));
    const section = page.locator('#depoimentos');
    await expect(section).toBeVisible({ timeout: 15000 });

    const nextBtn = section.getByLabel('Próximo depoimento');
    await nextBtn.click();
    await page.waitForTimeout(800);

    const initialsDiv = section.locator('div[aria-hidden="true"]').filter({ hasText: /^[A-Z]{1,2}$/ });
    await expect(initialsDiv.first()).toBeVisible();
  });

  test('relative date is displayed', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollBy(0, 3000));
    const section = page.locator('#depoimentos');
    await expect(section).toBeVisible({ timeout: 15000 });

    const dateText = section.locator('text=/há \\d+ (dias|meses|mes|ano|anos)/');
    await expect(dateText.first()).toBeVisible();
  });
});
