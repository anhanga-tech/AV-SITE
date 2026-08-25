import { expect, test, type Page } from '@playwright/test';
import type { SubmitContactRequest } from '../../types/contactCapture';

const capturedSubmitContactRequests = new WeakMap<Page, SubmitContactRequest[]>();

async function mockSubmitContact(page: Page) {
  const capturedRequests: SubmitContactRequest[] = [];
  capturedSubmitContactRequests.set(page, capturedRequests);

  await page.route('**/api/submit-contact', route => {
    capturedRequests.push(route.request().postDataJSON() as SubmitContactRequest);

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, requestId: 'req_contact_e2e' }),
    });
  });
}

async function openHeaderContactModal(page: Page, isMobile: boolean) {
  if (isMobile) {
    await page.locator('button[aria-label="Abrir menu"]').click();
    await page.getByTestId('mobile-fale-conosco-btn').click();
    return;
  }

  await page.getByTestId('desktop-fale-conosco-btn').click();
}

const contactDialog = (page: Page) =>
  page.getByRole('dialog', { name: 'Fale com um consultor' });

test.describe('Contact form modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'open', {
        configurable: true,
        value: () => null,
      });
    });
    await mockSubmitContact(page);
    await page.goto('/');
  });

  test('abre o modal ao clicar no CTA do Header', async ({ page, isMobile }) => {
    await openHeaderContactModal(page, isMobile);

    await expect(contactDialog(page)).toBeVisible();
    await expect(page.locator('#contact-firstName')).toBeFocused();
  });

  test('mantém botões desabilitados com campos vazios', async ({ page, isMobile }) => {
    await openHeaderContactModal(page, isMobile);

    await expect(page.getByRole('button', { name: /^abrir whatsapp agora$/i })).toBeDisabled();
    await expect(page.getByRole('button', { name: /^prefiro que me chamem$/i })).toBeDisabled();
  });

  test('habilita botões após preencher nome e WhatsApp', async ({ page, isMobile }) => {
    await openHeaderContactModal(page, isMobile);

    await page.locator('#contact-firstName').fill('Maria');
    await page.locator('#contact-whatsapp').fill('11987654321');

    await expect(page.getByRole('button', { name: /^abrir whatsapp agora$/i })).toBeEnabled();
    await expect(page.getByRole('button', { name: /^prefiro que me chamem$/i })).toBeEnabled();
  });

  test('bloqueia envio com e-mail inválido após clique e mantém dados editáveis', async ({ page, isMobile }) => {
    await openHeaderContactModal(page, isMobile);

    await page.locator('#contact-firstName').fill('Maria');
    await page.locator('#contact-whatsapp').fill('11987654321');
    await page.locator('#contact-email').fill('maria@');

    const callbackButton = page.getByRole('button', { name: /^prefiro que me chamem$/i });
    await expect(callbackButton).toBeEnabled();
    await callbackButton.click();

    await expect(page.locator('#contact-email')).toHaveAttribute('aria-invalid', 'true');
    await expect(contactDialog(page).getByText('Informe um e-mail válido ou deixe em branco.')).toBeVisible();
    await expect(page.getByText(/recebemos seu contato/i)).not.toBeVisible();
  });

  test('envia o pedido de retorno e exibe confirmação', async ({ page, isMobile }) => {
    await page.goto('/?utm_source=google&utm_medium=cpc&utm_campaign=issue-1261');
    await openHeaderContactModal(page, isMobile);

    await page.locator('#contact-firstName').fill('Maria');
    await page.locator('#contact-whatsapp').fill('11987654321');
    await page.getByRole('button', { name: /^prefiro que me chamem$/i }).click();

    await expect(page.getByText(/recebemos seu contato/i)).toBeVisible();
    await expect(page.getByText('Nossa equipe chama você em breve pelo WhatsApp.')).toBeVisible();
    await expect(contactDialog(page).getByRole('status')).toContainText(/recebemos seu contato/i);
    await expect(contactDialog(page).getByRole('button', { name: /^fechar$/i }).last()).toBeFocused();

    const generateLeadEvents = await page.evaluate(() =>
      window.dataLayer?.filter((entry) => entry.event === 'generate_lead') ?? [],
    );
    const [submittedRequest] = capturedSubmitContactRequests.get(page) ?? [];

    expect(submittedRequest).toBeDefined();
    expect(generateLeadEvents).toHaveLength(1);
    expect(generateLeadEvents[0]).toMatchObject({
      event: 'generate_lead',
      event_id: submittedRequest.eventId,
      destination: 'callback',
      utm_source: submittedRequest.utms.utm_source,
      utm_medium: submittedRequest.utms.utm_medium,
      utm_campaign: submittedRequest.utms.utm_campaign,
      ga_client_id: submittedRequest.tracking?.cid,
      ga_session_id: submittedRequest.tracking?.sid,
    });
    expect(generateLeadEvents[0]?.event_id).toMatch(/^lead_/);
  });

  test('não gera conversão quando a API rejeita o contato', async ({ page, isMobile }) => {
    await page.unroute('**/api/submit-contact');
    await page.route('**/api/submit-contact', route =>
      route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: false,
          error: 'Não foi possível enviar. Tente novamente.',
          code: 'CRM_UNAVAILABLE',
        }),
      }),
    );
    await openHeaderContactModal(page, isMobile);

    await page.locator('#contact-firstName').fill('Maria');
    await page.locator('#contact-whatsapp').fill('11987654321');
    await page.getByRole('button', { name: /^prefiro que me chamem$/i }).click();

    await expect(
      contactDialog(page).getByText('Não foi possível enviar. Tente novamente.'),
    ).toBeVisible();
    const generateLeadEvents = await page.evaluate(() =>
      window.dataLayer?.filter((entry) => entry.event === 'generate_lead') ?? [],
    );
    expect(generateLeadEvents).toHaveLength(0);
  });

  test('não gera conversão quando a requisição falha na rede', async ({ page, isMobile }) => {
    await page.unroute('**/api/submit-contact');
    await page.route('**/api/submit-contact', route => route.abort('failed'));
    await openHeaderContactModal(page, isMobile);

    await page.locator('#contact-firstName').fill('Maria');
    await page.locator('#contact-whatsapp').fill('11987654321');
    await page.getByRole('button', { name: /^prefiro que me chamem$/i }).click();

    await expect(
      contactDialog(page).getByText('Erro de conexão. Verifique sua internet e tente novamente.'),
    ).toBeVisible();
    const generateLeadEvents = await page.evaluate(() =>
      window.dataLayer?.filter((entry) => entry.event === 'generate_lead') ?? [],
    );
    expect(generateLeadEvents).toHaveLength(0);
  });

  test('envia o caminho principal ao pressionar Enter', async ({ page, isMobile }) => {
    await openHeaderContactModal(page, isMobile);

    await page.locator('#contact-firstName').fill('Maria');
    await page.locator('#contact-whatsapp').fill('11987654321');
    await page.locator('#contact-whatsapp').press('Enter');

    await expect(page.getByText(/recebemos seu contato/i)).toBeVisible();
    await expect(page.getByText('Seu contato foi salvo. O navegador bloqueou a abertura automática do WhatsApp.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Abrir WhatsApp' })).toHaveAttribute('href', /wa\.me/);

    const generateLeadEvents = await page.evaluate(() =>
      window.dataLayer?.filter((entry) => entry.event === 'generate_lead') ?? [],
    );
    const [submittedRequest] = capturedSubmitContactRequests.get(page) ?? [];

    expect(submittedRequest).toBeDefined();
    expect(generateLeadEvents).toHaveLength(1);
    expect(generateLeadEvents[0]).toMatchObject({
      event: 'generate_lead',
      event_id: submittedRequest.eventId,
      destination: 'whatsapp',
    });
  });

  test('não gera conversão no caminho WhatsApp quando a API rejeita o contato', async ({
    page,
    isMobile,
  }) => {
    await page.unroute('**/api/submit-contact');
    await page.route('**/api/submit-contact', route =>
      route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: false,
          error: 'Não foi possível enviar. Tente novamente.',
          code: 'CRM_UNAVAILABLE',
        }),
      }),
    );
    await openHeaderContactModal(page, isMobile);

    await page.locator('#contact-firstName').fill('Maria');
    await page.locator('#contact-whatsapp').fill('11987654321');
    await page.locator('#contact-whatsapp').press('Enter');

    await expect(page.getByText('Não foi possível enviar. Tente novamente.')).toBeVisible();
    await expect(page.getByText('Recebemos seu contato!')).not.toBeVisible();
    const generateLeadEvents = await page.evaluate(() =>
      window.dataLayer?.filter((entry) => entry.event === 'generate_lead') ?? [],
    );
    expect(generateLeadEvents).toHaveLength(0);
  });

  test('fecha com tecla Escape', async ({ page, isMobile }) => {
    await openHeaderContactModal(page, isMobile);
    await expect(contactDialog(page)).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(contactDialog(page)).not.toBeVisible();
  });

  test('fecha ao clicar no overlay', async ({ page, isMobile }) => {
    await openHeaderContactModal(page, isMobile);
    await expect(contactDialog(page)).toBeVisible();

    await page.mouse.click(10, 10);

    await expect(contactDialog(page)).not.toBeVisible();
  });

  test('exibe aviso de transparência e link para política de privacidade', async ({ page, isMobile }) => {
    await openHeaderContactModal(page, isMobile);

    const dialog = contactDialog(page);
    await expect(dialog.getByText(/registrados em nosso crm/i)).toBeVisible();
    await expect(dialog.getByRole('link', { name: /política de privacidade/i })).toHaveAttribute(
      'href',
      '/politica-privacidade/',
    );
  });
});

test.describe('CallToAction inline form', () => {
  test.beforeEach(async ({ page }) => {
    await mockSubmitContact(page);
    await page.goto('/#contato');
  });

  test('expande formulário ao clicar em "Solicitar meu Orçamento"', async ({ page }) => {
    // O click do Playwright já rola até o alvo e aguarda actionability/estabilidade.
    // Rolar o container #contato antes desacopla o elemento se a seção re-renderiza
    // entre o scroll e a ação (flaky em firefox/webkit) — agir direto no botão evita
    // a janela de detach.
    await page.getByRole('button', { name: /solicitar meu orçamento/i }).click();

    await expect(page.locator('#cta-firstName')).toBeVisible();
  });

  test('exibe confirmação após "Me chamem"', async ({ page }) => {
    await page.getByRole('button', { name: /solicitar meu orçamento/i }).click();

    await page.locator('#cta-firstName').fill('João');
    await page.locator('#cta-whatsapp').fill('11999998888');
    await page.getByRole('button', { name: /^me chamem$/i }).click();

    await expect(page.getByText(/recebemos/i)).toBeVisible();
  });
});
