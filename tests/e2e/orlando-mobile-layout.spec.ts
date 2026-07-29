import { test, expect } from '@playwright/test';

/*
  Trava os defeitos de layout mobile da issue #1327, medidos a 320/360/375px.

  A identidade "scrapbook" da página é deliberada (decisão do dono, mesma
  exceção da /beto-carrero com Fredoka/Nunito). Nada aqui verifica aderência ao
  DESIGN.md — só corte, cobertura e alvo de toque, que valem em qualquer
  identidade.

  NÃO usar `getBoundingClientRect` para detectar sobreposição de texto neste
  arquivo: `.highlight-blue` tem `rotate(-1.5deg)` e a caixa alinhada aos eixos
  fica ~9px mais alta que o elemento, o que produz "sobreposição" fantasma de
  4px em qualquer viewport. Foi o que mascarou o diagnóstico inicial do H1.
*/

const NARROW = [320, 360, 375] as const;

for (const width of NARROW) {
  test(`a ${width}px o menu cabe inteiro na tela`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/orlando/');
    await page.getByRole('heading', { level: 1 }).waitFor();

    // A nav tem largura natural de 385px e não quebrava: nessas larguras o
    // primeiro e o último item eram cortados pela borda (o container corta,
    // não rola, então o usuário não tinha como alcançá-los).
    const nav = page.locator('.landing-orlando .nav-links');
    const box = await nav.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(-0.5);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width + 0.5);

    for (const name of ['Destaques', 'Parques', 'Roteiro', 'Contato']) {
      const item = await page.getByRole('link', { name, exact: true }).boundingBox();
      expect(item, `item "${name}"`).not.toBeNull();
      expect(item!.x, `"${name}" cortado à esquerda`).toBeGreaterThanOrEqual(-0.5);
      expect(item!.x + item!.width, `"${name}" cortado à direita`).toBeLessThanOrEqual(width + 0.5);
    }
  });
}

test('nenhum alvo de toque fica abaixo de 44px em mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await page.goto('/orlando/');
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.waitForLoadState('networkidle');

  const undersized = await page.evaluate(() =>
    [...document.querySelectorAll('.landing-orlando a, .landing-orlando button')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.height > 0 && r.height < 44;
      })
      .map((el) => `${el.tagName} "${el.textContent?.trim().slice(0, 24)}" ${el.getBoundingClientRect().height.toFixed(0)}px`),
  );

  expect(undersized).toEqual([]);
});

test('as legendas das polaroides não ficam cobertas', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await page.goto('/orlando/');
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.waitForLoadState('networkidle');

  const covered = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.landing-orlando .card')];
    const out: string[] = [];

    // O cartão seguinte subia sobre a legenda do anterior (margin-top negativo)
    // e comia ~20% dela.
    cards.forEach((card, i) => {
      const label = card.querySelector('.card-label');
      const next = cards[i + 1];
      if (!label || !next) return;
      const lr = label.getBoundingClientRect();
      const nr = next.getBoundingClientRect();
      const overlap = lr.bottom - nr.top;
      if (overlap > 0.5) {
        out.push(`"${label.textContent?.trim()}" coberta ${overlap.toFixed(0)}px pelo cartão seguinte`);
      }
    });

    // E o selo verde cobria as primeiras letras da última legenda.
    const badge = document.querySelector('.landing-orlando .badge-2');
    const lastLabel = [...document.querySelectorAll('.landing-orlando .card-label')].at(-1);
    if (badge && lastLabel) {
      const b = badge.getBoundingClientRect();
      const l = lastLabel.getBoundingClientRect();
      const intersects = !(b.right < l.left || b.left > l.right || b.bottom < l.top || b.top > l.bottom);
      if (intersects) out.push(`selo sobre "${lastLabel.textContent?.trim()}"`);
    }

    return out;
  });

  expect(covered).toEqual([]);
});

test('os cartões de destaque não estouram a tela a 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/orlando/');
  await page.getByRole('heading', { level: 1 }).waitFor();

  // `minmax(280px, 1fr)` impedia a coluna de encolher: o cartão saía 12px pela
  // direita. O fix é `min(280px, 100%)` como piso.
  const overflowing = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    return [...document.querySelectorAll('.landing-orlando .feature-item')]
      .filter((el) => el.getBoundingClientRect().right > vw + 0.5)
      .map((el) => `${el.textContent?.trim().slice(0, 20)} right=${el.getBoundingClientRect().right.toFixed(0)} vw=${vw}`);
  });

  expect(overflowing).toEqual([]);
});
