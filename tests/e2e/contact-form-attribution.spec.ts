import { expect, test, type Page, type Route } from '@playwright/test';

/**
 * Boundary-level coverage for the contact form's request contract (issue #1141).
 * `contact-form.spec.ts` and `destructive-contact.spec.ts` already cover UI/UX and
 * XSS sanitization; this file asserts the actual `/api/submit-contact` request body —
 * the normalized attribution + identity payload the Odoo CRM mapping depends on
 * (`lib/odoo-lead-mapping.ts`'s `leadInputFromSubmitContact`).
 */

declare global {
  interface Window {
    __whatsappOpens?: unknown[][];
  }
}

async function stubWindowOpen(page: Page) {
  await page.addInitScript(() => {
    window.__whatsappOpens = [];
    Object.defineProperty(window, 'open', {
      configurable: true,
      value: (...args: unknown[]) => {
        window.__whatsappOpens?.push(args);
        return null;
      },
    });
  });
}

function captureSubmitContact(page: Page): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    page.route('**/api/submit-contact', async (route: Route) => {
      const payload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, requestId: 'req_attribution_e2e' }),
      });
      resolve(payload);
    });
  });
}

test.describe('Contact form attribution payload', () => {
  test('modal entry point sends the full UTM/click-id/source payload with the name split', async ({ page }) => {
    const payloadPromise = captureSubmitContact(page);

    await page.goto(
      '/?utm_source=instagram&utm_medium=cpc&utm_campaign=summer-sale&utm_term=viagem-europa&utm_content=creative-a&gclid=gclid-123&fbclid=fbclid-456',
    );

    await page.getByRole('button', { name: 'Falar com Especialista' }).click();
    const dialog = page.getByRole('dialog', { name: 'Fale com um especialista' });
    await expect(dialog).toBeVisible();

    await page.locator('#contact-firstName').fill('Maria Silva');
    await page.locator('#contact-whatsapp').fill('11987654321');
    await page.locator('#contact-email').fill('maria@example.com');
    await page.locator('#contact-optIn').check();
    await page.getByRole('button', { name: /^me chamem no whatsapp$/i }).click();

    const payload = await payloadPromise;

    expect(payload.firstName).toBe('Maria');
    expect(payload.lastName).toBe('Silva');
    expect(payload.whatsapp).toBe('+5511987654321');
    expect(payload.email).toBe('maria@example.com');
    expect(payload.emailOptIn).toBe(true);
    expect(payload.source).toBe('highlights');
    expect(payload.eventId).toMatch(/^lead_/);

    expect(payload.utms).toMatchObject({
      utm_source: 'instagram',
      utm_medium: 'cpc',
      utm_campaign: 'summer-sale',
      utm_term: 'viagem-europa',
      utm_content: 'creative-a',
    });
    expect(payload.tracking).toMatchObject({
      gclid: 'gclid-123',
      fbclid: 'fbclid-456',
    });
  });

  test('landing page entry point threads its destination alongside attribution', async ({ page }) => {
    const payloadPromise = captureSubmitContact(page);

    await page.goto('/orlando?utm_source=google&utm_medium=cpc&utm_campaign=orlando-launch');

    // The hero's "Solicitar Orçamento" CTA is the one that threads destination: 'Orlando'
    // alongside source: 'orlando' — other Orlando CTAs only set source.
    await page.getByRole('button', { name: /solicitar orçamento/i }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Fale com um especialista' });
    await expect(dialog).toBeVisible();

    await page.locator('#contact-firstName').fill('João Souza');
    await page.locator('#contact-whatsapp').fill('11988887777');
    await page.getByRole('button', { name: /^me chamem no whatsapp$/i }).click();

    const payload = await payloadPromise;

    expect(payload.firstName).toBe('João');
    expect(payload.lastName).toBe('Souza');
    expect(payload.source).toBe('orlando');
    expect(payload.destination).toBe('Orlando');
    expect(payload.utms).toMatchObject({
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'orlando-launch',
    });
  });

  test('inline CTA entry point sends its fixed source and the same attribution contract', async ({ page }) => {
    const payloadPromise = captureSubmitContact(page);

    await page.goto('/?utm_source=organic&utm_medium=referral#contato');
    await page.getByRole('button', { name: /solicitar meu orçamento/i }).click();

    await page.locator('#cta-firstName').fill('Ana Paula Reis');
    await page.locator('#cta-whatsapp').fill('11999998888');
    await page.getByRole('button', { name: /^me chamem$/i }).click();

    const payload = await payloadPromise;

    expect(payload.firstName).toBe('Ana');
    expect(payload.lastName).toBe('Paula Reis');
    expect(payload.whatsapp).toBe('+5511999998888');
    expect(payload.source).toBe('cta-homepage');
    expect(payload.utms).toMatchObject({
      utm_source: 'organic',
      utm_medium: 'referral',
    });
  });

  test('WhatsApp handoff still opens even when the CRM tracking request fails', async ({ page }) => {
    await stubWindowOpen(page);
    await page.route('**/api/submit-contact', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'boom' }) }),
    );

    await page.goto('/');
    await page.getByRole('button', { name: 'Falar com Especialista' }).click();
    const dialog = page.getByRole('dialog', { name: 'Fale com um especialista' });
    await expect(dialog).toBeVisible();

    await page.locator('#contact-firstName').fill('Carla Mendes');
    await page.locator('#contact-whatsapp').fill('11977776666');
    await page.getByRole('button', { name: /^chamar no whatsapp$/i }).click();

    // The WhatsApp tab opens regardless of whether the background CRM tracking call
    // succeeds — the visitor's path to a human must never depend on Odoo being up.
    await expect.poll(() => page.evaluate(() => window.__whatsappOpens?.length ?? 0)).toBeGreaterThan(0);
    const [openedUrl] = await page.evaluate(() => window.__whatsappOpens?.[0] ?? []);
    expect(String(openedUrl)).toContain('wa.me');

    await expect(dialog.getByText(/abrimos o whatsapp/i)).toBeVisible();
  });
});
