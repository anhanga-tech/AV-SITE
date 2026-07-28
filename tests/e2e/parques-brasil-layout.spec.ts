import { test, expect } from '@playwright/test';

/*
  Trava os defeitos de layout corrigidos em 2c41e98, todos invisíveis no código
  e só detectáveis renderizado. As asserções são geométricas e estruturais — não
  medem quebra de linha nem largura de texto, que variam entre a renderização de
  fonte do macOS e a do Chromium no CI Linux.
*/

test.describe('layout do hub /parques-brasil', () => {
  test('em mobile: nada atrás do Header fixo e sem overflow horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/parques-brasil/');

    const header = page.locator('header').first();
    // Escopado ao hero: o Footer também tem um link "Parques do Brasil", e um
    // getByText solto casava com ele — o assert passava mesmo com o hero
    // inteiro escondido atrás do Header.
    const hero = page.locator('section').filter({ has: page.getByRole('heading', { level: 1 }) });
    const eyebrow = hero.getByText('Parques do Brasil', { exact: true });
    await expect(eyebrow).toBeVisible();

    // O Header é `fixed`: o topo do conteúdo precisa começar abaixo dele, senão
    // o primeiro elemento do hero nasce coberto (o defeito original era pt-14
    // contra um header de 72px).
    const headerBox = await header.boundingBox();
    const eyebrowBox = await eyebrow.boundingBox();
    expect(headerBox).not.toBeNull();
    expect(eyebrowBox).not.toBeNull();
    expect(eyebrowBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height);

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });

  test('as seções compartilham o mesmo eixo esquerdo', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/parques-brasil/');

    // Larguras de container diferentes (max-w-4xl no hero contra max-w-5xl nas
    // demais) faziam a coluna "pular" ao rolar.
    const headings = [
      page.getByRole('heading', { level: 1 }),
      page.getByRole('heading', { level: 2, name: 'Onde emitimos o ingresso oficial' }),
      page.getByRole('heading', { level: 2, name: 'Os aquáticos, com a viagem inteira montada' }),
      page.getByRole('heading', { level: 2, name: 'Os cinco lado a lado' }),
      page.getByRole('heading', { level: 2, name: /^Cacau Park, em Itu/ }),
    ];

    const lefts: number[] = [];
    for (const heading of headings) {
      await heading.scrollIntoViewIfNeeded();
      const box = await heading.boundingBox();
      expect(box).not.toBeNull();
      lefts.push(box!.x);
    }

    for (const left of lefts) {
      expect(Math.abs(left - lefts[0])).toBeLessThanOrEqual(1);
    }
  });

  test('a tabela comparativa rola sozinha em vez de estourar a página', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/parques-brasil/');

    const table = page.locator('table');
    await table.scrollIntoViewIfNeeded();
    await expect(table).toBeVisible();

    const wrapperOverflowX = await table.evaluate(
      (el) => getComputedStyle(el.parentElement as HTMLElement).overflowX,
    );
    expect(wrapperOverflowX).toBe('auto');

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });

  test('os cards credenciados alinham o topo do conteúdo', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/parques-brasil/');

    const beto = page.getByRole('heading', { level: 3, name: 'Beto Carrero World' });
    const hopi = page.getByRole('heading', { level: 3, name: 'Hopi Hari' });
    await beto.scrollIntoViewIfNeeded();

    // Badge e local lado a lado quebravam no card estreito e derrubavam o
    // título do Hopi Hari, o que lia como acidente e não como a assimetria
    // pretendida. A tolerância cobre a diferença de tamanho entre os títulos.
    const betoBox = await beto.boundingBox();
    const hopiBox = await hopi.boundingBox();
    expect(betoBox).not.toBeNull();
    expect(hopiBox).not.toBeNull();
    expect(Math.abs(betoBox!.y - hopiBox!.y)).toBeLessThanOrEqual(12);
  });

  test('o FAQ não fica aninhado em seção dupla', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/parques-brasil/');

    const faqHeading = page.getByRole('heading', {
      level: 2,
      name: 'Perguntas que chegam antes da viagem',
    });
    await faqHeading.scrollIntoViewIfNeeded();
    await expect(faqHeading).toBeVisible();

    // LandingFAQ já traz a própria <section>; envolvê-lo em outra dobrava o
    // padding e descolava o bloco do resto da página.
    const nestedSections = await faqHeading.evaluate((el) => {
      const section = el.closest('section');
      return section?.parentElement?.closest('section') ? 1 : 0;
    });
    expect(nestedSections).toBe(0);
  });

  test('todo alvo de toque da página tem pelo menos 44px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/parques-brasil/');

    const undersized = await page.evaluate(() => {
      const main = document.getElementById('main-content');
      const scope: ParentNode = main?.querySelector('section') ? main : document;
      return [...scope.querySelectorAll('section a, section button')]
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          return rect.height > 0 && rect.height < 44;
        })
        .map((el) => `${el.tagName}: ${el.textContent?.trim().slice(0, 30)}`);
    });

    expect(undersized).toEqual([]);
  });
});
