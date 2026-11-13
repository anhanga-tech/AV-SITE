import { test, expect } from '@playwright/test';

// Páginas de autor (/autor/<id>/): 200, h1 com o nome, bio já cadastrada, link para /sobre/
// e lista de posts do próprio autor.
const AUTHORS = [
  { id: 'felipe-william', name: 'Felipe William', role: 'Consultor de Viagens', bio: /Explorador incansável/ },
  { id: 'queila-oliveira', name: 'Queila de Oliveira', role: 'Especialista em Viagens', bio: /Apaixonada por conectar pessoas/ },
];

test.describe('Página de autor', () => {
  for (const author of AUTHORS) {
    test(`/autor/${author.id}/ mostra nome, bio, /sobre/ e posts do autor`, async ({ page }) => {
      const response = await page.goto(`/autor/${author.id}/`);
      expect(response?.status()).toBe(200);

      await expect(page.getByRole('heading', { level: 1, name: author.name })).toBeVisible();
      await expect(page).toHaveTitle(new RegExp(`${author.name}, ${author.role}`));
      const main = page.locator('main');
      await expect(main.getByText(author.role, { exact: true })).toBeVisible();
      await expect(main.getByText(author.bio)).toBeVisible();
      await expect(main.getByRole('link', { name: `Instagram de ${author.name}` })).toBeVisible();
      await expect(main.getByRole('link', { name: `LinkedIn de ${author.name}` })).toBeVisible();
      await expect(main.locator('a[href="/sobre/"]')).toBeVisible();

      const postLinks = page.getByTestId('author-posts').getByRole('link');
      expect(await postLinks.count()).toBeGreaterThan(0);
      await expect(postLinks.first()).toHaveAttribute('href', /^\/blog\/[a-z0-9-]+\/$/);

      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        `https://www.anhanga.tur.br/autor/${author.id}/`
      );
    });
  }

  test('byline de um post leva à página do autor', async ({ page }) => {
    await page.goto('/blog/como-planejar-viagem-orlando-sob-medida/');
    const byline = page.getByTestId('blog-post-hero').getByRole('link', { name: 'Felipe William' });
    await expect(byline).toHaveAttribute('href', '/autor/felipe-william/');
    await byline.click();
    await expect(page).toHaveURL(/\/autor\/felipe-william\/$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Felipe William' })).toBeVisible();
  });
});
