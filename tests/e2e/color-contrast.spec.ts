import { createRequire } from 'node:module';
import { test, expect } from '@playwright/test';

/*
  Guard da issue #1970 (item 8). Roda a regra `color-contrast` do axe-core
  nas URLs da auditoria de 01/11/2026, em viewport mobile e desktop. Antes da
  correção eram ~140 nós reprovados (Céu Vivo como texto a 2.8:1, branco sobre
  Céu Vivo, zinc-400 em fundo claro, paleta fun da /beto-carrero).

  Rola a página inteira antes de medir para montar as seções lazy/whileInView,
  e espera as animações de entrada assentarem — sem isso o axe mede o texto
  ainda a meio fade e reporta falso positivo.
*/

const require = createRequire(import.meta.url);
const AXE_PATH = require.resolve('axe-core/axe.min.js');

const ROUTES = ['/', '/beto-carrero/', '/blog/viagem-solo-depois-dos-50/', '/lollapalooza/', '/corporativo/', '/cruzeiros/', '/hopi-hari/'];

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1350, height: 940 },
];

interface ContrastNode {
  target: string;
  html: string;
  ratio: number | undefined;
}

for (const viewport of VIEWPORTS) {
  test.describe(`contraste AA — ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const route of ROUTES) {
      test(`${route} sem falhas de color-contrast`, async ({ page }) => {
        test.slow();
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto(route);
        await page.getByRole('heading', { level: 1 }).first().waitFor();

        await page.evaluate(async () => {
          const step = Math.max(400, Math.floor(window.innerHeight * 0.8));
          for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
            window.scrollTo(0, y);
            await new Promise((resolve) => setTimeout(resolve, 120));
          }
          window.scrollTo(0, 0);
        });
        await page.waitForTimeout(800);

        await page.addScriptTag({ path: AXE_PATH });
        const nodes = await page.evaluate(async (): Promise<ContrastNode[]> => {
          const axe = (window as unknown as { axe: { run: (ctx: Document, opts: object) => Promise<{ violations: Array<{ nodes: Array<{ target: string[]; html: string; any: Array<{ data?: { contrastRatio?: number } }> }> }> }> } }).axe;
          const result = await axe.run(document, { runOnly: ['color-contrast'] });
          return result.violations.flatMap((violation) => violation.nodes.map((node) => ({
            target: node.target.join(' '),
            html: node.html.slice(0, 160),
            ratio: node.any[0]?.data?.contrastRatio,
          })));
        });

        expect(nodes, 'nós reprovados em color-contrast').toEqual([]);
      });
    }
  });
}
