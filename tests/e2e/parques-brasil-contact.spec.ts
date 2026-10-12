import { expect, test, type Page } from '@playwright/test';
import type { SubmitContactRequest } from '../../types/contactCapture';

/*
  Cada CTA do hub /parques-brasil precisa entregar ao Odoo qual parque o
  visitante escolheu — antes o modal abria genérico e o lead chegava sem
  destino. Também cobre a idade das crianças e os dias, que a copy do CTA
  final promete usar.
*/

const PARKS = ['Beto Carrero World', 'Hopi Hari', 'Thermas dos Laranjais', 'Beach Park', 'Hot Park'];

async function mockSubmitContact(page: Page): Promise<SubmitContactRequest[]> {
  const captured: SubmitContactRequest[] = [];
  await page.route('**/api/submit-contact', (route) => {
    captured.push(route.request().postDataJSON() as SubmitContactRequest);
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, requestId: 'req_parques_e2e' }),
    });
  });
  return captured;
}

const contactDialog = (page: Page) => page.getByRole('dialog', { name: 'Fale com um consultor' });

test.describe('contato do hub /parques-brasil', () => {
  for (const park of PARKS) {
    test(`card do ${park} envia o parque, a idade das crianças e os dias`, async ({ page }) => {
      const captured = await mockSubmitContact(page);
      await page.goto('/parques-brasil/');

      await page.getByRole('button', { name: `Pedir orçamento do ${park}` }).click();
      const dialog = contactDialog(page);
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText(park)).toBeVisible();

      await page.locator('#contact-firstName').fill('Maria Silva');
      await page.locator('#contact-whatsapp').fill('11987654321');
      await page.locator('#contact-childrenAges').fill('4 e 9 anos');
      await page.locator('#contact-tripDays').fill('4 dias');
      await page.getByRole('button', { name: /^prefiro que me chamem$/i }).click();

      await expect(dialog.getByText('Recebemos seu contato!')).toBeVisible();
      expect(captured).toHaveLength(1);
      expect(captured[0].destination).toContain(park);
      expect(captured[0].childrenAges).toBe('4 e 9 anos');
      expect(captured[0].tripDays).toBe('4 dias');
    });
  }

  test('CTA final pede idade e dias e marca o lead como hub de parques', async ({ page }) => {
    const captured = await mockSubmitContact(page);
    await page.goto('/parques-brasil/');

    await page.getByRole('button', { name: /^falar com um consultor$/i }).click();
    await expect(page.locator('#contact-childrenAges')).toBeVisible();

    await page.locator('#contact-firstName').fill('Maria Silva');
    await page.locator('#contact-whatsapp').fill('11987654321');
    await page.getByRole('button', { name: /^prefiro que me chamem$/i }).click();

    await expect(contactDialog(page).getByText('Recebemos seu contato!')).toBeVisible();
    expect(captured[0].destination).toMatch(/^Parques do Brasil/);
    expect(captured[0].source).toBe('parques-brasil');
    expect(captured[0].childrenAges).toBeUndefined();
  });

  test('CTA do hero também pede idade e dias', async ({ page }) => {
    await page.goto('/parques-brasil/');
    await page.getByRole('button', { name: 'Quero ajuda para escolher' }).click();
    await expect(contactDialog(page)).toBeVisible();
    await expect(page.locator('#contact-tripDays')).toBeVisible();
  });

  test('modal aberto fora do hub não mostra os campos de viagem', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('open-contact-modal', { detail: { source: 'header' } }));
    });
    await expect(contactDialog(page)).toBeVisible();
    await expect(page.locator('#contact-childrenAges')).toHaveCount(0);
  });
});
