import { test, expect } from '@playwright/test';

// A landing /cruzeiros mostra ofertas selecionadas; o CTA de cada oferta abre o
// ContactModal já carregado com o contexto da oferta (linha "Sobre:"), que
// também viaja ao CRM via `destination`. Ver
// components/landings/cruzeiros/CruiseOfferCards.tsx.
//
// ACOPLAMENTO AO CALENDÁRIO (intencional): o filtro de expiração
// (lib/cruise-offers-schedule.js) usa o relógio real, então estes specs dependem
// de haver ao menos uma oferta válida em data/cruiseOffers.ts. Quando TODAS
// vencerem, eles falham — e isso é o sinal desejado: a página caiu no estado
// vazio porque ninguém repôs o mix. Se o CI ficar vermelho aqui sem nenhuma
// mudança de código, cheque os `expiraEm` antes de procurar regressão (o mais
// longevo do seed atual é 2027-03-15).
//
// As asserções não fixam um navio específico — leem o nome do próprio card — para
// sobreviverem à troca do mix a cada ciclo.
test.describe('Landing de cruzeiros — ofertas', () => {
  const CTA_OFERTA = /Falar com um especialista sobre o cruzeiro/;

  test('renderiza a seção de ofertas com a seleção da temporada', async ({ page }) => {
    await page.goto('/cruzeiros');
    await expect(page.getByRole('heading', { name: 'Os cruzeiros que a gente escolheria' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Seleção da temporada' })).toBeVisible();
    await expect(page.getByRole('button', { name: CTA_OFERTA }).first()).toBeVisible();
  });

  test('o CTA de uma oferta abre o modal com o contexto daquela oferta', async ({ page }) => {
    await page.goto('/cruzeiros');

    const cta = page.getByRole('button', { name: CTA_OFERTA }).first();
    const label = (await cta.getAttribute('aria-label')) ?? '';
    const navio = label.replace('Falar com um especialista sobre o cruzeiro ', '').trim();
    expect(navio).not.toBe('');

    await cta.click();

    const modal = page.getByRole('dialog', { name: 'Fale com um consultor' });
    await expect(modal).toBeVisible();
    // A linha de contexto confirma ao visitante qual oferta foi carregada — e é o
    // mesmo texto que vai ao CRM em `destination`.
    await expect(modal.getByText(/^Sobre:/)).toContainText(navio);
  });

  test('não renderiza o AIChat flutuante (é landing de campanha)', async ({ page }) => {
    await page.goto('/cruzeiros');
    await expect(page.getByRole('button', { name: 'Abrir assistente virtual' })).toHaveCount(0);
  });

  // Mesmo acoplamento ao calendário do topo do arquivo: só há card órfão para
  // centralizar quando a contagem de ofertas secundárias % 3 === 1 (ver
  // secondaryLastOrphanAtLg em CruiseOffersSection, components/landings/cruzeiros/CruzeirosLandingSections.tsx).
  // Se o mix mudar para uma contagem sem órfão, o teste pula em vez de
  // falhar — não há nada a verificar nesse dia.
  //
  // O locator é escopado direto ao container da grade secundária
  // (data-testid="ofertas-secundarias"), não inferido subtraindo 1 do total
  // de <article> assumindo que o primeiro é sempre a oferta featured:
  // FEATURED_OFFER pode ser undefined (nenhuma oferta ativa com featured:true)
  // e, nesse caso, SECONDARY_OFFERS vira a lista inteira — a subtração erraria
  // a contagem e o teste falharia de forma espúria nesse cenário real.
  test('centraliza o último card órfão da grade de ofertas em telas grandes', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/cruzeiros');

    const grid = page.getByTestId('ofertas-secundarias');
    const cards = grid.locator('> *');
    // `.count()` não espera hidratação — sem isso a contagem pode ler o DOM
    // ainda vazio logo após o goto e o teste pula por engano.
    await expect(cards.first()).toBeVisible();
    const secondaryCount = await cards.count();

    test.skip(secondaryCount % 3 !== 1, `sem card órfão hoje (${secondaryCount} ofertas secundárias)`);

    await expect(cards.last()).toHaveCSS('grid-column-start', '2');
  });
});
