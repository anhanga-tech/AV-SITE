import { test, expect } from '@playwright/test';
import { ContactModal } from './pages/ContactModal';

test.describe('Contact Modal Destructive Tests', () => {
  let contactModal: ContactModal;

  test.beforeEach(async ({ page }) => {
    contactModal = new ContactModal(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Falar com especialista' }).click();
    await contactModal.expectVisible();
  });

  test('should sanitize XSS in contact form', async ({ page }) => {
    await contactModal.fillForm({
      firstName: '<b>Felipe</b>',
      whatsapp: '11988314487'
    });

    await page.route('**/api/submit-contact', route => {
      const payload = route.request().postDataJSON();
      expect(payload.firstName).not.toContain('<b>');
      return route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
    });

    await contactModal.submitWhatsApp();
  });

  test('should prevent duplicate contact submissions', async ({ page }) => {
    await contactModal.fillForm({
      firstName: 'Double',
      whatsapp: '11988314487'
    });

    let requestCount = 0;
    await page.route('**/api/submit-contact', async (route) => {
      requestCount++;
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
    });

    await contactModal.whatsappSubmitBtn.click({ clickCount: 3, delay: 50 });
    expect(requestCount).toBe(1);
  });

  test('should handle API failure in contact modal', async ({ page }) => {
    await contactModal.fillForm({
      firstName: 'Failure',
      whatsapp: '11988314487'
    });

    await page.route('**/api/submit-contact', route =>
      route.fulfill({ status: 500, body: JSON.stringify({ ok: false, error: 'Erro de teste' }) })
    );

    await contactModal.callbackSubmitBtn.click();
    await expect(contactModal.modal.getByRole('alert')).toBeVisible();
  });
});
