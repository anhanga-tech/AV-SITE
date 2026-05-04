import { expect, test } from '@playwright/test';

test.describe('blog historical notice', () => {
  test('shows historical notice only on posts that define it', async ({ page }) => {
    await page.goto('/blog/destinos-carnaval-2026-brasil');

    await expect(page.getByRole('status')).toContainText(
      'Este artigo foi publicado para o Carnaval 2026.'
    );

    await page.goto('/blog/viagem-solo-feminina-ganha-espaco-nos-cruzeiros-da-norwegian-cruise-line');

    await expect(page.getByRole('status')).toHaveCount(0);
  });
});
