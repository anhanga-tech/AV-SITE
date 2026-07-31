import { test, expect } from '@playwright/test';

/*
  Guards da curadoria da issue #1330: 4 parques em destaque (Magic Kingdom,
  Hollywood Studios, Islands of Adventure, Epic Universe) + os outros 8
  recolhidos atrás de "Ver todos os N parques". Sem este teste a interação
  mais significativa da PR (o toggle do accordion) ficava sem cobertura
  nenhuma além da regex de `<h3>{name}</h3>` em node:test, que só verifica
  texto-fonte — não o comportamento em runtime (review do Codex).
*/

test.describe('/orlando — galeria de parques', () => {
  test('os 4 parques em destaque aparecem sem clicar em nada', async ({ page }) => {
    await page.goto('/orlando/');
    await page.getByRole('heading', { level: 1 }).waitFor();

    for (const nome of ['Magic Kingdom', 'Hollywood Studios', 'Islands of Adventure', 'Epic Universe']) {
      await expect(page.getByRole('heading', { name: nome, exact: true })).toBeVisible();
    }
  });

  test('"Ver todos os parques" revela os outros 8 e alterna aria-expanded', async ({ page }) => {
    await page.goto('/orlando/');
    await page.getByRole('heading', { level: 1 }).waitFor();

    // Locator estável por classe, não por nome acessível: o texto do botão
    // alterna para "Ver menos parques" depois do clique, e um `getByRole`
    // baseado em `name` deixa de casar com o próprio elemento que a gente
    // acabou de clicar — cada `expect` subsequente reconsulta o DOM do zero.
    const toggle = page.locator('.parks-toggle-btn');
    await toggle.scrollIntoViewIfNeeded();
    await expect(toggle).toHaveText(/Ver todos os \d+ parques/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    // Epcot é um dos 8 recolhidos — não está entre os 4 destaques.
    const epcot = page.getByRole('heading', { name: 'Epcot', exact: true });
    const panelId = await toggle.getAttribute('aria-controls');
    const painel = page.locator(`[id="${panelId}"]`);

    await expect(painel).toHaveAttribute('aria-hidden', 'true');
    await expect(epcot).toBeHidden();

    await toggle.click();

    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(painel).toHaveAttribute('aria-hidden', 'false');
    await expect(epcot).toBeVisible();
    await expect(toggle).toHaveText(/Ver menos parques/);

    await toggle.click();

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(painel).toHaveAttribute('aria-hidden', 'true');
  });
});
