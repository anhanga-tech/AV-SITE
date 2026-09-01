import { test, expect, type Page } from '@playwright/test';

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

  test('botões "Aceitar" e "Recusar" cumprem o piso de touch target de 44px', async ({ page }) => {
    await page.goto('/');
    const accept = page.getByRole('button', { name: 'Aceitar' });
    const decline = page.getByRole('button', { name: 'Recusar' });

    const acceptBox = await accept.boundingBox();
    const declineBox = await decline.boundingBox();
    expect(acceptBox).not.toBeNull();
    expect(declineBox).not.toBeNull();
    expect(acceptBox!.height).toBeGreaterThanOrEqual(44);
    expect(declineBox!.height).toBeGreaterThanOrEqual(44);
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

  test('ponte notifica aceite antes de enfileirar marketing_consent_granted', async ({ page }) => {
    await page.goto('/');

    await page.evaluate(() => {
      type ConsentChoice = string | null;
      type DataLayerEntry = { event?: string; anhanga_marketing_consent?: boolean };
      type TestWindow = Window & {
        dataLayer: DataLayerEntry[];
        addAnhangaConsentListener: (callback: (choice: ConsentChoice) => void) => void;
        __consentBridgeCalls: Array<{ choice: ConsentChoice; eventAlreadyQueued: boolean }>;
        __consentBridgeErrors: Array<{ message: string; error: string }>;
        __restoreConsentConsoleError: () => void;
      };

      const testWindow = window as unknown as TestWindow;
      testWindow.__consentBridgeCalls = [];
      testWindow.__consentBridgeErrors = [];
      const originalConsoleError = console.error;
      console.error = (message: unknown, error: unknown) => {
        testWindow.__consentBridgeErrors.push({
          message: String(message),
          error: error instanceof Error ? error.message : String(error),
        });
      };
      testWindow.__restoreConsentConsoleError = () => {
        console.error = originalConsoleError;
      };
      testWindow.addAnhangaConsentListener((choice) => {
        testWindow.__consentBridgeCalls.push({
          choice,
          eventAlreadyQueued: testWindow.dataLayer.some(
            (entry) => entry.event === 'marketing_consent_granted'
          ),
        });
      });

      // Um assinante defeituoso não pode impedir o restante do fluxo.
      testWindow.addAnhangaConsentListener(() => {
        throw new Error('synthetic listener failure');
      });
    });

    await page.getByRole('button', { name: 'Aceitar' }).click();

    const result = await page.evaluate(() => {
      type DataLayerEntry = { event?: string; anhanga_marketing_consent?: boolean };
      type TestWindow = Window & {
        dataLayer: DataLayerEntry[];
        __consentBridgeCalls: Array<{ choice: string | null; eventAlreadyQueued: boolean }>;
        __consentBridgeErrors: Array<{ message: string; error: string }>;
        __restoreConsentConsoleError: () => void;
      };
      const testWindow = window as unknown as TestWindow;
      const result = {
        calls: testWindow.__consentBridgeCalls,
        errors: testWindow.__consentBridgeErrors,
        consentEvent: testWindow.dataLayer.find(
          (entry) => entry.event === 'marketing_consent_granted'
        ),
      };
      testWindow.__restoreConsentConsoleError();
      return result;
    });

    expect(result.calls).toEqual([
      { choice: null, eventAlreadyQueued: false },
      { choice: 'marketing', eventAlreadyQueued: false },
    ]);
    expect(result.errors).toEqual([
      { message: 'Anhangá consent listener failed', error: 'synthetic listener failure' },
      { message: 'Anhangá consent listener failed', error: 'synthetic listener failure' },
    ]);
    expect(result.consentEvent).toEqual({
      event: 'marketing_consent_granted',
      anhanga_marketing_consent: true,
    });
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

  // --- Convivência com elementos flutuantes e ordem do DOM ---

  test('banner visível define --cookie-banner-h no <html>; escolher limpa o offset', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('dialog', { name: 'Preferências de cookies' })).toBeVisible();

    // Com o banner visível, a CSS var expõe a altura para o FAB do chat se deslocar
    const heightWithBanner = await page.evaluate(() =>
      document.documentElement.style.getPropertyValue('--cookie-banner-h')
    );
    expect(heightWithBanner).toMatch(/^\d+px$/);
    expect(parseInt(heightWithBanner, 10)).toBeGreaterThan(0);

    // Após escolher, o offset volta a zero (FAB retorna à posição original).
    // O reset da var acontece no cleanup assíncrono do effect — aguardar o
    // banner fechar antes de ler, como nos demais testes do describe.
    await page.getByRole('button', { name: 'Aceitar' }).click();
    await expect(page.getByRole('dialog', { name: 'Preferências de cookies' })).not.toBeVisible();
    const heightAfterChoice = await page.evaluate(() =>
      document.documentElement.style.getPropertyValue('--cookie-banner-h')
    );
    expect(heightAfterChoice).toBe('0px');
  });

  test('com o banner visível, o BackToTop não fica coberto pelo banner', async ({ page }) => {
    await page.goto('/');
    const dialog = page.getByRole('dialog', { name: 'Preferências de cookies' });
    await expect(dialog).toBeVisible();

    // BackToTop só se revela após 400px de scroll (useScrolled)
    await page.evaluate(() => window.scrollTo(0, 600));
    const backToTop = page.getByRole('button', { name: 'Voltar ao topo' });
    await backToTop.waitFor({ state: 'visible', timeout: 15000 });

    const bannerBox = await dialog.boundingBox();
    const buttonBox = await backToTop.boundingBox();
    expect(bannerBox).not.toBeNull();
    expect(buttonBox).not.toBeNull();
    // O botão deve terminar acima do topo do banner (offset via --cookie-banner-h)
    expect(buttonBox!.y + buttonBox!.height).toBeLessThanOrEqual(bannerBox!.y);
  });

  test('banner precede o conteúdo das rotas na ordem do DOM (acessibilidade de teclado)', async ({ page }) => {
    await page.goto('/');
    // Banner só monta após a hidratação (ClientOnly) — sem esta espera o
    // querySelector abaixo corre contra o mount e falha por timing
    await expect(page.getByRole('dialog', { name: 'Preferências de cookies' })).toBeVisible();
    const dialogPrecedesMain = await page.evaluate(() => {
      const dialog = document.querySelector('dialog[aria-label="Preferências de cookies"]');
      const main = document.querySelector('header, main');
      if (!dialog || !main) return false;
      // DOCUMENT_POSITION_FOLLOWING (4): main vem depois do dialog no DOM
      return Boolean(dialog.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(dialogPrecedesMain).toBe(true);
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

  test('revogação: aceitar → gerenciar → recusar dispara reload', async ({ page }) => {
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

    // Banner não deve reaparecer
    await expect(page.getByRole('dialog', { name: 'Preferências de cookies' })).not.toBeVisible();
  });

  // --- Ponte de consentimento com o Zaraz ---

  // window.zaraz só existe em produção (script real do Cloudflare); o stub abaixo
  // simula a API real (window.zaraz.consent.set) pra capturar a chamada sem
  // depender do zaraz.js de verdade, que não roda no dev server do Playwright.
  async function stubZarazConsent(page: Page): Promise<void> {
    await page.addInitScript(() => {
      type ConsentPurposes = Record<string, boolean>;
      type TestWindow = Window & {
        zaraz: { consent: { set: (purposes: ConsentPurposes) => void } };
        __zarazConsentCalls: ConsentPurposes[];
      };
      const testWindow = window as unknown as TestWindow;
      testWindow.__zarazConsentCalls = [];
      testWindow.zaraz = {
        consent: {
          set: (purposes) => testWindow.__zarazConsentCalls.push(purposes),
        },
      };
    });
  }

  async function getZarazConsentCalls(page: Page): Promise<Record<string, boolean>[]> {
    return page.evaluate(() => (window as unknown as { __zarazConsentCalls: Record<string, boolean>[] }).__zarazConsentCalls);
  }

  test('carregamento sem escolha prévia já sincroniza marketing:false com o Zaraz', async ({ page }) => {
    // addAnhangaConsentListener invoca o assinante imediatamente no registro, com o
    // estado atual (_consentChoice é null aqui) — cobre visitas cujo consentimento
    // já foi decidido antes desta carga, sem depender de um clique nesta sessão.
    await stubZarazConsent(page);
    await page.goto('/');

    expect(await getZarazConsentCalls(page)).toEqual([{ marketing: false }]);
  });

  test('aceitar propaga a purpose marketing pro Zaraz', async ({ page }) => {
    await stubZarazConsent(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Aceitar' }).click();

    // [0] é a sincronização inicial (sem escolha ainda); [1] é o clique em Aceitar.
    expect(await getZarazConsentCalls(page)).toEqual([{ marketing: false }, { marketing: true }]);
  });

  test('revogar (aceitar → gerenciar → recusar) resulta em marketing:false pro Zaraz após o reload', async ({ page }) => {
    // O listener de revogação só dispara quando a escolha anterior era 'marketing'
    // (lib/consent.ts) — "Recusar" na primeira visita não emite nenhum evento, então
    // este teste precisa passar por aceitar primeiro. A leitura acontece depois do
    // reload (não antes) pra evitar competir com a navegação: o addInitScript reroda
    // na página recarregada e a sincronização inicial já reflete 'essential' salvo no
    // localStorage, que é o estado que realmente importa provar.
    test.setTimeout(20000);
    await stubZarazConsent(page);

    await page.goto('/');
    await page.getByRole('button', { name: 'Aceitar' }).click();
    await page.getByRole('button', { name: 'Gerenciar cookies' }).click();
    await expect(page.getByRole('dialog', { name: 'Preferências de cookies' })).toBeVisible();

    await Promise.all([
      page.waitForEvent('framenavigated'),
      page.getByRole('button', { name: 'Recusar' }).click(),
    ]);

    expect(await getZarazConsentCalls(page)).toEqual([{ marketing: false }]);
  });
});
