import { expect, test } from '@playwright/test';

test.describe('blog historical notice', () => {
  test('shows historical notice only on posts that define it', async ({ page }) => {
    await page.goto('/blog/destinos-carnaval-2026-brasil');

    // Scoped to the notice's <p role="status">: the page also carries
    // sr-only aria-live regions (e.g. SocialShare's copy-link announcer)
    // that share the implicit "status" role but aren't the notice itself.
    await expect(page.locator('p[role="status"]')).toContainText(
      'Este artigo foi publicado para o Carnaval 2026.'
    );

    await page.goto('/blog/viagem-solo-feminina-ganha-espaco-nos-cruzeiros-da-norwegian-cruise-line');

    await expect(page.locator('p[role="status"]')).toHaveCount(0);
  });
});
