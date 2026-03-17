import { expect, test } from '@playwright/test';

async function acceptLgpd(page: import('@playwright/test').Page) {
  await page.locator('input[type="checkbox"]').first().evaluate((element) => {
    const input = element as HTMLInputElement;
    if (!input.checked) {
      input.click();
    }
  });
}

test.describe('Lollapalooza evergreen landing waitlist', () => {
  test('should redirect the legacy year route to the evergreen route', async ({ page }) => {
    await page.goto('/lollapalooza-2026');
    await expect(page).toHaveURL(/\/lollapalooza$/);
  });

  test('should capture a waitlist signup from the sold-out landing', async ({ page }) => {
    let submitPayload: Record<string, unknown> | null = null;

    await page.route('**/api/submit-waitlist', async route => {
      submitPayload = JSON.parse(route.request().postData() || '{}') as Record<string, unknown>;

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          requestId: 'req-waitlist-e2e',
          contactId: 'contact-waitlist-e2e',
          message: 'Cadastro realizado com sucesso na lista de espera.',
        }),
      });
    });

    await page.goto('/lollapalooza?utm_source=google&utm_medium=cpc&gclid=test-gclid');

    await page.getByRole('link', { name: /entrar na lista de espera/i }).first().click();

    await expect(page).toHaveURL(/\/lollapalooza(?:\?[^#]+)?#lista-de-espera$/);
    await expect(page.locator('h2', { hasText: /lolla 2027/i })).toBeVisible();

    await page.locator('#lolla-waitlist-name').fill('Felipe William');
    await page.locator('#lolla-waitlist-email').fill('felipe@example.com');
    await acceptLgpd(page);

    await page.getByRole('button', { name: /entrar na lista/i }).click();

    await expect(page.getByText(/você entrou na lista de espera/i)).toBeVisible();

    expect(submitPayload).not.toBeNull();
    expect(submitPayload).toMatchObject({
      name: 'Felipe William',
      email: 'felipe@example.com',
      sourcePage: '/lollapalooza',
      utms: {
        utm_source: 'google',
        utm_medium: 'cpc',
      },
      tracking: {
        gclid: 'test-gclid',
      },
    });

    await expect
      .poll(() =>
        page.evaluate(() =>
          (window.dataLayer || []).find((entry) =>
            entry && typeof entry === 'object' && 'event' in entry && entry.event === 'waitlist_signup'
          ) || null
        )
      )
      .toMatchObject({
        event: 'waitlist_signup',
        destination: 'Lollapalooza Brasil',
        interest_year: '2027',
        source_page: '/lollapalooza',
        utm_source: 'google',
        utm_medium: 'cpc',
      });
  });
});
