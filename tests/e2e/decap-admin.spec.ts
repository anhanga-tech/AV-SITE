import { expect, test } from '@playwright/test';

test.describe('Decap CMS admin', () => {
  test('loads /admin with editorial workflow config and without React compatibility errors', async ({ page }) => {
    const consoleMessages: string[] = [];
    const configResponse = await page.request.get('/admin/config.yml');

    expect(configResponse.status()).toBe(200);
    const configText = await configResponse.text();

    expect(configText).toContain('publish_mode: editorial_workflow');
    expect(configText).toContain('media_folder: public/uploads');
    expect(configText).toContain('public_folder: /uploads');
    expect(configText).toContain('site_url: https://www.anhanga.tur.br');
    expect(configText).toContain('display_url: https://www.anhanga.tur.br');

    for (const fieldName of [
      'title',
      'excerpt',
      'date',
      'dateModified',
      'author',
      'category',
      'image',
      'featured',
      'tags',
      'seoTitle',
      'seoDescription',
      'body',
    ]) {
      expect(configText).toMatch(new RegExp(`name:\\s+${fieldName}\\b`));
    }

    expect(configText).toMatch(/value:\s+equipe-anhanga\b/);

    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') {
        consoleMessages.push(message.text());
      }
    });

    await page.goto('/admin');

    await expect(page).toHaveURL(/\/admin(?:\/)?(?:#\/)?$/);
    await expect(page.getByTestId('not-found-section')).toHaveCount(0);

    await expect
      .poll(
        async () => page.locator('#nc-root').evaluate((element) => element.childElementCount).catch(() => 0),
        { message: 'Decap CMS should render its app inside #nc-root' },
      )
      .toBeGreaterThan(0);

    const reactCompatibilityErrors = consoleMessages.filter((message) =>
      /reactdom\.render|finddomnode|not supported in react 19|legacy context api/i.test(message),
    );

    expect(reactCompatibilityErrors).toEqual([]);
  });
});
