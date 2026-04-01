import { test, expect, type Locator, type Page } from '@playwright/test';

const HOME_PATH = '/';
const BLOG_LIST_PATH = '/blog';
const BLOG_POST_PATH = '/blog/viagem-solo-feminina-ganha-espaco-nos-cruzeiros-da-norwegian-cruise-line';
const MAIN_CONTENT_SELECTOR = '#main-content';
const MOBILE_VIEWPORT_BREAKPOINT = 768;
const ARTICLE_MIN_GAP_MOBILE = 16;
const ARTICLE_MIN_GAP_DESKTOP = 24;
const LIST_MIN_GAP_MOBILE = 12;
const LIST_MIN_GAP_DESKTOP = 20;

async function getElementHeight(locator: Locator) {
  const box = await locator.boundingBox();

  if (!box) {
    throw new Error('Expected element to be measurable.');
  }

  return box.height;
}

async function getHeaderPresentation(page: Page) {
  return page.getByTestId('site-header').evaluate((element) => {
    const styles = window.getComputedStyle(element);

    return {
      backgroundColor: styles.backgroundColor,
      boxShadow: styles.boxShadow,
    };
  });
}

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

async function expectHomeHeaderVariant(page: Page) {
  await expect(page.getByTestId('site-header')).toHaveAttribute('data-header-variant', 'home');
}

async function expectExpandedTransparentHomeHeader(page: Page) {
  await expect.poll(() => getHeaderPresentation(page)).toEqual({
    backgroundColor: 'rgba(0, 0, 0, 0)',
    boxShadow: 'none',
  });

  await expect.poll(() => getElementHeight(page.getByTestId('header-logo'))).toBeGreaterThanOrEqual(90);
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

test('home header stays expanded and transparent before scroll', async ({ page }) => {
  await page.goto(HOME_PATH);

  await expectHomeHeaderVariant(page);
  await expectExpandedTransparentHomeHeader(page);
});

test('blog article hero keeps the title below the fixed header', async ({ page }) => {
  await page.goto(BLOG_POST_PATH);

  await expectInternalHeaderVariant(page);

  const viewportWidth = page.viewportSize()?.width ?? 0;
  const minGap = viewportWidth < MOBILE_VIEWPORT_BREAKPOINT
    ? ARTICLE_MIN_GAP_MOBILE
    : ARTICLE_MIN_GAP_DESKTOP;

  await expectHeadingBelowHeader(page, minGap);
});

test('internal desktop header keeps the compact desktop treatment active', async ({ page }) => {
  const viewportWidth = page.viewportSize()?.width ?? 0;

  test.skip(viewportWidth < MOBILE_VIEWPORT_BREAKPOINT, 'Desktop-only compact header verification.');

  await page.goto(HOME_PATH);

  await expectHomeHeaderVariant(page);

  const homeHeaderHeight = await getElementHeight(page.getByTestId('site-header'));
  const homeLogoHeight = await getElementHeight(page.getByTestId('header-logo'));
  const homeDesktopCtaHeight = await getElementHeight(page.getByTestId('desktop-fale-conosco-btn'));

  await page.goto(BLOG_LIST_PATH);

  await expectInternalHeaderVariant(page);
  await expect(page.locator('nav[aria-label="Menu Principal"]')).toBeVisible();
  await expect(page.getByTestId('desktop-fale-conosco-btn')).toBeVisible();

  const internalHeaderHeight = await getElementHeight(page.getByTestId('site-header'));
  const internalLogoHeight = await getElementHeight(page.getByTestId('header-logo'));
  const internalDesktopCtaHeight = await getElementHeight(page.getByTestId('desktop-fale-conosco-btn'));

  expect(internalHeaderHeight).toBeLessThan(homeHeaderHeight);
  expect(internalLogoHeight).toBeLessThan(homeLogoHeight);
  expect(internalDesktopCtaHeight).toBeLessThan(homeDesktopCtaHeight);
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
