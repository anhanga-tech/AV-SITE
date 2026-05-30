import { test, expect } from '@playwright/test';
import type { SubmitLeadRequest } from '../../types/leadCapture';
import { CorporativoPage } from './pages/CorporativoPage';

test.describe('Corporativo Landing Page', () => {
  test('should push correct dataLayer event on landing view', async ({ page }) => {
    const landing = new CorporativoPage(page);
    await landing.goto();

    await expect
      .poll(() =>
        page.evaluate(() =>
          (window.dataLayer || []).find(
            e => e && typeof e === 'object' && 'event' in e && e.event === 'landing_view'
          ) || null
        )
      )
      .toMatchObject({
        event: 'landing_view',
        campaign: 'corporativo',
        landing_type: 'b2b',
      });
  });

  test('should validate required fields in the lead form', async ({ page }) => {
    const landing = new CorporativoPage(page);
    await landing.goto();

    await landing.submit();

    await landing.expectError('Preencha todos os campos obrigatórios');
  });

  test('should capture corporate lead and trigger dataLayer events', async ({ page }) => {
    const landing = new CorporativoPage(page);
    let submitPayload: SubmitLeadRequest | null = null;

    await page.route('**/api/submit-lead', async route => {
      submitPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, requestId: 'corp-123' }),
      });
    });

    await landing.goto();
    await landing.fillForm({
      firstName: 'Maria',
      lastName: 'Santos',
      email: 'maria@empresa.com.br',
      whatsapp: '(11) 98831-4487',
      empresa: 'Empresa Teste LTDA',
      cargo: 'Sócia',
    });

    await landing.submit();

    await landing.expectSuccess();

    const safePayload = submitPayload as unknown as SubmitLeadRequest;
    expect(safePayload).toMatchObject({
      firstName: 'Maria',
      lastName: 'Santos',
      email: 'maria@empresa.com.br',
      whatsapp: '+5511988314487',
      destination: 'Corporativo',
    });
    expect(safePayload.bantSummary).toContain('Lead corporativo');
    expect(safePayload.bantSummary).toContain('Empresa Teste LTDA');
    expect(safePayload.bantSummary).toContain('Sócia');

    const formSubmissionEvent = await page.evaluate(() =>
      (window.dataLayer || []).find(e => e.event === 'form_submission')
    );
    expect(formSubmissionEvent).toMatchObject({
      event: 'form_submission',
      form_type: 'corporate_lead',
    });
  });

  test('should handle navigation to #contato anchor', async ({ page, isMobile }) => {
    const landing = new CorporativoPage(page);
    await landing.goto();

    await landing.contactAnchor.click();

    await expect(page).toHaveURL(/#contato$/);

    await page.waitForLoadState('networkidle');

    if (isMobile) {
      await expect(page.locator('#contato')).toBeInViewport();
    } else {
      await expect(landing.firstNameInput).toBeInViewport();
    }
  });
});
