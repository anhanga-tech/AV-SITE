import { test, expect } from '@playwright/test';

const BLOG_LIST_PATH = '/blog';
const SEARCH_INPUT = '#blog-search-input';
const RESULTS_COUNT = '[data-testid="blog-search-results-count"]';

test.describe('blog list search feedback', () => {
  test('announces the result count as the filter updates', async ({ page }) => {
    await page.goto(BLOG_LIST_PATH);

    const results = page.locator(RESULTS_COUNT);

    // Status region is a polite live region for assistive tech.
    await expect(results).toHaveAttribute('role', 'status');
    await expect(results).toHaveAttribute('aria-live', 'polite');

    // No count is shown before the user searches, avoiding noise on load.
    await expect(results).toHaveText('');

    await page.fill(SEARCH_INPUT, 'zzzzzznotarealterm');
    await expect(results).toHaveText('0 artigos encontrados');

    // Clearing the search removes the count again.
    await page.fill(SEARCH_INPUT, '');
    await expect(results).toHaveText('');
  });

  test('offers a clear-search button when no articles match', async ({ page }) => {
    await page.goto(BLOG_LIST_PATH);

    await page.fill(SEARCH_INPUT, 'zzzzzznotarealterm');

    const clearButton = page.getByRole('button', { name: 'Limpar busca' });
    await expect(clearButton).toBeVisible();

    await clearButton.click();

    await expect(page.locator(SEARCH_INPUT)).toHaveValue('');
    await expect(page.locator(SEARCH_INPUT)).toBeFocused();
    await expect(clearButton).toBeHidden();
  });
});
