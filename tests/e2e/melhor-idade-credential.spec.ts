import { test, expect } from '@playwright/test';

test.describe('credencial Pastore na landing Melhor Idade', () => {
  test.use({ viewport: { width: 320, height: 568 } });

  test('aparece entre o título e o conteúdo, sem sombra nem overflow horizontal', async ({ page }) => {
    await page.goto('/melhor-idade/');

    const heading = page.getByRole('heading', {
      level: 2,
      name: 'Por que planejar sua viagem 50+ com a Anhangá?',
    });
    const credential = page.getByText('Parceira Pastore Turismo', { exact: true });
    const firstParagraph = page.getByText('Viajar na maturidade exige um olhar diferente.', {
      exact: false,
    });

    await heading.scrollIntoViewIfNeeded();
    await expect(credential).toBeVisible();
    await expect(credential).toHaveCSS('box-shadow', 'none');
    await expect(credential).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(credential).toHaveCSS('border-top-style', 'solid');
    await expect(credential).toHaveCSS('border-top-width', '1px');
    await expect(credential.locator('svg')).toHaveAttribute('aria-hidden', 'true');

    const headingBox = await heading.boundingBox();
    const credentialBox = await credential.boundingBox();
    const paragraphBox = await firstParagraph.boundingBox();
    expect(headingBox).not.toBeNull();
    expect(credentialBox).not.toBeNull();
    expect(paragraphBox).not.toBeNull();
    const borderRadius = await credential.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).borderTopLeftRadius),
    );
    expect(borderRadius).toBeGreaterThanOrEqual(credentialBox!.height / 2);
    expect(credentialBox!.y).toBeGreaterThanOrEqual(headingBox!.y + headingBox!.height);
    expect(paragraphBox!.y).toBeGreaterThanOrEqual(credentialBox!.y + credentialBox!.height);

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
});
