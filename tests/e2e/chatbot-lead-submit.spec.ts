import { expect, test } from '@playwright/test';
import { AIChat } from './pages/AIChat';
import { stubWhatsAppWindow } from './helpers/whatsappWindowStub';

async function acceptLgpd(page: import('@playwright/test').Page) {
  await page.locator('input[type="checkbox"]').first().evaluate((element) => {
    const input = element as HTMLInputElement;
    if (!input.checked) {
      input.click();
    }
  });
}

test.describe('Chatbot lead handoff', () => {
  test('should reuse the same event_id for dataLayer and submit payload', async ({ page }) => {
    let submitRequestCount = 0;
    let submitPayload: Record<string, unknown> | null = null;

    await stubWhatsAppWindow(page);

    await page.route('**/api/generate', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          text: 'Perfeito. Seu pré-atendimento está pronto. Preencha seus dados abaixo para continuar com nossa equipe.',
          handoff: {
            origin: 'São Paulo, SP',
            destination: 'Orlando, Flórida',
            dates: 'Julho de 2026',
            baggagePreference: '1 mala despachada',
            bantSummary: 'Need: Roteiro personalizado | Authority: Casal | Budget: R$ 15.000 | Timeline: 30 dias',
            iataCode: 'MCO',
            source: 'repair',
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
          warning: 'Acompanhamento será realizado por um canal alternativo.',
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
    await page.getByLabel('WhatsApp', { exact: true }).fill('11 98831-4487');
    await acceptLgpd(page);

    await page.getByRole('button', { name: 'Salvar e abrir WhatsApp' }).click();

    await expect(page.getByText('Salvando…')).toBeVisible();
    await expect.poll(() => submitRequestCount).toBe(1);
    await expect.poll(() => page.evaluate(() => window.__whatsappUrls?.length ?? 0)).toBe(1);
    await expect
      .poll(() =>
        page.evaluate(() =>
          (window.dataLayer || []).find((entry) =>
            entry && typeof entry === 'object' && 'event' in entry && entry.event === 'generate_lead'
          ) || null
        )
      )
      .not.toBeNull();

    const openedUrl = await page.evaluate(() => window.__whatsappUrls?.[0] ?? '');
    expect(decodeURIComponent(openedUrl)).toContain('wa.me/5511955021519');
    expect(decodeURIComponent(openedUrl)).toContain('Origem: São Paulo, SP');
    expect(decodeURIComponent(openedUrl)).not.toContain('+5511988314487');
    // O tracking desta sessão vai para o Odoo no payload de /api/submit-lead (asserções de
    // `payload.utms` / `payload.tracking` abaixo) e não pode viajar como conteúdo da mensagem
    // — ver docs/compliance/ripd-legitimo-interesse.md §3.1 "Limite de propagação".
    expect(decodeURIComponent(openedUrl)).not.toContain('Dados:');
    expect(decodeURIComponent(openedUrl)).not.toContain('gclid=test-gclid');

    const payload = submitPayload as unknown as Record<string, unknown>;
    expect(payload.firstName).toBe('Felipe');
    expect(payload.lastName).toBe('William');
    expect(payload.email).toBe('felipe@example.com');
    expect(payload.whatsapp).toBe('+5511988314487');
    expect(payload.destination).toBe('Orlando, Flórida');
    expect(payload.utms).toMatchObject({
      utm_source: 'google',
      utm_medium: 'cpc',
    });
    expect(payload.tracking).toMatchObject({
      gclid: 'test-gclid',
    });
    expect(typeof payload.event_id).toBe('string');
    expect(String(payload.event_id)).toMatch(/^lead_(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\d+_[a-z0-9]{6})$/);

    const generateLeadEvent = await page.evaluate(() =>
      (window.dataLayer || []).find((entry) =>
        entry && typeof entry === 'object' && 'event' in entry && entry.event === 'generate_lead'
      ) || null
    );
    expect(generateLeadEvent).toMatchObject({
      event: 'generate_lead',
      event_id: payload.event_id,
      destination: 'Orlando, Flórida',
      utm_source: 'google',
      utm_medium: 'cpc',
    });
    expect(generateLeadEvent).toHaveProperty('ga_client_id');
    expect(generateLeadEvent).toHaveProperty('ga_session_id');

    await expect
      .poll(() =>
        page.evaluate(() =>
          (window.dataLayer || []).find((entry) =>
            entry && typeof entry === 'object' && 'event' in entry && entry.event === 'form_submission'
          ) || null
        )
      )
      .toMatchObject({
      event: 'form_submission',
      form_type: 'ai_chatbot_lead',
      destination: 'whatsapp',
    });
  });

  test('should not open WhatsApp when lead submit fails', async ({ page }) => {
    let submitRequestCount = 0;
    let submitPayload: Record<string, unknown> | null = null;

    await stubWhatsAppWindow(page);

    await page.route('**/api/generate', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          text: 'Perfeito. Seu pré-atendimento está pronto. Preencha seus dados abaixo para continuar com nossa equipe.',
          handoff: {
            origin: 'São Paulo, SP',
            destination: 'Orlando, Flórida',
            dates: 'Julho de 2026',
            baggagePreference: '1 mala despachada',
            bantSummary: 'Need: Roteiro personalizado | Authority: Casal | Budget: R$ 15.000 | Timeline: 30 dias',
            iataCode: 'MCO',
            source: 'repair',
          },
        }),
      }),
    );

    await page.route('**/api/submit-lead', async route => {
      submitRequestCount += 1;
      submitPayload = JSON.parse(route.request().postData() || '{}') as Record<string, unknown>;
      await route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: false,
          requestId: 'req-e2e-fail',
          code: 'UPSTREAM_VALIDATION_ERROR',
          error: 'Falha ao processar o envio.',
        }),
      });
    });

    const aiChat = new AIChat(page);

    await page.goto('/');
    await aiChat.open();
    await aiChat.sendMessage('Quero uma viagem para Orlando');

    await expect(page.getByText('Link Gerado')).toBeVisible();
    await page.getByLabel('Nome', { exact: true }).fill('Felipe');
    await page.getByLabel('Sobrenome', { exact: true }).fill('William');
    await page.getByLabel('E-mail', { exact: true }).fill('felipe@example.com');
    await page.getByLabel('WhatsApp', { exact: true }).fill('11 98831-4487');
    await acceptLgpd(page);

    await page.getByRole('button', { name: 'Salvar e abrir WhatsApp' }).click();

    // Lead submission must complete before opening WhatsApp.
    await expect.poll(() => submitRequestCount).toBe(1);
    await expect.poll(() => page.evaluate(() => window.__whatsappUrls?.length ?? 0)).toBe(0);
    // The tab reserved synchronously on click must be closed, not left blank.
    await expect.poll(() => page.evaluate(() => window.__whatsappWindowClosed ?? 0)).toBe(1);
    await expect(page.getByRole('alert')).toHaveText('Não foi possível salvar seu contato. Tente novamente.');

    // The lead form ("Link Gerado") remains rendered after the failed submission.
    await expect(page.getByText('Link Gerado')).toBeVisible();

    await expect
      .poll(() =>
        page.evaluate(() =>
          (window.dataLayer || []).find((entry) =>
            entry && typeof entry === 'object' && 'event' in entry && entry.event === 'generate_lead'
          ) || null
        )
      )
      .not.toBeNull();

    const payload2 = submitPayload as unknown as Record<string, unknown>;
    expect(typeof payload2.event_id).toBe('string');
  });

  test('clicking the privacy policy link does not toggle the LGPD checkbox', async ({ page, context }) => {
    await page.route('**/api/generate', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          text: 'Perfeito. Seu pré-atendimento está pronto. Preencha seus dados abaixo para continuar com nossa equipe.',
          handoff: {
            origin: 'São Paulo, SP',
            destination: 'Orlando, Flórida',
            dates: 'Julho de 2026',
            baggagePreference: '1 mala despachada',
            bantSummary: 'Need: Roteiro personalizado | Authority: Casal | Budget: R$ 15.000 | Timeline: 30 dias',
            iataCode: 'MCO',
            source: 'repair',
          },
        }),
      }),
    );

    const aiChat = new AIChat(page);

    await page.goto('/');
    await aiChat.open();
    await aiChat.sendMessage('Quero uma viagem para Orlando');

    await expect(page.getByText('Link Gerado')).toBeVisible();

    const lgpdCheckbox = page.locator('input[type="checkbox"]').first();
    await expect(lgpdCheckbox).not.toBeChecked();

    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      aiChat.chatDialog.getByRole('link', { name: 'Política de Privacidade' }).last().click(),
    ]);
    await popup.close();

    await expect(lgpdCheckbox).not.toBeChecked();
  });
});
