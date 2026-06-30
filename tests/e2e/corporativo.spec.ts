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

  test('should keep section content visible under reduced motion', async ({ page }) => {
    // PRODUCT.md: "Reduced motion não é opcional." Reveal-on-scroll must not
    // gate visibility — with motion reduced, sections should read immediately.
    await page.emulateMedia({ reducedMotion: 'reduce' });

    const landing = new CorporativoPage(page);
    await landing.goto();

    const heroHeading = page.getByRole('heading', { level: 1 });
    await expect(heroHeading).toBeVisible();

    const pillarsHeading = page.getByRole('heading', { name: /escolhem a Anhangá/i });
    await pillarsHeading.scrollIntoViewIfNeeded();
    await expect(pillarsHeading).toBeVisible();
    // opacity isn't inherited, so walk every ancestor and take the minimum —
    // a framer-hidden wrapper higher up would otherwise pass a single-level check.
    await expect
      .poll(() =>
        pillarsHeading.evaluate(el => {
          let current: HTMLElement | null = el as HTMLElement;
          let minOpacity = 1;
          while (current) {
            const opacity = parseFloat(getComputedStyle(current).opacity);
            if (!Number.isNaN(opacity)) {
              minOpacity = Math.min(minOpacity, opacity);
            }
            current = current.parentElement;
          }
          return minOpacity;
        })
      )
      .toBeGreaterThan(0.95);

    const processHeading = page.getByRole('heading', { name: /3 passos/i });
    await processHeading.scrollIntoViewIfNeeded();
    await expect(processHeading).toBeVisible();
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
