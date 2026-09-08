import { expect, test } from '@playwright/test';

const FIRST_POST = '/blog/rock-in-rio-2026-guia-viagem-rio/';
const FIRST_POST_SLUG = 'rock-in-rio-2026-guia-viagem-rio';
const SECOND_POST = '/blog/roteiro-bonito-ms-5-dias/';
const SECOND_POST_SLUG = 'roteiro-bonito-ms-5-dias';
const BODY_MARKER = (slug: string) => `[data-blog-post-body="${slug}"]`;

test.beforeEach(async ({ context, baseURL }) => {
  const localOrigin = new URL(baseURL!).origin;
  await context.route('**/*', (route) =>
    new URL(route.request().url()).origin === localOrigin
      ? route.continue()
      : route.abort(),
  );
});

// Run after pnpm build with --config playwright.prerender.config.ts.
test('direct blog visit renders the body and SPA navigation loads another article without hydration errors', async ({
  page,
}) => {
  const hydrationErrors: string[] = [];
  const articleChunks = new Set<string>();
  page.on('request', (request) => {
    const pathname = new URL(request.url()).pathname;
    if (pathname.startsWith('/assets/blog/')) articleChunks.add(pathname);
  });
  page.on('pageerror', (error) => hydrationErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && /hydrat|did not match|server rendered/i.test(message.text())) {
      hydrationErrors.push(message.text());
    }
  });

  const response = await page.goto(FIRST_POST);
  expect(response?.ok()).toBe(true);
  const initialHtml = await response!.text();
  expect(initialHtml).toContain('data-prerendered="true"');
  expect(initialHtml).toContain(`data-blog-post-body="${FIRST_POST_SLUG}"`);
  expect(initialHtml).toContain('O calendário da edição 2026 do Rock in Rio');

  // Corpo presente e visível após hidratação/render.
  await expect(page.locator(BODY_MARKER(FIRST_POST_SLUG))).toContainText(
    'O calendário da edição 2026 do Rock in Rio',
  );
  await expect(page.getByRole('button', { name: 'Abrir assistente virtual' })).toBeVisible();
  expect([...articleChunks]).toHaveLength(1);
  expect([...articleChunks][0]).toContain(FIRST_POST_SLUG);

  // Navegação SPA para o segundo artigo.
  await page.evaluate((path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, SECOND_POST);

  await expect(page).toHaveURL(new RegExp(SECOND_POST.replace(/\//g, '\\/') + '?$'));
  await expect(page.locator(BODY_MARKER(SECOND_POST_SLUG))).toBeVisible();
  expect([...articleChunks]).toHaveLength(2);
  expect([...articleChunks].some((path) => path.includes(SECOND_POST_SLUG))).toBe(true);
  expect(hydrationErrors).toEqual([]);
});

test('keeps the prerendered article visible while its chunk is delayed', async ({ page }) => {
  let releaseChunk!: () => void;
  const chunkGate = new Promise<void>((resolve) => { releaseChunk = resolve; });
  await page.route(`**/assets/blog/${FIRST_POST_SLUG}-*.js`, async (route) => {
    await chunkGate;
    await route.continue();
  });

  try {
    await page.goto(FIRST_POST, { waitUntil: 'domcontentloaded' });
    // The client-only assistant proves React has mounted while MDX is still pending.
    await expect(page.getByRole('button', { name: 'Abrir assistente virtual' })).toBeVisible();
    await expect(page.locator(BODY_MARKER(FIRST_POST_SLUG))).toBeVisible();
    await expect(page.locator(BODY_MARKER(FIRST_POST_SLUG))).toContainText(
      'O calendário da edição 2026 do Rock in Rio',
    );
  } finally {
    releaseChunk();
  }
});

for (const entry of ['direct', 'spa'] as const) {
  test(`${entry} article chunk failure shows recovery after one automatic reload`, async ({ page }) => {
    const errors: string[] = [];
    let failedRequests = 0;
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route(`**/assets/blog/${SECOND_POST_SLUG}-*.js`, (route) => {
      failedRequests += 1;
      return route.abort('failed');
    });

    if (entry === 'spa') {
      await page.goto(FIRST_POST);
      await expect(page.getByRole('button', { name: 'Abrir assistente virtual' })).toBeVisible();
      await page.evaluate((path) => {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, SECOND_POST);
    } else {
      await page.goto(SECOND_POST, { waitUntil: 'commit' });
    }

    await expect(page.getByRole('button', { name: 'Atualizar página', exact: true })).toBeVisible();
    await expect(page.locator('header')).toBeVisible();
    expect(failedRequests).toBe(2);
    expect(errors).toEqual([]);
  });
}
