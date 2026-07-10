import { expect, test } from '@playwright/test';

test.describe('NPS form', () => {
  test('shows an invalid-link state and never renders the form when no token is present', async ({ page }) => {
    let submitCalls = 0;
    await page.route('**/api/submit-nps', route => {
      submitCalls += 1;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto('/nps?firstname=Ana');

    await expect(page.getByText('Link inválido')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Enviar avaliação$/i })).toHaveCount(0);
    expect(submitCalls).toBe(0);
  });

  test('submits token + score, with no identity fields on the page', async ({ page }) => {
    let submittedBody: Record<string, unknown> | undefined;
    await page.route('**/api/submit-nps', route => {
      submittedBody = JSON.parse(route.request().postData() ?? '{}');
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, requestId: 'test-request-id', message: 'Avaliação registrada com sucesso.' }),
      });
    });

    await page.goto('/nps?firstname=Ana&token=fake-signed-token');

    await expect(page.locator('#nps-firstname')).toHaveCount(0);
    await expect(page.locator('#nps-email')).toHaveCount(0);
    await expect(page.getByText('Olá, Ana!')).toBeVisible();

    await page.getByRole('button', { name: /^Nota 10/ }).click();
    await page.getByRole('button', { name: /^Enviar avaliação$/i }).click();

    await expect(page.getByText(/Enviar avaliação/i)).toHaveCount(0);
    expect(submittedBody?.token).toBe('fake-signed-token');
    expect(submittedBody?.score).toBe(10);
    expect(submittedBody).not.toHaveProperty('firstname');
    expect(submittedBody).not.toHaveProperty('email');
  });
});
