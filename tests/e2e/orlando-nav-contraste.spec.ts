import { test, expect } from '@playwright/test';

/*
  Trava os dois defeitos corrigidos no critique de /orlando:

  1. A navegação interna não rolava. `overflow-x: hidden` em `.landing-orlando`
     tornava o container o ancestral rolável mais próximo, então o navegador
     tentava rolar ELE ao seguir uma âncora — e ele não tem overflow próprio.
  2. 10 pares de texto reprovavam WCAG AA, incluindo o H1 e os CTAs.

  A identidade "scrapbook" da página é deliberada (decisão do dono, mesma
  exceção da /beto-carrero com Fredoka/Nunito). Estes testes NÃO verificam
  aderência ao DESIGN.md — só rolagem e contraste, que valem em qualquer
  identidade.
*/

test.describe('/orlando — navegação e contraste', () => {
  /*
    ATENÇÃO ao alterar: este teste valida o comportamento, mas NÃO é o guard da
    regressão. Verificado empiricamente — com `overflow-x: hidden` de volta ele
    continua passando, porque o defeito só se manifesta em produção, não no dev
    server que o Playwright levanta. Quem trava a reversão é o teste seguinte,
    que checa o valor computado de overflow-x.
  */
  test('os links do menu rolam a página até a seção', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/orlando/');

    // Espera a hidratação: sem isso o evaluate abaixo roda antes de o menu
    // existir e o teste falha por motivo errado.
    await expect(page.getByRole('link', { name: 'Parques', exact: true })).toBeVisible();

    const before = await page.evaluate(() => window.scrollY);
    expect(before).toBe(0);

    // Clique programático, não `locator.click()`: os actionability checks do
    // Playwright rolam o elemento para a viewport antes de clicar, e essa
    // rolagem mascarava o defeito — o teste passava verde com o bug presente.
    await page.evaluate(() => {
      const link = [...document.querySelectorAll('a[href^="#"]')].find((a) =>
        /parques/i.test(a.textContent ?? ''),
      ) as HTMLAnchorElement | undefined;
      if (!link) throw new Error('link "Parques" não encontrado no menu');
      link.click();
    });

    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 })
      .toBeGreaterThan(500);
  });

  test('o container não cria contexto de rolagem próprio', async ({ page }) => {
    await page.goto('/orlando/');

    // `clip` corta igual a `hidden` sem virar ancestral rolável. Se alguém
    // reverter para `hidden`, o menu volta a ficar morto.
    const overflowX = await page
      .locator('.landing-orlando')
      .evaluate((el) => getComputedStyle(el).overflowX);
    expect(overflowX).toBe('clip');
  });

  test('nenhum texto da página reprova WCAG AA', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/orlando/');
    // Mesma razão do teste anterior: sem esperar a landing hidratar, a
    // varredura roda sobre um DOM parcial e não vê os pares que importam.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.waitForLoadState('networkidle');

    const failures = await page.evaluate(() => {
      // Resolve a cor pelo canvas: a paleta chega como oklab()/oklch() e um
      // parser ingênuo produz falso positivo.
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      const toRGBA = (color: string): [number, number, number, number] => {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = '#000';
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        const d = ctx.getImageData(0, 0, 1, 1).data;
        return [d[0], d[1], d[2], d[3] / 255];
      };
      const luminance = ([r, g, b]: number[]) => {
        const f = (v: number) => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const contrast = (fg: number[], bg: number[]) => {
        const a = luminance(fg);
        const b = luminance(bg);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      };
      const effectiveBg = (el: Element): number[] => {
        let node: Element | null = el;
        while (node && node !== document.documentElement) {
          const bg = toRGBA(getComputedStyle(node).backgroundColor);
          if (bg[3] > 0.9) return bg;
          node = node.parentElement;
        }
        return [255, 255, 255, 1];
      };

      const out: string[] = [];
      const scope = document.querySelector('.landing-orlando');
      if (!scope) return ['.landing-orlando não encontrado'];

      scope.querySelectorAll('p,a,span,li,h1,h2,h3,h4,button,strong').forEach((el) => {
        const text = Array.from(el.childNodes)
          .filter((n) => n.nodeType === 3)
          .map((n) => n.textContent?.trim() ?? '')
          .join(' ')
          .trim();
        if (!text || text.length < 3) return;

        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.1) return;
        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const ratio = contrast(toRGBA(cs.color), effectiveBg(el));
        const size = parseFloat(cs.fontSize);
        const bold = parseInt(cs.fontWeight, 10) >= 700;
        const min = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
        if (ratio < min) {
          out.push(`"${text.slice(0, 40)}" ${ratio.toFixed(2)}:1 (mín ${min})`);
        }
      });
      return out;
    });

    expect(failures).toEqual([]);
  });
});
