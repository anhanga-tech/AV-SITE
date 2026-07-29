import { expect, test, type Page } from '@playwright/test';

// O submenu "Sobre Nós" do header desktop abria apenas por hover: o gatilho não
// tinha handler algum e o painel fechado fica `invisible` (visibility: hidden),
// o que impede o foco de entrar e neutraliza o `focus-within` do CSS. Os quatro
// sublinks ficavam inalcançáveis por teclado (WCAG 2.1.1).
test.describe('Submenu do header desktop', () => {
  test.skip(({ isMobile }) => !!isMobile, 'O menu mobile achata os sublinks — não usa dropdown.');

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // Escopado ao header: "A Anhangá" também aparece no footer e nos aria-labels sociais.
  const header = (page: Page) => page.getByTestId('site-header');
  const trigger = (page: Page) => header(page).getByRole('button', { name: 'Sobre Nós' });
  const firstSubLink = (page: Page) => header(page).getByRole('link', { name: 'A Anhangá' });

  test('anuncia o estado do submenu para leitores de tela', async ({ page }) => {
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger(page)).toHaveAttribute('aria-haspopup', 'true');

    await trigger(page).click();

    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'true');
  });

  test('abre o submenu pelo teclado e alcança os sublinks com Tab', async ({ page }) => {
    await trigger(page).focus();
    await page.keyboard.press('Enter');

    await expect(firstSubLink(page)).toBeVisible();

    // Sem o fix, este Tab pulava o submenu inteiro e caía direto em "Contato".
    await page.keyboard.press('Tab');
    await expect(firstSubLink(page)).toBeFocused();
  });

  test('fecha com Escape e devolve o foco ao gatilho', async ({ page }) => {
    await trigger(page).focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await expect(firstSubLink(page)).toBeFocused();

    await page.keyboard.press('Escape');

    await expect(firstSubLink(page)).not.toBeVisible();
    await expect(trigger(page)).toBeFocused();
  });

  test('mantém a abertura por hover para quem usa mouse', async ({ page }) => {
    await trigger(page).hover();

    await expect(header(page).getByRole('link', { name: 'Nossa História' })).toBeVisible();
  });

  // O hover abre no mouseenter; sem tratamento o clique seguinte fecharia
  // justamente o menu que o ponteiro acabou de abrir.
  test('clicar com o ponteiro sobre o gatilho não fecha o menu recém-aberto', async ({ page }) => {
    await trigger(page).click();

    await expect(firstSubLink(page)).toBeVisible();
  });
});
