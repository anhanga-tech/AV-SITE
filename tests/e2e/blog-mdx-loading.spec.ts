import { expect, test } from '@playwright/test';

const FIRST_POST = '/blog/rock-in-rio-2026-guia-viagem-rio/';
const FIRST_POST_SLUG = 'rock-in-rio-2026-guia-viagem-rio';
const SECOND_POST = '/blog/roteiro-bonito-ms-5-dias/';
const SECOND_POST_SLUG = 'roteiro-bonito-ms-5-dias';
const BODY_MARKER = (slug: string) => `[data-blog-post-body="${slug}"]`;

// Vale contra pnpm dev e contra o build prerenderizado
// (PLAYWRIGHT_WEB_SERVER_COMMAND="pnpm preview"): o corpo do artigo deve
// renderizar sem erros de hidratação e a navegação SPA para outro artigo deve
// trocar o corpo — carregando apenas o chunk do destino.
test('direct blog visit renders the body and SPA navigation loads another article without hydration errors', async ({
  page,
}) => {
  const hydrationErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && /hydrat|did not match|server rendered/i.test(message.text())) {
      hydrationErrors.push(message.text());
    }
  });

  await page.goto(FIRST_POST);

  // Em HTML prerenderizado (build), o corpo do primeiro artigo já deve constar
  // no documento inicial — SSR entrega o texto completo (critério da #1600).
  const prerendered = await page.evaluate(
    () => document.documentElement.dataset.prerendered === 'true',
  );
  if (prerendered) {
    const bodyInInitialHtml = await page.evaluate((slug) => {
      return Boolean(document.querySelector(`[data-blog-post-body="${slug}"]`));
    }, FIRST_POST_SLUG);
    expect(bodyInInitialHtml).toBe(true);
  }

  // Corpo presente e visível após hidratação/render.
  await expect(page.locator(BODY_MARKER(FIRST_POST_SLUG))).toContainText(
    'O calendário da edição 2026 do Rock in Rio',
  );
  await expect(page.getByRole('button', { name: 'Abrir assistente virtual' })).toBeVisible();

  // Navegação SPA para o segundo artigo.
  await page.evaluate((path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, SECOND_POST);

  await expect(page).toHaveURL(new RegExp(SECOND_POST.replace(/\//g, '\\/') + '?$'));
  await expect(page.locator(BODY_MARKER(SECOND_POST_SLUG))).toBeVisible();
  expect(hydrationErrors).toEqual([]);
});
