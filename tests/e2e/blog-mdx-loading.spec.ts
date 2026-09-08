import { expect, test } from '@playwright/test';

const FIRST_POST = '/blog/rock-in-rio-2026-guia-viagem-rio';
const SECOND_POST = '/blog/roteiro-bonito-ms-5-dias';

test('hydrates a direct blog visit and loads another article during SPA navigation', async ({ page }) => {
  const hydrationErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && /hydrat|did not match|server rendered/i.test(message.text())) {
      hydrationErrors.push(message.text());
    }
  });

  await page.goto(FIRST_POST);
  await expect(page.locator('[data-blog-post-body="rock-in-rio-2026-guia-viagem-rio"]')).toContainText(
    'O calendário da edição 2026 do Rock in Rio',
  );
  await expect(page.getByRole('button', { name: 'Abrir assistente virtual' })).toBeVisible();

  await page.evaluate((path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, SECOND_POST);

  await expect(page).toHaveURL(new RegExp(`${SECOND_POST}/?$`));
  await expect(page.locator('[data-blog-post-body="roteiro-bonito-ms-5-dias"]')).toBeVisible();
  expect(hydrationErrors).toEqual([]);
});
