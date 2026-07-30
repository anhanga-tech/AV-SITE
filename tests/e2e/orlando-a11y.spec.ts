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
    // e o CTA do bloco de SEO são irmãos na mesma rota e ficavam com o foco
    // padrão do browser (achado do review da PR #1351).
    // A #1328 removeu os outros três controles deste bloco (Beto Carrero, blog,
    // Visit Orlando externo): tiravam o visitante do funil bem no ponto de
    // maior intenção de conversão. Restam só os dois que continuam na página.
    const controles = [
      page.getByRole('link', { name: /Voltar para o site principal/i }),
      page.getByRole('button', { name: 'Falar com especialista' }),
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

  test('o relevo da colagem sobrevive ao foco por teclado', async ({ page }) => {
    await page.goto('/orlando/');
    await page.getByRole('heading', { level: 1 }).waitFor();

    // `box-shadow` não soma entre regras: a regra genérica de foco apagaria a
    // sombra "sticker" do logo e do CTA, que é o relevo 3D da colagem — eles
    // perderiam o peso físico justamente ao serem alcançados por teclado.
    const cta = page.getByRole('button', { name: 'Solicitar Orçamento' });
    await cta.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(cta).toBeFocused();

    const shadow = await cta.evaluate((el) => getComputedStyle(el).boxShadow);

    // Verificar os dois valores nominalmente, e não contar vírgulas: o
    // computed style traz cores como `rgb(209, 53, 107)`, então um split(',')
    // acha várias partes mesmo com UMA sombra só — o teste passava sem a regra.
    expect(shadow, 'faltou a borda rosa de foco').toContain('inset');
    expect(shadow, `faltou a sombra dura da colagem — veio "${shadow}"`).toMatch(
      /(?<!inset[^,]*)\b4px 4px\b/,
    );
  });

  // Companion do teste acima, para a #1328: a aba do FAQ também tem sombra
  // hard própria (`.faq-tab`) e caiu na mesma regra genérica de foco sem a
  // composição — perderia o relevo exatamente como .logo e .main-btn já
  // perderam antes da #1329.
  test('o relevo da aba do FAQ sobrevive ao foco por teclado', async ({ page }) => {
    await page.goto('/orlando/');
    await page.getByRole('heading', { level: 1 }).waitFor();

    const tab = page.getByRole('button', { name: 'Qual a melhor época para viajar para Orlando?' });
    await tab.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(tab).toBeFocused();

    const shadow = await tab.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(shadow, 'faltou a borda rosa de foco').toContain('inset');
    expect(shadow, `faltou a sombra dura da aba — veio "${shadow}"`).toMatch(
      /(?<!inset[^,]*)\b4px 4px\b/,
    );
  });

  // Review do Codex na #1352: o painel fechado (`grid-template-rows: 0fr` +
  // overflow hidden) some visualmente, mas continuava na árvore de
  // acessibilidade — um leitor de tela em modo de navegação por virtual
  // cursor conseguia ler a resposta de uma pergunta "fechada", tornando
  // `aria-expanded="false"` enganoso.
  test('a resposta fechada do FAQ sai da árvore de acessibilidade', async ({ page }) => {
    await page.goto('/orlando/');
    await page.getByRole('heading', { level: 1 }).waitFor();

    // O primeiro item vem aberto por padrão — testa o segundo, que começa fechado.
    const segundaAba = page.getByRole('button', { name: 'Preciso de visto americano para viajar para Orlando?' });
    await expect(segundaAba).toHaveAttribute('aria-expanded', 'false');

    // useFaqAccordion.ts prefixa os ids com useId() (review do Codex na #1363)
    // — resolve o painel via aria-controls em vez de um id fixo, e usa
    // [id="..."] porque useId() gera ":" no valor, que quebra como seletor
    // CSS de id sem escapar.
    const panelId = await segundaAba.getAttribute('aria-controls');
    const painel = page.locator(`[id="${panelId}"]`);
    await expect(painel).toHaveAttribute('aria-hidden', 'true');

    await segundaAba.click();
    await expect(segundaAba).toHaveAttribute('aria-expanded', 'true');
    await expect(painel).toHaveAttribute('aria-hidden', 'false');
  });
});
