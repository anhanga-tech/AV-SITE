import { test, expect } from '@playwright/test';

function parseStructuredData(rawJson: string): Record<string, unknown> {
  return JSON.parse(rawJson);
}

test.describe('Home structured data', () => {
  test('publishes FAQ, breadcrumb and service schemas', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Anhangá Viagens/);

    const faqScript = page.locator(
      'script[type="application/ld+json"][data-av-head="script:ld-json:faq-page"]'
    );
    await expect(faqScript).toHaveCount(1);

    const faqSchema = parseStructuredData(await faqScript.first().innerHTML());
    expect(faqSchema['@type']).toBe('FAQPage');
    expect(Array.isArray(faqSchema.mainEntity)).toBe(true);
    expect((faqSchema.mainEntity as Array<Record<string, unknown>>).length).toBeGreaterThan(0);
    expect((faqSchema.mainEntity as Array<Record<string, unknown>>)[0]?.name).toBe(
      'Quanto custa um roteiro personalizado?'
    );

    const breadcrumbScript = page.locator(
      'script[type="application/ld+json"][data-av-head="script:ld-json:breadcrumb"]'
    );
    await expect(breadcrumbScript).toHaveCount(1);

    const breadcrumbSchema = parseStructuredData(await breadcrumbScript.first().innerHTML());
    expect(breadcrumbSchema['@type']).toBe('BreadcrumbList');
    expect(breadcrumbSchema.itemListElement).toEqual([
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.anhanga.tur.br/',
      },
    ]);

    const serviceScript = page.locator(
      'script[type="application/ld+json"][data-av-head="script:ld-json:service"]'
    );
    await expect(serviceScript).toHaveCount(1);

    const serviceSchema = parseStructuredData(await serviceScript.first().innerHTML());
    expect(serviceSchema['@type']).toBe('Service');
    expect(serviceSchema.name).toBe('Agência de Viagens Personalizadas');
    const rating = serviceSchema.aggregateRating as Record<string, unknown>;
    expect(rating).toBeDefined();
    expect(rating['@type']).toBe('AggregateRating');
    expect(rating['ratingValue']).toBe(5);
    expect(rating['reviewCount']).toBe(2);
  });
});
