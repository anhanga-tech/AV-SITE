import { expect, test } from '@playwright/test';

test.describe('NPS form', () => {
  test('bloqueia submit com e-mail inválido vindo da URL e exibe campo editável', async ({ page }) => {
    let submitCalls = 0;
    await page.route('**/api/submit-nps', route => {
      submitCalls += 1;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto('/nps?firstname=Ana&email=cliente@');

    const emailInput = page.locator('#nps-email');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveValue('cliente@');

    await page.getByRole('button', { name: /^Nota 10/ }).click();
    await page.getByRole('button', { name: /^Enviar avaliação$/i }).click();

    await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText('Informe um e-mail válido.')).toBeVisible();
    expect(submitCalls).toBe(0);
  });
});
