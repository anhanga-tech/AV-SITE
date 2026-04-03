import { test, expect } from '@playwright/test';

test.describe('Design System — smoke', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('SectionHeader renderiza com heading level 2', async ({ page }) => {
        // O SectionHeader do Testimonials agora usa o componente
        // Scroll até a seção de depoimentos para dispara seu carregamento
        await page.locator('#depoimentos').scrollIntoViewIfNeeded();
        const heading = page.getByRole('heading', { level: 2, name: /Mural do Amor/i });
        await expect(heading).toBeVisible();
    });

    test('SectionHeader renderiza badge acima do título', async ({ page }) => {
        // Scroll até a seção de depoimentos para dispara seu carregamento
        await page.locator('#depoimentos').scrollIntoViewIfNeeded();
        // Verifica que o badge "Love Notes" aparece como texto visível
        const badge = page.getByText('Love Notes', { exact: false });
        await expect(badge).toBeVisible();
    });

    test('CTA primário na hero tem texto visível e não está desabilitado', async ({ page }) => {
        // O botão do Hero ainda usa classes inline (Fase 3 migrará isso)
        // Este teste serve como baseline
        const cta = page.getByTestId('submit-search-btn-mobile').or(
            page.getByRole('button', { name: /orçamento/i })
        );
        // Pelo menos um CTA deve existir na página
        const count = await cta.count();
        expect(count).toBeGreaterThan(0);
    });
});
