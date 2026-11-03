import { test, expect, type Page } from '@playwright/test';

/*
  Guards da issue #1970 (item 6). Auditoria OpenSEO/Lighthouse apontou
  `heading-order` (pulos H3→H5 no "Leia Também" do blog, H2 do headliner
  antes do H1 na Lolla) e landings sem landmark `<main>`. Verifica, no DOM
  hidratado de cada rota: exatamente um `<main>`, exatamente um H1 que vem
  antes de qualquer outro heading e nenhum salto de nível maior que um.
*/

const ROUTES = [
  '/',
  '/blog/viagem-solo-depois-dos-50/',
  '/mapa-do-site/',
  '/beto-carrero/',
  '/orlando/',
  '/hopi-hari/',
  '/lollapalooza/',
  '/consultoria-de-viagem/',
  '/cruzeiros/',
  '/corporativo/',
  '/melhor-idade/',
  '/melhor-idade/pacotes-pastore/',
  '/quiz/',
];

async function collectOutline(page: Page) {
  return page.evaluate(() => ({
    mainCount: document.querySelectorAll('main').length,
    levels: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((el) => Number(el.tagName[1])),
  }));
}

for (const route of ROUTES) {
  test(`${route} tem um <main> e headings em ordem`, async ({ page }) => {
    await page.goto(route);
    await page.getByRole('heading', { level: 1 }).first().waitFor();

    const { mainCount, levels } = await collectOutline(page);

    expect(mainCount, 'quantidade de <main>').toBe(1);
    expect(levels.filter((level) => level === 1), 'quantidade de H1').toHaveLength(1);
    expect(levels[0], 'o primeiro heading da página deve ser o H1').toBe(1);

    const skips = levels.flatMap((level, i) => (i > 0 && level > levels[i - 1] + 1 ? [`h${levels[i - 1]}→h${level}`] : []));
    expect(skips, 'saltos de nível de heading').toEqual([]);
  });
}
