import { test, expect, type Locator } from '@playwright/test';

// O CTA e o disclaimer ficam dentro do m.div de entrada (fadeUp, custom={3},
// delay 0.3s + duration 0.55s). Medir a posição antes dessa transição
// assentar pega estados transitórios de layout — flaky em CI (falhou com
// y+height=549.97 vs limite 542) e reproduzido localmente até com
// `reducedMotion: 'reduce'` e esperando `opacity: 1` isoladamente (nenhum
// dos dois é suficiente sozinho: a posição pode assentar antes ou depois da
// opacidade, dependendo do timing). Espera cause-agnóstica: lê a caixa de
// cada locator repetidamente até duas leituras consecutivas baterem.
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
