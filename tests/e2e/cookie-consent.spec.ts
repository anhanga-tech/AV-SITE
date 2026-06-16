import { test, expect } from '@playwright/test';

const CHOICE_KEY = 'anhanga_cookie_consent';

test.describe('Cookie Consent Banner (CMP)', () => {
  // Timeout por teste: suficiente para navegações lentas, mas falha rápido em hangs
  test.setTimeout(15000);

  test.beforeEach(async ({ page }) => {
    // Limpa o consentimento apenas na primeira navegação do teste.
    // A flag de sessionStorage impede que reloads dentro do mesmo teste
    // apaguem o consentimento salvo pelo clique (sessionStorage sobrevive a reloads).
    await page.addInitScript((key) => {
      if (sessionStorage.getItem('_cmp_test_init')) return;
      sessionStorage.setItem('_cmp_test_init', '1');
      localStorage.removeItem(key);
      localStorage.removeItem(key + '_meta');
    }, CHOICE_KEY);
  });

  // --- Visibilidade ---

  test('banner aparece na primeira visita', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('dialog', { name: 'Preferências de cookies' })).toBeVisible();
  });

  test('banner tem botões "Aceitar" e "Recusar" com peso visual idêntico', async ({ page }) => {
    await page.goto('/');
    const accept = page.getByRole('button', { name: 'Aceitar' });
    const decline = page.getByRole('button', { name: 'Recusar' });

    await expect(accept).toBeVisible();
    await expect(decline).toBeVisible();

    // Ambos devem ter a mesma classe de border (sem cor primária exclusiva em um deles)
    const acceptClass = await accept.getAttribute('class') ?? '';
    const declineClass = await decline.getAttribute('class') ?? '';
    expect(acceptClass).toEqual(declineClass);
  });

  // --- Aceitar ---

  test('clicar "Aceitar" fecha o banner e salva "marketing" no localStorage', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Aceitar' }).click();
    await expect(page.getByRole('dialog', { name: 'Preferências de cookies' })).not.toBeVisible();

    const value = await page.evaluate((key) => localStorage.getItem(key), CHOICE_KEY);
    expect(value).toBe('marketing');
  });

  test('após aceitar, recarregar não mostra o banner', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Aceitar' }).click();
    await page.reload();
    await expect(page.getByRole('dialog', { name: 'Preferências de cookies' })).not.toBeVisible();
  });

  test('após aceitar, metadados são gravados com timestamp e version', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Aceitar' }).click();

    const meta = await page.evaluate(() => {
      const raw = localStorage.getItem('anhanga_cookie_consent_meta');
      return raw ? JSON.parse(raw) : null;
    });
    expect(meta).not.toBeNull();
    expect(meta.version).toBe('1');
    expect(meta.choice).toBe('marketing');
    expect(() => new Date(meta.timestamp)).not.toThrow();
  });

  // --- Recusar ---

  test('clicar "Recusar" fecha o banner e salva "essential" no localStorage', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Recusar' }).click();
    await expect(page.getByRole('dialog', { name: 'Preferências de cookies' })).not.toBeVisible();

    const value = await page.evaluate((key) => localStorage.getItem(key), CHOICE_KEY);
    expect(value).toBe('essential');
  });

  test('após recusar, recarregar não mostra o banner', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Recusar' }).click();
    await page.reload();
    await expect(page.getByRole('dialog', { name: 'Preferências de cookies' })).not.toBeVisible();
  });

  test('recusar não bloqueia GTM/analytics (legítimo interesse)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Recusar' }).click();

    const hasDataLayer = await page.evaluate(() => Array.isArray(window.dataLayer));
    expect(hasDataLayer).toBe(true);
  });

  test('recusar impede carregamento do Mautic', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Recusar' }).click();

    // Aguardar possíveis triggers de scroll/idle
    await page.waitForTimeout(500);
    const hasMautic = await page.evaluate(() => 'MauticTrackingObject' in window);
    expect(hasMautic).toBe(false);
  });

  // --- Link de Política de Privacidade ---

  test('link "Política de Privacidade" aponta para /politica-privacidade/#cookies', async ({ page }) => {
    await page.goto('/');
    const link = page.getByRole('dialog').getByRole('link');
    const href = await link.getAttribute('href');
    // Trailing slash antes da âncora evita o 308 do Cloudflare Pages (auditoria SEO jun/2026)
    expect(href).toBe('/politica-privacidade/#cookies');
  });

  // --- Gerenciar cookies (revogação) ---

  test('"Gerenciar cookies" na footer reabre o banner sem limpar localStorage', async ({ page }) => {
    // Aceitar primeiro
    await page.goto('/');
    await page.getByRole('button', { name: 'Aceitar' }).click();

    // Clicar em Gerenciar cookies
    await page.getByRole('button', { name: 'Gerenciar cookies' }).click();

    // Banner deve reaparecer
    await expect(page.getByRole('dialog', { name: 'Preferências de cookies' })).toBeVisible();

    // localStorage ainda tem 'marketing' (não foi limpo)
    const value = await page.evaluate((key) => localStorage.getItem(key), CHOICE_KEY);
    expect(value).toBe('marketing');
  });

  test('revogação: aceitar → gerenciar → recusar dispara reload e bloqueia Mautic', async ({ page }) => {
    // Timeout maior apenas para este teste — envolve um reload completo de página
    test.setTimeout(20000);

    // Aceitar
    await page.goto('/');
    await page.getByRole('button', { name: 'Aceitar' }).click();

    // Clicar em Gerenciar cookies
    await page.getByRole('button', { name: 'Gerenciar cookies' }).click();

    // Aguardar banner reaparecer
    await expect(page.getByRole('dialog', { name: 'Preferências de cookies' })).toBeVisible();

    // Revogar — aguarda o reload que o listener dispara
    await Promise.all([
      page.waitForEvent('framenavigated'),
      page.getByRole('button', { name: 'Recusar' }).click(),
    ]);

    // Após o reload, localStorage deve ser 'essential'
    const value = await page.evaluate((key) => localStorage.getItem(key), CHOICE_KEY);
    expect(value).toBe('essential');

    // Mautic não deve ter carregado
    const hasMautic = await page.evaluate(() => 'MauticTrackingObject' in window);
    expect(hasMautic).toBe(false);

    // Banner não deve reaparecer
    await expect(page.getByRole('dialog', { name: 'Preferências de cookies' })).not.toBeVisible();
  });

  // --- Aceitar com Mautic ---

  test('aceitar carrega Mautic', async ({ page }) => {
    // Em CI o hostname é 127.0.0.1; loadMautic() tem guard que retorna cedo nesse caso.
    // A lógica de despacho do evento e a gate de consentimento são cobertas por consent.test.ts.
    test.skip(!!process.env.CI, 'loadMautic retorna cedo em 127.0.0.1 em CI — coberto por testes unitários');

    // Interceptar o script do Mautic para confirmar que foi solicitado
    let mauticRequested = false;
    await page.route('**/mtc.js', async (route) => {
      mauticRequested = true;
      await route.fulfill({ status: 200, body: 'window.MauticTrackingObject="mt";' });
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'Aceitar' }).click();

    // Dar tempo para scripts lazy carregarem
    await page.waitForTimeout(300);

    expect(mauticRequested).toBe(true);
  });
});
