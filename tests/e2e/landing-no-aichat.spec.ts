import { test, expect } from '@playwright/test';

// CLAUDE.md documenta as landing pages de campanha como "no Header/Footer/AIChat" —
// cada uma tem seu próprio CTA de conversão, e um segundo overlay flutuante de contato
// dilui "um CTA dominante por tela" (PRODUCT.md). Ver LANDING_PAGE_ROUTES em App.tsx.
test.describe('Landing pages de campanha não renderizam o AIChat flutuante', () => {
  test('AIChat ausente em /consultoria-de-viagem, mas o CTA de contato continua funcional', async ({ page }) => {
    await page.goto('/consultoria-de-viagem');

    await expect(page.getByRole('button', { name: 'Abrir assistente virtual' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Falar com um consultor' }).first().click();
    await expect(page.getByRole('heading', { name: 'Fale com um especialista' })).toBeVisible();
  });

  test('AIChat ausente em /corporativo', async ({ page }) => {
    await page.goto('/corporativo');
    await expect(page.getByRole('button', { name: 'Abrir assistente virtual' })).toHaveCount(0);
  });

  test('AIChat continua presente no site principal', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Abrir assistente virtual' })).toBeVisible();
  });
});
