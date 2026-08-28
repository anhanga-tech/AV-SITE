import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } }); // mobile-first

test.beforeEach(async ({ page }) => {
    // dataLayer determinístico (GTM não carrega em localhost pelo gate de host).
    await page.addInitScript(() => {
        (window as unknown as { dataLayer: unknown[] }).dataLayer = [];
    });
});

test('renderiza a página /links com logo, botões e selos', async ({ page }) => {
    await page.goto('/links');
    await expect(page.getByRole('img', { name: 'Anhangá Viagens' })).toBeVisible();
    await expect(page.getByTestId('link-whatsapp')).toBeVisible();
    await expect(page.getByText(/Cadastur 37\.036\.732\/0001-41/)).toBeVisible();
    // Banner do quiz está desligado (banner.visible=false): o quiz vive como link na lista,
    // e o WhatsApp é o único amarelo na 1ª dobra. Ver data/linksPage.ts.
    await expect(page.getByTestId('links-banner')).toHaveCount(0);
});

test('orienta o visitante entre contato, destinos e produtos comerciais', async ({ page }) => {
    await page.goto('/links');

    await expect(page.getByRole('heading', { name: 'Qual é o próximo passo da sua viagem?' })).toBeVisible();
    await expect(page.getByTestId('link-whatsapp')).toHaveAttribute('href', /wa\.me/);
    await expect(page.getByTestId('intent-destinos')).toHaveAttribute('href', '#destinos');
    await expect(page.getByTestId('intent-produtos')).toHaveAttribute('href', '#preparar');
    await expect(page.getByRole('heading', { name: 'Conheça destinos e ideias' })).toBeVisible();
    await expect(page.getByTestId('link-seguro-viagem')).toContainText('Calcular meu seguro viagem');
    await expect(page.getByTestId('link-chip-esim')).toContainText('Comprar chip / eSIM internacional');
});

test('atalhos de intenção registram o clique no dataLayer', async ({ page }) => {
    await page.goto('/links');

    await page.getByTestId('intent-destinos').click();
    await page.getByTestId('intent-produtos').click();
    await page.waitForFunction(() => {
        const events = (window as unknown as { dataLayer?: Array<{ event?: string; label?: string }> }).dataLayer ?? [];
        return events.filter((event) => event.event === 'links_page_click').length >= 2;
    });

    const intentClicks = await page.evaluate(() =>
        (window as unknown as { dataLayer: Array<Record<string, string>> }).dataLayer.filter(
            (event) => event.event === 'links_page_click' && event.label?.startsWith('intent-'),
        ),
    );
    expect(intentClicks).toEqual(expect.arrayContaining([
        { event: 'links_page_click', label: 'intent-destinos', link_type: 'internal', destination: '#destinos' },
        { event: 'links_page_click', label: 'intent-produtos', link_type: 'internal', destination: '#preparar' },
    ]));
});

test('links_page_view é empurrado no dataLayer no load', async ({ page }) => {
    await page.goto('/links');
    await page.waitForFunction(() =>
        (window as unknown as { dataLayer?: Array<{ event?: string }> }).dataLayer
            ?.some((e) => e.event === 'links_page_view'),
    );
    const events = await page.evaluate(() =>
        (window as unknown as { dataLayer: Array<{ event?: string }> }).dataLayer
            .filter((e) => e.event === 'links_page_view'),
    );
    expect(events.length).toBeGreaterThanOrEqual(1);
});

test('clique dispara links_page_click com o label correto', async ({ page }) => {
    await page.goto('/links');
    // Usa um link INTERNO (orlando): React Router navega client-side, sem rede externa,
    // e preserva window.dataLayer para a asserção. Não clicar em links external (hit de rede + flaky).
    await page.getByTestId('link-orlando').click();
    await page.waitForFunction(() =>
        (window as unknown as { dataLayer?: Array<{ event?: string; label?: string }> }).dataLayer
            ?.some((e) => e.event === 'links_page_click' && e.label === 'orlando'),
    );
    const clicks = await page.evaluate(() =>
        (window as unknown as { dataLayer: Array<{ event?: string; label?: string }> }).dataLayer
            .filter((e) => e.event === 'links_page_click'),
    );
    expect(clicks.some((c) => c.label === 'orlando')).toBe(true);
});

// Corrige o diagnóstico da crítica de 2026-08-26: escolher uma porta de intenção rebaixava
// zero conteúdo — as duas seções continuavam com peso idêntico. Agora a seção não escolhida
// perde peso tipográfico (sem sumir, sem custar Controle do Usuário) enquanto a escolhida
// mantém o peso cheio.
test('escolher uma porta de intenção rebaixa visualmente a seção não escolhida, sem escondê-la', async ({ page }) => {
    await page.goto('/links');

    const destinosHeading = page.getByRole('heading', { name: 'Conheça destinos e ideias' });
    const preparoHeading = page.getByRole('heading', { name: 'Prepare sua viagem' });

    await expect(destinosHeading).toHaveClass(/font-black/);
    await expect(preparoHeading).toHaveClass(/font-black/);

    await page.getByTestId('intent-produtos').click();

    await expect(destinosHeading).toHaveClass(/font-bold/);
    await expect(destinosHeading).toBeVisible();
    await expect(preparoHeading).toHaveClass(/font-black/);

    await page.getByTestId('intent-destinos').click();

    await expect(preparoHeading).toHaveClass(/font-bold/);
    await expect(preparoHeading).toBeVisible();
    await expect(destinosHeading).toHaveClass(/font-black/);
});

test('não renderiza overlays flutuantes (AIChat / BackToTop) na página standalone', async ({ page }) => {
    await page.goto('/links');
    await expect(page.getByTestId('link-whatsapp')).toBeVisible();
    // /links é página de bio standalone — nenhum FAB deve aparecer (cobririam os selos de
    // confiança e os destinos curados). Ver STANDALONE_ROUTES em App.tsx.
    await expect(page.getByRole('button', { name: 'Abrir assistente virtual' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Voltar ao topo' })).toHaveCount(0);

    // Também não deve renderizar com barra no final (trailing slash, comum em links de bio).
    await page.goto('/links/');
    await expect(page.getByTestId('link-whatsapp')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Abrir assistente virtual' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Voltar ao topo' })).toHaveCount(0);

    // Nem em caixa alta: o React Router casa a rota case-insensitive, então STANDALONE_ROUTES
    // normaliza para minúsculas — /LINKS também não deve carregar overlays.
    await page.goto('/LINKS');
    await expect(page.getByTestId('link-whatsapp')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Abrir assistente virtual' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Voltar ao topo' })).toHaveCount(0);
});

test('botão WhatsApp mantém href real de wa.me (progressive enhancement)', async ({ page }) => {
    await page.goto('/links');
    const href = await page.getByTestId('link-whatsapp').getAttribute('href');
    expect(href).toContain('wa.me/5511955021519');
    expect(href).toContain('text=');
});

// P: "O botão de whatsapp precisaria abrir um modal para preencher os dados do lead. Como é
// nas demais páginas" — mesmo padrão de tests/e2e/contact-form.spec.ts: mocka /api/submit-contact
// e window.open (evita abrir aba real durante o teste) para exercitar o fluxo ponta a ponta.
// Escopo: os dois links tipo whatsapp de /links (`whatsapp` e `chip-esim`) passam pelo modal.
async function mockSubmitContact(page: import('@playwright/test').Page) {
    const requests: import('../../types/contactCapture').SubmitContactRequest[] = [];
    await page.route('**/api/submit-contact', (route) => {
        requests.push(route.request().postDataJSON());
        return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ ok: true, requestId: 'req_links_e2e' }),
        });
    });
    return requests;
}

test('botões de WhatsApp abrem o ContactModal em vez de navegar direto', async ({ page }) => {
    await mockSubmitContact(page);
    await page.addInitScript(() => {
        Object.defineProperty(window, 'open', { configurable: true, value: () => null });
    });
    await page.goto('/links');

    const dialog = page.getByRole('dialog', { name: 'Fale com um consultor' });

    await page.getByTestId('link-whatsapp').click();
    await expect(dialog).toBeVisible();
    await expect(page.locator('#contact-firstName')).toBeFocused();
    await page.getByRole('button', { name: 'Fechar' }).click();
    await expect(dialog).toBeHidden();

    await page.getByTestId('link-chip-esim').click();
    await expect(dialog).toBeVisible();
});

test('envia o lead pelo modal (CRM primeiro) e só então abre o WhatsApp com a mensagem do item', async ({ page }) => {
    const requests = await mockSubmitContact(page);
    await page.addInitScript(() => {
        Object.defineProperty(window, 'open', { configurable: true, value: () => null });
    });
    await page.goto('/links');

    await page.getByTestId('link-whatsapp').click();
    await page.locator('#contact-firstName').fill('Maria');
    await page.locator('#contact-whatsapp').fill('11987654321');
    await page.getByRole('button', { name: /^abrir whatsapp agora$/i }).click();

    await expect(page.getByText(/recebemos seu contato/i)).toBeVisible();
    expect(requests).toHaveLength(1);
    expect(requests[0].source).toBe('links-whatsapp');
    expect(requests[0].firstName).toBe('Maria');
});

// Mesmo padrão de landing-consultoria-content.spec.ts: o botão "Agendar consultoria" trocou
// o pedido de orçamento via WhatsApp por agendamento pago no Cal.com (mesmo mecanismo da
// landing /consultoria-de-viagem, ver lib/cal-embed.ts).
test('botão "Agendar consultoria" linka para o Cal.com e opta fora do specialist_cta_click', async ({ page }) => {
    await page.goto('/links');
    const cta = page.getByTestId('link-agendar-consultoria');
    await cta.scrollIntoViewIfNeeded();
    await expect(cta).toHaveAttribute('href', 'https://cal.com/anhanga-viagens/consultoria');
    // "Agendar consultoria" casaria no heurístico textual de isSpecialistCtaText
    // (public/utm-tracking.js) — o opt-out evita um falso specialist_cta_click.
    await expect(page.locator('[data-testid="link-agendar-consultoria"][data-no-specialist-cta]')).toHaveCount(1);
});

test('botão "Agendar consultoria" cai no fallback de navegação se o embed do Cal.com falhar', async ({ page }) => {
    // Aborta app.cal.com (embed) e intercepta cal.com/anhanga-viagens (destino do fallback) —
    // nenhuma request externa real, teste hermético.
    await page.route('https://app.cal.com/**', (route) => route.abort());
    await page.route('https://cal.com/anhanga-viagens/**', (route) =>
        route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>cal</title>' }),
    );
    await page.goto('/links');

    await page.getByTestId('link-agendar-consultoria').click();
    await page.waitForURL('https://cal.com/anhanga-viagens/consultoria', { timeout: 8000 });
});

// Mede o que a auditoria só conseguia argumentar: com `truncate` (`white-space: nowrap`) o
// rótulo era cortado com reticências, o que é perda de conteúdo — WCAG 1.4.4 Resize Text.
// `scrollWidth > clientWidth` é exatamente a condição de corte.
async function rotulosCortados(page: import('@playwright/test').Page): Promise<string[]> {
    return page.$$eval('[data-testid="link-label"]', (nodes) =>
        nodes
            .filter((n) => n.scrollWidth > n.clientWidth + 1)
            .map((n) => n.textContent ?? ''),
    );
}

test('nenhum rótulo é cortado a 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto('/links');
    await expect(page.getByTestId('link-chip-esim')).toBeVisible();
    expect(await rotulosCortados(page)).toEqual([]);

    // E a página não pode rolar na horizontal nesse viewport.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
});

test('nenhum rótulo é cortado com zoom de texto a 200%', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto('/links');
    // Zoom só de texto: dobra o rem, que é o que os tamanhos da página usam.
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    await expect(page.getByTestId('intent-destinos')).toBeVisible();
    await expect(page.getByTestId('link-chip-esim')).toBeVisible();
    expect(await rotulosCortados(page)).toEqual([]);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
});

// O banner de cookies é fixo no rodapé (z-10000). Sem reservar a altura dele, ele cobria
// Cadastur/nota do Google — a prova de confiança da agência — para todo visitante novo.
test('o banner de cookies não cobre os selos de confiança', async ({ page }) => {
    // Mesmo padrão de cookie-consent.spec.ts: limpa o consentimento pré-setado no
    // storageState do playwright.config.ts para que o banner realmente apareça.
    await page.addInitScript((key) => {
        localStorage.removeItem(key);
        localStorage.removeItem(key + '_meta');
    }, 'anhanga_cookie_consent');
    await page.goto('/links');

    const banner = page.getByRole('dialog', { name: 'Preferências de cookies' });
    await expect(banner).toBeVisible();

    await page.getByText('ANHANGA TURISMO LTDA').scrollIntoViewIfNeeded();
    const selos = await page.getByText('ANHANGA TURISMO LTDA').boundingBox();
    const caixaBanner = await banner.boundingBox();
    expect(selos).not.toBeNull();
    expect(caixaBanner).not.toBeNull();
    expect(selos!.y + selos!.height).toBeLessThanOrEqual(caixaBanner!.y);
});
