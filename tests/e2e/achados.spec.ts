import { test, expect, type Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } }); // mobile-first: o tráfego vem do Instagram

// Os achados vencem por data (lib/achados.ts) e o servidor de teste usa a data de hoje, então
// os testes cobrem os dois estados possíveis em vez de presumir que há oferta no ar. O seletor
// casa tanto o CTA de um card (`achados-<id>`) quanto o do estado vazio (`achados-vazio`):
// os dois passam pelo ContactModal, então o fluxo de lead é exercido com ou sem oferta ativa.
const CTA_SELECTOR = '[data-tracking^="achados-"]';

async function mockSubmitContact(page: Page) {
    const requests: import('../../types/contactCapture').SubmitContactRequest[] = [];
    await page.route('**/api/submit-contact', (route) => {
        requests.push(route.request().postDataJSON());
        return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ ok: true, requestId: 'req_achados_e2e' }),
        });
    });
    return requests;
}

test('o CTA de achado grava o lead com a origem da oferta antes de abrir o WhatsApp', async ({ page }) => {
    const requests = await mockSubmitContact(page);
    await page.addInitScript(() => {
        Object.defineProperty(window, 'open', { configurable: true, value: () => null });
    });
    await page.goto('/achados');

    await expect(page.getByRole('heading', { level: 1, name: 'Achados da quinzena' })).toBeVisible();

    const cta = page.locator(CTA_SELECTOR).first();
    await expect(cta).toHaveAttribute('href', /wa\.me/);
    await expect(cta).toHaveAttribute('data-no-whatsapp-cta');
    const trackingId = await cta.getAttribute('data-tracking');

    await cta.click();
    await expect(page.getByRole('dialog', { name: 'Fale com um consultor' })).toBeVisible();
    await page.locator('#contact-firstName').fill('Maria');
    await page.locator('#contact-whatsapp').fill('11987654321');
    await page.getByRole('button', { name: /^abrir whatsapp agora$/i }).click();

    await expect(page.getByText(/recebemos seu contato/i)).toBeVisible();
    expect(requests).toHaveLength(1);
    expect(requests[0].source).toBe(trackingId);
});

test('o /links só mostra o atalho de achados quando a página tem oferta no ar', async ({ page }) => {
    await page.goto('/achados');
    await expect(page.getByRole('heading', { level: 1, name: 'Achados da quinzena' })).toBeVisible();
    const hasAchados = (await page.getByTestId('achado-card').count()) > 0;

    await page.goto('/links');
    await expect(page.getByTestId('link-whatsapp')).toBeVisible();
    const achadosLink = page.getByTestId('link-achados');

    if (hasAchados) {
        await expect(achadosLink).toBeVisible();
        await achadosLink.click();
        await expect(page).toHaveURL(/\/achados/);
    } else {
        await expect(achadosLink).toHaveCount(0);
    }
});
