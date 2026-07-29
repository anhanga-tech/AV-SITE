import { test, expect } from '@playwright/test';

/*
  Guards da issue #1329. Ao contrário do fallback de imagem da #1326 — cujo
  gatilho depende de `VITE_MEDIA_ENABLE_TRANSFORMS` e por isso teve de ir para
  node:test —, aqui o ambiente do teste CONSEGUE produzir os dois defeitos: o
  Playwright emula `prefers-reduced-motion` nativamente e o foco por teclado é
  um evento real do browser. Então e2e é o lugar certo.
*/

test.describe('/orlando — acessibilidade', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('o parallax do hero não move nada com reduced-motion ligado', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/orlando/');
    await page.getByRole('heading', { level: 1 }).waitFor();

    const card = page.locator('.landing-orlando .card').first();
    await expect(card).toBeVisible();

    const antes = await card.evaluate((el) => getComputedStyle(el).transform);

    // O parallax é dirigido por mousemove acima de 1100px de viewport. O reset
    // global de CSS não alcança este transform: ele é inline, aplicado por JS.
    await page.mouse.move(200, 200);
    await page.mouse.move(1200, 700);
    await page.mouse.move(400, 300);
    await page.waitForTimeout(300);

    const depois = await card.evaluate((el) => getComputedStyle(el).transform);
    expect(depois, 'o cartão se moveu com prefers-reduced-motion: reduce').toBe(antes);
  });

  test('sem reduced-motion o parallax continua funcionando', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/orlando/');
    await page.getByRole('heading', { level: 1 }).waitFor();

    const card = page.locator('.landing-orlando .card').first();
    await expect(card).toBeVisible();
    const antes = await card.evaluate((el) => getComputedStyle(el).transform);

    await page.mouse.move(200, 200);
    await page.mouse.move(1300, 800);
    await page.waitForTimeout(300);

    // Contraprova do teste acima: sem isto, um parallax quebrado passaria nos
    // dois testes e o guard não significaria nada.
    const depois = await card.evaluate((el) => getComputedStyle(el).transform);
    expect(depois, 'o parallax deixou de funcionar sem a preferência ligada').not.toBe(antes);
  });

  test('os interativos têm anel de foco próprio, não o padrão do browser', async ({ page }) => {
    await page.goto('/orlando/');
    await page.getByRole('heading', { level: 1 }).waitFor();

    const anterior = page.getByRole('link', { name: 'Destaques', exact: true });
    const alvo = page.getByRole('link', { name: 'Parques', exact: true });

    // Foca o tabável anterior e avança com um Tab REAL: `.focus()` direto no
    // alvo é foco programático e não aciona o heurístico de :focus-visible do
    // Chromium — o teste passaria sem exercitar a regra que esta PR adiciona.
    // Mesmo padrão de tests/e2e/landing-consultoria-content.spec.ts.
    await anterior.focus();
    await page.keyboard.press('Tab');
    await expect(alvo).toBeFocused();

    const estilo = await alvo.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        width: cs.outlineWidth,
        style: cs.outlineStyle,
        // Segundo sinal exigido pelo PRODUCT.md, além do outline.
        shadow: cs.boxShadow,
      };
    });

    // O padrão do Chrome é `auto 1px rgb(0,95,204)` — some numa página de
    // bordas pretas de 2–4px.
    expect(parseFloat(estilo.width)).toBeGreaterThanOrEqual(3);
    expect(estilo.style).toBe('solid');
    expect(estilo.shadow, 'falta o segundo sinal de foco').not.toBe('none');
  });

  test('os controles fora do OrlandoApp também recebem foco visível', async ({ page }) => {
    await page.goto('/orlando/');
    await page.getByRole('heading', { level: 1 }).waitFor();

    // O escopo `.landing-orlando` termina no <OrlandoApp />: o backlink do topo
    // e os controles do bloco de SEO são irmãos na mesma rota e ficavam com o
    // foco padrão do browser (achado do review da PR #1351).
    const controles = [
      page.getByRole('link', { name: /Voltar para o site principal/i }),
      page.getByRole('button', { name: 'Falar com especialista' }),
      page.getByRole('link', { name: 'Ver pacote Beto Carrero' }),
    ];

    for (const controle of controles) {
      await controle.scrollIntoViewIfNeeded();

      // Shift+Tab e volta: o último movimento precisa ser um Tab REAL, senão o
      // Chromium não considera o foco como vindo do teclado e :focus-visible
      // não dispara — o teste passaria com a regra ausente. Mesmo motivo do
      // teste acima; aqui o vaivém evita ter de saber quem é o tabável
      // anterior de cada controle.
      await controle.focus();
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Tab');
      await expect(controle).toBeFocused();

      const estilo = await controle.evaluate((el) => {
        const cs = getComputedStyle(el);
        return { style: cs.outlineStyle, width: cs.outlineWidth, shadow: cs.boxShadow };
      });
      const nome = (await controle.textContent())?.trim().slice(0, 30);
      expect(estilo.style, `sem outline em "${nome}"`).not.toBe('none');
      expect(parseFloat(estilo.width), `outline fino em "${nome}"`).toBeGreaterThanOrEqual(2);
      // Dois sinais, como o PRODUCT.md exige — não só o outline.
      expect(estilo.shadow, `sem segundo sinal em "${nome}"`).not.toBe('none');
    }
  });
});
