import { test, expect } from '@playwright/test';
import type { SubmitLeadRequest } from '../../types/leadCapture';
import { BrazilPromotionDayPage } from './pages/BrazilPromotionDayPage';

test.describe('Brazil Promotion Day Landing Page', () => {
  test('should verify tracking events on landing view', async ({ page }) => {
    const landing = new BrazilPromotionDayPage(page);
    await landing.goto();

    const landingViewEvent = await page.evaluate(() =>
      (window.dataLayer || []).find(e => e.event === 'landing_view')
    );

    expect(landingViewEvent).toMatchObject({
      event: 'landing_view',
      campaign: 'brazil-promotion-day-2026',
      landing_type: 'event_qr',
    });
  });

  test('should validate required fields in the lead form', async ({ page }) => {
    const landing = new BrazilPromotionDayPage(page);
    await landing.goto();

    // Submit empty form
    await landing.submit();

    // The browser validation might kick in first, or the app logic
    // Based on BrazilPromotionDayLanding.tsx, it uses 'noValidate' on the form
    // but relies on useLeadCapture validation which returns an error string.
    await landing.expectError('Preencha todos os campos obrigatórios');
  });

  test('should capture lead successfully and trigger dataLayer events', async ({ page }) => {
    const landing = new BrazilPromotionDayPage(page);
    let submitPayload: SubmitLeadRequest | null = null;

    // Intercept API
    await page.route('**/api/submit-lead', async route => {
      submitPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, requestId: 'brazil-qr-123' }),
      });
    });

    await landing.goto();
    await landing.fillForm({
      firstName: 'Teste',
      lastName: 'QR',
      email: 'qr@test.com',
      whatsapp: '(11) 98831-4487',
      destination: 'Japão',
    });

    await landing.submit();

    await landing.expectSuccess();

    // Verify Payload
    expect(submitPayload).toMatchObject({
      firstName: 'Teste',
      lastName: 'QR',
      email: 'qr@test.com',
      whatsapp: '+5511988314487',
      destination: 'Japão',
    });
    expect(submitPayload?.bantSummary).toContain('Brazil Promotion Day 2026');

    // Verify dataLayer
    const generateLeadEvent = await page.evaluate(() =>
      (window.dataLayer || []).find(e => e.event === 'generate_lead')
    );
    expect(generateLeadEvent).toMatchObject({
      event: 'generate_lead',
      destination: 'Japão',
    });

    const formSubmissionEvent = await page.evaluate(() =>
      (window.dataLayer || []).find(e => e.event === 'form_submission')
    );
    expect(formSubmissionEvent).toMatchObject({
      event: 'form_submission',
      form_type: 'event_lead',
    });
  });

  test('should handle navigation to #contato anchor', async ({ page, isMobile }) => {
    const landing = new BrazilPromotionDayPage(page);
    await landing.goto();

    await landing.contactAnchor.click();

    // Check if URL ends with #contato
    await expect(page).toHaveURL(/#contato$/);

    // Wait for scroll to stabilize
    await page.waitForLoadState('networkidle');

    if (isMobile) {
      // On mobile, smooth scroll might not land perfectly on the input.
      // We check if the section is visible instead, as the form might be further down.
      await expect(page.locator('#contato')).toBeInViewport();
    } else {
      // Check if form is visible
      await expect(landing.firstNameInput).toBeInViewport();
    }
  });
});
