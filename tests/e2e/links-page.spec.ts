import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } }); // mobile-first

test.beforeEach(async ({ page }) => {
    // dataLayer determinístico (GTM não carrega em localhost pelo gate de host).
    await page.addInitScript(() => {
        (window as unknown as { dataLayer: unknown[] }).dataLayer = [];
    });
});

test('renderiza a página /links com banner, botões e selos', async ({ page }) => {
    await page.goto('/links');
    await expect(page.getByRole('img', { name: 'Anhangá Viagens' })).toBeVisible();
    await expect(page.getByTestId('links-banner')).toBeVisible();
    await expect(page.getByTestId('link-whatsapp')).toBeVisible();
    await expect(page.getByText('Membro ABAV')).toBeVisible();
});

test('links_page_view é empurrado no dataLayer no load', async ({ page }) => {
    await page.goto('/links');
    await page.waitForFunction(() =>
        (window as unknown as { dataLayer?: Array<{ event?: string }> }).dataLayer
            ?.some((e) => e.event === 'links_page_view'),
    );
    const events = await page.evaluate(() =>
        (window as unknown as { dataLayer: Array<{ event?: string }> }).dataLayer
            .filter((e) => e.event === 'links_page_view'),
    );
    expect(events.length).toBeGreaterThanOrEqual(1);
});

test('clique dispara links_page_click com o label correto', async ({ page }) => {
    await page.goto('/links');
    // Usa um link INTERNO (orlando): React Router navega client-side, sem rede externa,
    // e preserva window.dataLayer para a asserção. Não clicar em links external (hit de rede + flaky).
    await page.getByTestId('link-orlando').click();
    await page.waitForFunction(() =>
        (window as unknown as { dataLayer?: Array<{ event?: string; label?: string }> }).dataLayer
            ?.some((e) => e.event === 'links_page_click' && e.label === 'orlando'),
    );
    const clicks = await page.evaluate(() =>
        (window as unknown as { dataLayer: Array<{ event?: string; label?: string }> }).dataLayer
            .filter((e) => e.event === 'links_page_click'),
    );
    expect(clicks.some((c) => c.label === 'orlando')).toBe(true);
});

test('não renderiza o assistente virtual (AIChat) na página standalone', async ({ page }) => {
    await page.goto('/links');
    await expect(page.getByTestId('link-whatsapp')).toBeVisible();
    // /links é página de bio standalone — o FAB do AIChat não deve aparecer (cobriria os selos
    // e competiria com os destinos curados). Ver ROUTES_WITHOUT_AICHAT em App.tsx.
    await expect(page.getByRole('button', { name: 'Abrir assistente virtual' })).toHaveCount(0);

    // Também não deve renderizar com barra no final (trailing slash, comum em links de bio).
    await page.goto('/links/');
    await expect(page.getByTestId('link-whatsapp')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Abrir assistente virtual' })).toHaveCount(0);
});

test('botão WhatsApp aponta para wa.me com texto', async ({ page }) => {
    await page.goto('/links');
    const href = await page.getByTestId('link-whatsapp').getAttribute('href');
    expect(href).toContain('wa.me/551152833309');
    expect(href).toContain('text=');
});
