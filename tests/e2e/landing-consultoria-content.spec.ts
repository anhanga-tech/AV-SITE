import { test, expect, type Locator } from '@playwright/test';

// O CTA e o disclaimer ficam dentro do m.div de entrada (fadeUp, custom={3},
// delay 0.3s + duration 0.55s). Medir a posição antes dessa transição
// assentar pega estados transitórios de layout. Duas caixas consecutivas
// iguais também não bastam: no CI elas podem cair dentro do delay de 0.3s,
// enquanto o grupo ainda está opacity: 0 e translateY(28px). Primeiro
// esperamos o estado final explícito da animação; depois confirmamos que as
// caixas assentaram, protegendo também contra uma troca tardia de fonte.
async function waitForStableBoxes(locators: Locator[]): Promise<void> {
  let previous: string | null = null;
  await expect
    .poll(
      async () => {
        const boxes = await Promise.all(locators.map((l) => l.boundingBox()));
        const snapshot = JSON.stringify(boxes);
        const stable = snapshot === previous;
        previous = snapshot;
        return stable;
      },
      { timeout: 5000 }
    )
    .toBe(true);
}

test.describe('CTA do hero não fica coberto pelo banner de cookies em mobile curto', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE — o mobile mais curto testado no critique

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('anhanga_cookie_consent');
      localStorage.removeItem('anhanga_cookie_consent_meta');
    });
  });

  test('CTA "Agendar consultoria" e a sub-linha ficam acima do banner', async ({ page }) => {
    await page.goto('/consultoria-de-viagem');

    const banner = page.getByRole('dialog', { name: 'Preferências de cookies' });
    await expect(banner).toBeVisible();

    const cta = page.locator('[data-tracking="hero-consultoria-viagem"]');
    // A sub-linha do hero é UMA <p> (abatimento + porta gratuita embutida). Ela
    // é o elemento mais baixo do bloco de entrada — se ela clareia o banner,
    // tudo acima também clareia. O count de sub-linhas do hero é load-bearing
    // para a dobra em 375×667: não re-adicionar uma segunda linha aqui.
    const disclaimer = page.getByText(/Vai viajar com a Anhangá/);

    const animatedCtaGroup = cta.locator('xpath=..');
    await expect(animatedCtaGroup).toHaveCSS('opacity', '1');
    await expect(animatedCtaGroup).toHaveCSS('transform', 'none');
    await waitForStableBoxes([cta, disclaimer]);

    const bannerBox = await banner.boundingBox();
    const ctaBox = await cta.boundingBox();
    const disclaimerBox = await disclaimer.boundingBox();
    expect(bannerBox).not.toBeNull();
    expect(ctaBox).not.toBeNull();
    expect(disclaimerBox).not.toBeNull();

    // Ambos precisam terminar acima do topo do banner (fixed bottom-0) — ver
    // critique de /consultoria-de-viagem: em telas curtas o disclaimer ficava
    // coberto mesmo com o CTA já visível.
    expect(ctaBox!.y + ctaBox!.height).toBeLessThanOrEqual(bannerBox!.y);
    expect(disclaimerBox!.y + disclaimerBox!.height).toBeLessThanOrEqual(bannerBox!.y);
  });
});

test('CTAs pagos linkam para o Cal.com (não abrem mais o ContactModal)', async ({ page }) => {
  await page.goto('/consultoria-de-viagem');

  // A mudança de comportamento central do produto pago: os CTAs do hero e do
  // rodapé deixaram de abrir o modal (onClick) e passaram a ser <a> para o
  // agendamento. toHaveAttribute('href', ...) pega tanto um typo na URL quanto
  // uma regressão que volte o CTA a <button> (sem href) abrindo o modal.
  const bookingUrl = 'https://cal.com/anhanga-viagens/consultoria';

  await expect(page.locator('[data-tracking="hero-consultoria-viagem"]')).toHaveAttribute('href', bookingUrl);

  const footerCta = page.locator('[data-tracking="footer-consultoria-viagem"]');
  await footerCta.scrollIntoViewIfNeeded();
  await expect(footerCta).toHaveAttribute('href', bookingUrl);
});

test('CTA pago cai no fallback de navegação se o embed do Cal.com falhar', async ({ page }) => {
  // O clique dá preventDefault antes de abrir o embed; se o embed.js falhar
  // (adblock/firewall/outage), sem fallback o CTA pago ficaria morto. Aqui
  // simulamos a falha abortando o app.cal.com e verificamos que o onClick cai
  // de volta na navegação para o CONSULTORIA_BOOKING_URL. Ambos os hosts são
  // interceptados para o teste ficar hermético (nenhuma request externa real).
  await page.route('https://app.cal.com/**', (route) => route.abort());
  await page.route('https://cal.com/anhanga-viagens/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>cal</title>' }),
  );
  await page.goto('/consultoria-de-viagem');

  await page.locator('[data-tracking="hero-consultoria-viagem"]').click();
  // Regex, não string exata: o fallback (lib/cal-embed.ts) anexa `?metadata[cid]=...`
  // quando há atribuição capturada (UTMs/click IDs) — uma string fixa nunca bate e o
  // teste sempre estoura o timeout, mascarando qualquer regressão real no fallback.
  await page.waitForURL(/^https:\/\/cal\.com\/anhanga-viagens\/consultoria(\?.*)?$/, { timeout: 8000 });
});

test('CTAs carregam a classificação de tracking correta (specialist vs. opt-out)', async ({ page }) => {
  await page.goto('/consultoria-de-viagem');

  // A porta gratuita (abre o ContactModal) precisa contar em specialist_cta_click,
  // mas o texto "Fale com um consultor" NÃO casa no heurístico textual de
  // public/utm-tracking.js ("consultor" ≠ "consultoria") — daí o opt-in explícito
  // data-specialist-cta nos dois convites in-content.
  await expect(page.locator('[data-tracking="hero-consultoria-porta-gratuita"][data-specialist-cta]')).toHaveCount(1);
  await expect(page.locator('[data-tracking="audience-consultoria-porta-gratuita"][data-specialist-cta]')).toHaveCount(1);

  // O CTA pago (link Cal.com) NÃO deve contar como specialist, apesar de o texto
  // "Agendar consultoria" casar no heurístico textual — daí o opt-out.
  await expect(page.locator('[data-tracking="hero-consultoria-viagem"][data-no-specialist-cta]')).toHaveCount(1);
  await expect(page.locator('[data-tracking="footer-consultoria-viagem"][data-no-specialist-cta]')).toHaveCount(1);
});

test('landing de consultoria mostra uma foto real do destino junto ao depoimento', async ({ page }) => {
  await page.goto('/consultoria-de-viagem');

  // LazyImage só renderiza a tag <img> quando o IntersectionObserver marca o
  // container como visível — precisa rolar até a seção (via o heading, que
  // renderiza imediatamente) antes de procurar a imagem pela role.
  await page.getByRole('heading', { name: 'Para quem é' }).scrollIntoViewIfNeeded();

  const photo = page.getByRole('img', { name: /lisboa, portugal/i });
  await expect(photo).toBeVisible();
  await expect(photo).toHaveAttribute('src', /lisboa/);
  await expect
    .poll(async () => photo.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
});

test('landing de consultoria mostra uma foto real do Rio de Janeiro na seção "Sobre"', async ({ page }) => {
  await page.goto('/consultoria-de-viagem');

  await page.getByRole('heading', { name: 'Sobre a Anhangá Viagens' }).scrollIntoViewIfNeeded();

  const photo = page.getByRole('img', { name: /rio de janeiro/i });
  await expect(photo).toBeVisible();
  await expect(photo).toHaveAttribute('src', /rio-de-janeiro/);
  await expect
    .poll(async () => photo.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
});

test('links de "Outros serviços" recebem foco visível ao navegar por teclado', async ({ page }) => {
  await page.goto('/consultoria-de-viagem');

  const firstLink = page.getByRole('link', { name: /viagens para executivos/i });
  const ctaFinal = page.locator('[data-tracking="footer-consultoria-viagem"]');
  // Foca programaticamente o elemento tabável imediatamente anterior (o CTA
  // final) e avança com um Tab real — só o Tab (não .focus() programático)
  // aciona o heurístico de :focus-visible do Chromium no destino.
  await ctaFinal.scrollIntoViewIfNeeded();
  await ctaFinal.focus();
  await page.keyboard.press('Tab');
  await expect(firstLink).toBeFocused();

  const outlineStyle = await firstLink.evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outlineStyle).not.toBe('none');
});
