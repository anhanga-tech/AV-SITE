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

  test('should block submit when LGPD consent is not accepted', async ({ page }) => {
    const corpRequests: string[] = [];
    page.on('requestfinished', (req) => {
      const url = req.url();
      if (/\/api\/submit-lead(-sf)?$/.test(url)) {
        corpRequests.push(url);
      }
    });

    const landing = new CorporativoPage(page);
    await landing.goto();

    await landing.fillForm({
      firstName: 'Sem',
      lastName: 'Consentimento',
      email: 'sem@consentimento.com.br',
      whatsapp: '(11) 98831-4487',
      empresa: 'Sem Consent LTDA',
      cargo: 'Tester',
      acceptLGPD: false,
    });

    await expect(landing.lgpdCheckbox).not.toBeChecked();

    await landing.submit();

    await landing.expectError('Você deve aceitar os termos para continuar.');

    await page.waitForTimeout(300);
    expect(corpRequests).toEqual([]);
  });

  test('should capture corporate lead and trigger dataLayer events', async ({ page }) => {
    const landing = new CorporativoPage(page);
    let submitPayload: SubmitLeadRequest | null = null;
    let sfPayload: Record<string, unknown> | null = null;

    await page.route('**/api/submit-lead', async route => {
      submitPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, requestId: 'corp-123' }),
      });
    });

    await page.route('**/api/submit-lead-sf', async route => {
      sfPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, requestId: 'sf-123' }),
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

    const payload = submitPayload as unknown as SubmitLeadRequest;
    expect(payload).toBeTruthy();
    expect(payload).toMatchObject({
      firstName: 'Maria',
      lastName: 'Santos',
      email: 'maria@empresa.com.br',
      whatsapp: '+5511988314487',
      destination: 'Corporativo',
    });
    expect(payload.bantSummary).toContain('Lead corporativo');
    expect(payload.bantSummary).toContain('Empresa Teste LTDA');
    expect(payload.bantSummary).toContain('Sócia');

    await expect.poll(() => sfPayload).toBeTruthy();
    expect(sfPayload).toMatchObject({
      firstName: 'Maria',
      lastName: 'Santos',
      email: 'maria@empresa.com.br',
      whatsapp: '+5511988314487',
      empresa: 'Empresa Teste LTDA',
      cargo: 'Sócia',
      leadSource: 'Corporativo',
    });
    expect(String((sfPayload as unknown as Record<string, unknown>).description)).toContain('Lead corporativo');
    expect(sfPayload as unknown as Record<string, unknown>).toHaveProperty('utms');

    const formSubmissionEvent = await page.evaluate(() =>
      (window.dataLayer || []).find(e => e.event === 'form_submission')
    );
    expect(formSubmissionEvent).toMatchObject({
      event: 'form_submission',
      form_type: 'corporate_lead',
    });
  });

  test('should not leak form data to HubSpot tracking', async ({ page }) => {
    const hubspotRequests: string[] = [];

    page.on('requestfinished', (req) => {
      const url = req.url();
      if (/hubspot|hsforms|hscollectedforms|hs-scripts|hs-analytics|hs-banner|usemessages/i.test(url)) {
        hubspotRequests.push(url);
      }
    });

    await page.route('**/api/submit-lead', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, requestId: 'corp-no-leak' }),
      });
    });

    await page.route('**/api/submit-lead-sf', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, requestId: 'sf-no-leak' }),
      });
    });

    const landing = new CorporativoPage(page);
    await landing.goto();
    await landing.fillForm({
      firstName: 'Teste',
      lastName: 'Regressão',
      email: 'regressao@teste.com.br',
      whatsapp: '(11) 99999-0000',
      empresa: 'Empresa Fictícia',
      cargo: 'QA',
    });

    await landing.submit();
    await landing.expectSuccess();

    await page.waitForTimeout(500);

    expect(hubspotRequests).toEqual([]);
  });

  test('should show fallback when globe.gl fails to load', async ({ page, isMobile }) => {
    // O globo (e seu fallback) só é montado em telas lg+ — o wrapper em
    // CorpHero usa `hidden lg:block`. Em viewports mobile fica display:none
    // por design, então a asserção de visibilidade só vale no desktop.
    test.skip(isMobile, 'Globo é decorativo desktop-only (hidden lg:block)');

    await page.route(/globe(\.|__)gl|three-globe/, route => route.abort());

    const landing = new CorporativoPage(page);
    await landing.goto();

    await expect(page.getByTestId('corp-globe-fallback')).toBeVisible();
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
