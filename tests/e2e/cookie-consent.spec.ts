import { test, expect } from '@playwright/test';

const CHOICE_KEY = 'anhanga_cookie_consent';

test.describe('Cookie Consent Banner (CMP)', () => {

  test.beforeEach(async ({ page }) => {
    // Garantir estado limpo: sem localStorage de consentimento
    await page.goto('/');
    await page.evaluate((key) => localStorage.removeItem(key), CHOICE_KEY);
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
    const hasMautic = await page.evaluate(() => typeof window.MauticTrackingObject !== 'undefined');
    expect(hasMautic).toBe(false);
  });

  // --- Link de Política de Privacidade ---

  test('link "Política de Privacidade" aponta para /politica-privacidade#cookies', async ({ page }) => {
    await page.goto('/');
    const link = page.getByRole('dialog').getByRole('link');
    const href = await link.getAttribute('href');
    expect(href).toBe('/politica-privacidade#cookies');
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
    // Aceitar
    await page.goto('/');
    await page.getByRole('button', { name: 'Aceitar' }).click();

    // Clicar em Gerenciar cookies
    await page.getByRole('button', { name: 'Gerenciar cookies' }).click();

    // Aguardar banner reaparecer
    await expect(page.getByRole('dialog', { name: 'Preferências de cookies' })).toBeVisible();

    // Revogar — aguarda o reload que o listener dispara
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      page.getByRole('button', { name: 'Recusar' }).click(),
    ]);

    // Após o reload, localStorage deve ser 'essential'
    const value = await page.evaluate((key) => localStorage.getItem(key), CHOICE_KEY);
    expect(value).toBe('essential');

    // Mautic não deve ter carregado
    const hasMautic = await page.evaluate(() => typeof window.MauticTrackingObject !== 'undefined');
    expect(hasMautic).toBe(false);

    // Banner não deve reaparecer
    await expect(page.getByRole('dialog', { name: 'Preferências de cookies' })).not.toBeVisible();
  });

  // --- Aceitar com Mautic ---

  test('aceitar carrega Mautic', async ({ page }) => {
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
