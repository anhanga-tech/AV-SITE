import { test, expect } from '@playwright/test';

// CLAUDE.md documenta as landing pages de campanha como "no Header/Footer/AIChat" —
// cada uma tem seu próprio CTA de conversão, e um segundo overlay flutuante
// (AIChat ou BackToTop) dilui "um CTA dominante por tela" (PRODUCT.md) e cobre
// conteúdo na zona do polegar em mobile. Ver LANDING_PAGE_ROUTES em App.tsx.
test.describe('Landing pages de campanha não renderizam overlays flutuantes', () => {
  test('AIChat e BackToTop ausentes em /consultoria-de-viagem, mas o CTA de contato continua funcional', async ({ page }) => {
    await page.goto('/consultoria-de-viagem');

    await expect(page.getByRole('button', { name: 'Abrir assistente virtual' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Voltar ao topo' })).toHaveCount(0);

    // O CTA do hero agora é o produto pago (link externo para o Cal.com) e não
    // abre modal. A porta gratuita fica no link do hero ("Fale com um consultor"
    // → ContactModal), que é visível em qualquer viewport — ao contrário do CTA
    // do nav desktop (hidden sm:block, some no Mobile Chrome). O CTA do nav
    // mobile tem cobertura própria no teste abaixo.
    await page.locator('[data-tracking="hero-consultoria-porta-gratuita"]').click();
    await expect(page.getByRole('heading', { name: 'Fale com um consultor' })).toBeVisible();
  });

  test('nav mobile mantém CTA de conversão alcançável em /consultoria-de-viagem', async ({ page }) => {
    // Viewport mobile: o botão só-ícone do nav (sm:hidden) é o caminho
    // persistente para a ação primária entre o hero e o CTA final.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/consultoria-de-viagem');

    const mobileCta = page.locator('[data-tracking="header-mobile-consultoria-viagem"]');
    await expect(mobileCta).toBeVisible();
    const box = await mobileCta.boundingBox();
    expect(box, 'CTA mobile do nav precisa de bounding box').toBeTruthy();
    expect(box!.width, 'touch target ≥44px de largura').toBeGreaterThanOrEqual(44);
    expect(box!.height, 'touch target ≥44px de altura').toBeGreaterThanOrEqual(44);

    await mobileCta.click();
    await expect(page.getByRole('heading', { name: 'Fale com um consultor' })).toBeVisible();
  });

  test('AIChat ausente em /corporativo', async ({ page }) => {
    await page.goto('/corporativo');
    await expect(page.getByRole('button', { name: 'Abrir assistente virtual' })).toHaveCount(0);
  });

  test('AIChat e BackToTop continuam presentes no site principal', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Abrir assistente virtual' })).toBeVisible();
    // BackToTop monta no site principal (aparece após scroll; aqui basta existir no DOM).
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.getByRole('button', { name: 'Voltar ao topo' })).toBeVisible();
  });
});
