import { test, expect } from '@playwright/test';

// A landing /cruzeiros mostra ofertas selecionadas; o CTA de cada oferta abre o
// ContactModal já carregado com o contexto da oferta (linha "Sobre:"), que
// também viaja ao CRM via `destination`. Ver pages/landings/CruzeirosLanding.tsx
// e a decisão registrada no grilling desta feature.
test.describe('Landing de cruzeiros — ofertas', () => {
  test('renderiza a seção de ofertas com a seleção da temporada', async ({ page }) => {
    await page.goto('/cruzeiros');
    await expect(page.getByRole('heading', { name: 'Os cruzeiros que a gente escolheria' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Seleção da temporada' })).toBeVisible();
    // O featured card expõe seu CTA com aria-label específico da oferta.
    await expect(
      page.getByRole('button', { name: /Falar com um especialista sobre o cruzeiro/ }).first(),
    ).toBeVisible();
  });

  test('o CTA de uma oferta abre o modal com o contexto da oferta', async ({ page }) => {
    await page.goto('/cruzeiros');

    await page
      .getByRole('button', { name: /Falar com um especialista sobre o cruzeiro MSC Seaside/ })
      .click();

    const modal = page.getByRole('dialog', { name: 'Fale com um especialista' });
    await expect(modal).toBeVisible();
    // A linha de contexto confirma ao visitante qual oferta foi carregada.
    await expect(modal.getByText(/^Sobre:/)).toContainText('MSC Seaside');
  });

  test('não renderiza o AIChat flutuante (é landing de campanha)', async ({ page }) => {
    await page.goto('/cruzeiros');
    await expect(page.getByRole('button', { name: 'Abrir assistente virtual' })).toHaveCount(0);
  });
});
