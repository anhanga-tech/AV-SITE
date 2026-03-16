import { test, expect } from '@playwright/test';
import { AIChat } from './pages/AIChat';

async function acceptLgpd(page: import('@playwright/test').Page) {
  await page.locator('input[type="checkbox"]').first().evaluate((element) => {
    const input = element as HTMLInputElement;
    if (!input.checked) {
      input.click();
    }
  });
}

test.describe('Destructive & Security Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept Gemini by default to avoid real API calls
    await page.route('**/api/generate', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          text: 'Roteiro pronto!',
          handoff: {
            destination: 'Paris',
            bantSummary: 'Budget: High',
            origin: 'São Paulo',
            dates: 'Janeiro 2026'
          },
        }),
      });
    });
  });

  test('should sanitize XSS payload in chatbot message input', async ({ page }) => {
    const aiChat = new AIChat(page);
    const xssPayload = '<img src=x onerror=alert(1)>';

    await page.goto('/');
    await aiChat.open();
    await aiChat.sendMessage(xssPayload);

    const messageLocator = aiChat.chatDialog.getByTestId('chat-user-message').last();
    await expect(messageLocator).toContainText(xssPayload);
  });

  test('should sanitize XSS payload in Lead Form fields for API submission', async ({ page }) => {
    const aiChat = new AIChat(page);
    const xssPayload = '<script>console.log("pwned")</script>';
    let submitPayload: any = null;

    await page.route('**/api/submit-lead', async route => {
      submitPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, contactId: '123', requestId: 'req-1' }),
      });
    });

    await page.goto('/');
    await page.evaluate(() => {
      window.open = () => ({}) as any;
    });

    await aiChat.open();
    await aiChat.sendMessage('Quero ir para Paris');

    await expect(page.getByText('Link Gerado')).toBeVisible();

    await page.locator('input[placeholder="Nome"]').fill(xssPayload);
    await page.locator('input[placeholder="Sobrenome"]').fill('Test');
    await page.locator('input[placeholder="E-mail"]').fill('test@example.com');
    await acceptLgpd(page);

    await page.getByRole('button', { name: 'Salvar e abrir WhatsApp' }).click();

    await expect.poll(() => submitPayload, { timeout: 15000 }).not.toBeNull();
    // Verified: Now frontend also sanitizes before sending to API
    expect(submitPayload.firstName).toBe('&lt;script&gt;console.log("pwned")&lt;/script&gt;');
  });

  test('should prevent multiple lead submissions on rage clicking', async ({ page }) => {
    const aiChat = new AIChat(page);
    let submissionCount = 0;

    await page.route('**/api/submit-lead', async route => {
      submissionCount++;
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto('/');
    await page.evaluate(() => {
      window.open = () => ({}) as any;
    });

    await aiChat.open();
    await aiChat.sendMessage('Quero ir para Paris');
    await expect(page.getByText('Link Gerado')).toBeVisible();

    await page.locator('input[placeholder="Nome"]').fill('Rage');
    await page.locator('input[placeholder="Sobrenome"]').fill('Tester');
    await page.locator('input[placeholder="E-mail"]').fill('rage@test.com');
    await acceptLgpd(page);

    const submitBtn = page.getByRole('button', { name: 'Salvar e abrir WhatsApp' });

    // Multiple rapid clicks via evaluate to ensure we hit the DOM directly
    await submitBtn.evaluate(node => {
      (node as HTMLButtonElement).click();
      (node as HTMLButtonElement).click();
      (node as HTMLButtonElement).click();
    });

    // Wait for at least one request to finish
    await page.waitForResponse('**/api/submit-lead');

    expect(submissionCount).toBe(1);
  });

  test('should validate lead form fields', async ({ page }) => {
    const aiChat = new AIChat(page);

    await page.goto('/');
    await page.evaluate(() => {
      window.open = () => ({}) as any;
    });

    await aiChat.open();
    await aiChat.sendMessage('Quero ir para Paris');
    await expect(page.getByText('Link Gerado')).toBeVisible();

    const submitBtn = page.locator('button:has-text("Salvar e abrir WhatsApp")');

    // Empty fields
    await submitBtn.click();
    await expect(page.getByText('Campo obrigatório').first()).toBeVisible();

    // Invalid email
    await page.locator('input[placeholder="E-mail"]').fill('not-an-email');
    await submitBtn.click();
    await expect(page.getByText('E-mail inválido')).toBeVisible();

    // No LGPD
    await page.locator('input[placeholder="Nome"]').fill('Valid');
    await page.locator('input[placeholder="Sobrenome"]').fill('Name');
    await page.locator('input[placeholder="E-mail"]').fill('test@test.com');
    await submitBtn.click();
    await expect(page.getByText('Você deve aceitar os termos')).toBeVisible();
  });
});
