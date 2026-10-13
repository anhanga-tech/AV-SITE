import { test, expect } from '@playwright/test';

test('a política permite revogar comunicações de e-mail sem revelar se o cadastro existe', async ({ page }) => {
    await page.route('**/api/consent', async (route) => {
        await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ ok: true, effective: 'revoke', registered: false }),
        });
    });

    await page.goto('/politica-privacidade/#cookies');
    const form = page.getByRole('form', { name: 'Revogar comunicações por e-mail' });
    await expect(form).toBeVisible();
    await page.locator('#email-marketing-revoke').fill('titular@example.com');
    await page.getByRole('button', { name: 'Revogar comunicações' }).click();
    await expect(page.getByRole('status')).toContainText('Registramos o pedido de revogação');
    await expect(page.getByRole('status')).not.toContainText('encontramos');

    await page.screenshot({
        path: '/opt/cursor/artifacts/email-consent-revoke.png',
        fullPage: false,
    });
});
