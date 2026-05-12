import { expect, test, type Page } from '@playwright/test';

async function mockSubmitContact(page: Page) {
  await page.route('**/api/submit-contact', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, requestId: 'req_contact_e2e' }),
    }),
  );
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
  page.getByRole('dialog', { name: 'Fale com um especialista' });

test.describe('Contact form modal', () => {
  test.beforeEach(async ({ page }) => {
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

    await expect(page.getByRole('button', { name: /^chamar no whatsapp$/i })).toBeDisabled();
    await expect(page.getByRole('button', { name: /^me chamem no whatsapp$/i })).toBeDisabled();
  });

  test('habilita botões após preencher nome e WhatsApp', async ({ page, isMobile }) => {
    await openHeaderContactModal(page, isMobile);

    await page.locator('#contact-firstName').fill('Maria');
    await page.locator('#contact-whatsapp').fill('11987654321');

    await expect(page.getByRole('button', { name: /^chamar no whatsapp$/i })).toBeEnabled();
    await expect(page.getByRole('button', { name: /^me chamem no whatsapp$/i })).toBeEnabled();
  });

  test('envia o pedido de retorno e exibe confirmação', async ({ page, isMobile }) => {
    await openHeaderContactModal(page, isMobile);

    await page.locator('#contact-firstName').fill('Maria');
    await page.locator('#contact-whatsapp').fill('11987654321');
    await page.getByRole('button', { name: /^me chamem no whatsapp$/i }).click();

    await expect(page.getByText(/recebemos seu contato/i)).toBeVisible();
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
});

test.describe('CallToAction inline form', () => {
  test.beforeEach(async ({ page }) => {
    await mockSubmitContact(page);
    await page.goto('/#contato');
  });

  test('expande formulário ao clicar em "Solicitar meu Orçamento"', async ({ page }) => {
    await page.locator('#contato').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: /solicitar meu orçamento/i }).click();

    await expect(page.locator('#cta-firstName')).toBeVisible();
  });

  test('exibe confirmação após "Me chamem"', async ({ page }) => {
    await page.locator('#contato').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: /solicitar meu orçamento/i }).click();

    await page.locator('#cta-firstName').fill('João');
    await page.locator('#cta-whatsapp').fill('11999998888');
    await page.getByRole('button', { name: /^me chamem$/i }).click();

    await expect(page.getByText(/recebemos/i)).toBeVisible();
  });
});
