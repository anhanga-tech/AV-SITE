import { test, expect } from '@playwright/test';

test.describe('Design System — smoke', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('SectionHeader renderiza com heading level 2', async ({ page }) => {
        // Testimonials is below the fold — scroll to trigger lazy mount
        await page.locator('#depoimentos').scrollIntoViewIfNeeded();
        const heading = page.getByRole('heading', { level: 2, name: /Mural do Amor/i });
        await expect(heading).toBeVisible();
    });

    test('SectionHeader renderiza badge acima do título', async ({ page }) => {
        await page.locator('#depoimentos').scrollIntoViewIfNeeded();
        const badge = page.getByText('Love Notes', { exact: false });
        await expect(badge).toBeVisible();
    });

    test('CTA primário na hero está visível e habilitado', async ({ page }) => {
        const cta = page.getByTestId('submit-search-btn-mobile').or(
            page.getByRole('button', { name: /orçamento/i })
        );
        await expect(cta.first()).toBeVisible();
        await expect(cta.first()).toBeEnabled();
    });
});
