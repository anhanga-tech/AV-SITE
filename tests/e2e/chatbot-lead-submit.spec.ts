import { expect, test } from '@playwright/test';
import { AIChat } from './pages/AIChat';

declare global {
  interface Window {
    __openedUrls?: string[];
  }
}

test.describe('Chatbot lead handoff', () => {
  test('should open WhatsApp before the HubSpot submit completes', async ({ page }) => {
    let submitRequestCount = 0;
    let submitPayload: Record<string, unknown> | null = null;

    await page.addInitScript(() => {
      window.__openedUrls = [];

      Object.defineProperty(window, 'open', {
        configurable: true,
        value: (url?: string | URL) => {
          window.__openedUrls?.push(String(url || ''));
          return {} as Window;
        },
      });
    });

    await page.route('**/api/generate', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          text: 'Prontinho! Preparei seu link direto para o WhatsApp.',
          functionCall: {
            name: 'generate_budget_link',
            args: {
              destination: 'Orlando',
              destination_city: 'Orlando',
              destination_region: 'Flórida',
              origin_city: 'São Paulo',
              origin_region: 'SP',
              dates: 'Julho de 2026',
              need_summary: 'Roteiro personalizado',
              decision_role: 'Casal',
              timeline_window: '30 dias',
              budget_range: 'R$ 15.000',
              baggage_preference: '1 mala despachada',
              iata_code: 'MCO',
            },
          },
        }),
      }),
    );

    await page.route('**/api/submit-lead', async route => {
      submitRequestCount += 1;
      submitPayload = JSON.parse(route.request().postData() || '{}') as Record<string, unknown>;

      await new Promise((resolve) => setTimeout(resolve, 700));

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          requestId: 'req-e2e-1',
          contactId: 'contact-e2e-1',
          dealId: 'deal-e2e-1',
          message: 'Contato e deal criados com sucesso no HubSpot.',
        }),
      });
    });

    const aiChat = new AIChat(page);

    await page.goto('/?utm_source=google&utm_medium=cpc&gclid=test-gclid');
    await aiChat.open();
    await aiChat.sendMessage('Quero uma viagem para Orlando');

    await expect(page.getByText('Link Gerado')).toBeVisible();
    await page.getByLabel('Nome', { exact: true }).fill('Felipe');
    await page.getByLabel('Sobrenome', { exact: true }).fill('William');
    await page.getByLabel('E-mail', { exact: true }).fill('felipe@example.com');
    await page.getByRole('checkbox', { name: /Aceito receber comunicações/i }).check({ force: true });

    await page.getByRole('button', { name: 'Abrir WhatsApp' }).click();

    await expect(page.getByText('Salvando...')).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.__openedUrls?.length ?? 0)).toBe(1);
    await expect.poll(() => submitRequestCount).toBe(1);

    const openedUrl = await page.evaluate(() => window.__openedUrls?.[0] ?? '');
    expect(decodeURIComponent(openedUrl)).toContain('wa.me/551152833309');
    expect(decodeURIComponent(openedUrl)).toContain('Origem: São Paulo, SP');
    expect(decodeURIComponent(openedUrl)).toContain('Dados: utm_source=google');
    expect(decodeURIComponent(openedUrl)).toContain('gclid=test-gclid');

    expect(submitPayload).not.toBeNull();
    expect(submitPayload?.firstName).toBe('Felipe');
    expect(submitPayload?.lastName).toBe('William');
    expect(submitPayload?.email).toBe('felipe@example.com');
    expect(submitPayload?.destination).toBe('Orlando, Flórida');
    expect(submitPayload?.utms).toMatchObject({
      utm_source: 'google',
      utm_medium: 'cpc',
    });
    expect(submitPayload?.tracking).toMatchObject({
      gclid: 'test-gclid',
    });
  });
});
