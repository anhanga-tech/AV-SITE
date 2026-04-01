import { test, expect, type Page } from '@playwright/test';

const BLOG_LIST_PATH = '/blog';
const BLOG_POST_PATH = '/blog/viagem-solo-feminina-ganha-espaco-nos-cruzeiros-da-norwegian-cruise-line';
const MAIN_CONTENT_SELECTOR = '#main-content';
const MOBILE_VIEWPORT_BREAKPOINT = 768;
const ARTICLE_MIN_GAP_MOBILE = 16;
const ARTICLE_MIN_GAP_DESKTOP = 24;
const LIST_MIN_GAP_MOBILE = 12;
const LIST_MIN_GAP_DESKTOP = 20;

async function expectSingleVisibleHeadingInMain(page: Page) {
  const mainContent = page.locator(MAIN_CONTENT_SELECTOR);
  const headings = mainContent.getByRole('heading', { level: 1 });
  const heading = headings.first();

  await expect(headings).toHaveCount(1);
  await expect(heading).toBeVisible();
}

async function expectInternalHeaderVariant(page: Page) {
  await expect(page.getByTestId('site-header')).toHaveAttribute('data-header-variant', 'internal');
}

async function getHeadingGap(page: Page) {
  const header = page.getByTestId('site-header');
  const heading = page.locator(MAIN_CONTENT_SELECTOR).getByRole('heading', { level: 1 }).first();

  const [headerBox, headingBox] = await Promise.all([
    header.boundingBox(),
    heading.boundingBox(),
  ]);

  if (!headerBox || !headingBox) {
    throw new Error('Expected site header and blog heading to be measurable.');
  }

  return headingBox.y - (headerBox.y + headerBox.height);
}

async function expectHeadingBelowHeader(page: Page, minGap: number) {
  await expectSingleVisibleHeadingInMain(page);
  await expect.poll(() => getHeadingGap(page)).toBeGreaterThanOrEqual(minGap);
}

test('blog article hero keeps the title below the fixed header', async ({ page }) => {
  await page.goto(BLOG_POST_PATH);

  await expectInternalHeaderVariant(page);

  const viewportWidth = page.viewportSize()?.width ?? 0;
  const minGap = viewportWidth < MOBILE_VIEWPORT_BREAKPOINT
    ? ARTICLE_MIN_GAP_MOBILE
    : ARTICLE_MIN_GAP_DESKTOP;

  await expectHeadingBelowHeader(page, minGap);
});

test('blog list keeps the title below the fixed header', async ({ page }) => {
  await page.goto(BLOG_LIST_PATH);

  await expectInternalHeaderVariant(page);

  const viewportWidth = page.viewportSize()?.width ?? 0;
  const minGap = viewportWidth < MOBILE_VIEWPORT_BREAKPOINT
    ? LIST_MIN_GAP_MOBILE
    : LIST_MIN_GAP_DESKTOP;

  await expectHeadingBelowHeader(page, minGap);
});
