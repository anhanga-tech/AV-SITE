import { test, expect, type Page } from '@playwright/test';
import { AIChat } from './pages/AIChat';

declare global {
  interface Window {
    __vibrateCalls?: Array<number | number[]>;
  }
}

const readVibrateCalls = async (page: Page) =>
  page.evaluate(() => window.__vibrateCalls ?? []);

test.describe('Haptics', () => {
  test('should trigger haptic feedback when the chat opens on Mobile Chrome', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'Mobile Chrome', 'Haptic assertions are scoped to Mobile Chrome.');

    await page.addInitScript(() => {
      window.__vibrateCalls = [];

      Object.defineProperty(navigator, 'vibrate', {
        configurable: true,
        value: (pattern: number | number[]) => {
          window.__vibrateCalls?.push(pattern);
          return true;
        },
      });
    });

    const aiChat = new AIChat(page);

    await page.goto('/');
    await aiChat.open();
    await aiChat.expectVisible();
    await expect.poll(() => readVibrateCalls(page).then(calls => calls.length)).toBe(1);
  });

  test('should trigger one haptic per open, explicit send, and completed response on Mobile Chrome', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'Mobile Chrome', 'Haptic assertions are scoped to Mobile Chrome.');

    await page.addInitScript(() => {
      window.__vibrateCalls = [];

      Object.defineProperty(navigator, 'vibrate', {
        configurable: true,
        value: (pattern: number | number[]) => {
          window.__vibrateCalls?.push(pattern);
          return true;
        },
      });
    });

    await page.route('**/api/generate', async route => {
      await new Promise(resolve => setTimeout(resolve, 250));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          text: 'Prontinho! Preparei sua prévia.',
          functionCall: {
            name: 'generate_budget_link',
            args: {
              destination: 'Orlando',
              destination_city: 'Orlando',
              destination_region: 'Flórida',
              origin_city: 'São Paulo',
              origin_region: 'SP',
              dates: 'A definir',
              need_summary: 'Roteiro personalizado',
              decision_role: 'Decisor',
              timeline_window: '30 dias',
              budget_range: 'R$ 15.000',
              baggage_preference: '1 mala despachada',
              iata_code: 'MCO'
            }
          }
        }),
      });
    });

    const aiChat = new AIChat(page);

    await page.goto('/');
    await aiChat.open();
    await aiChat.expectVisible();
    await expect.poll(() => readVibrateCalls(page).then(calls => calls.length)).toBe(1);

    await aiChat.sendMessage('Quero ir para Orlando');
    await expect.poll(() => readVibrateCalls(page).then(calls => calls.length)).toBe(2);

    await aiChat.expectMessageContaining('Prontinho! Preparei sua prévia.');
    await expect.poll(() => readVibrateCalls(page).then(calls => calls.length)).toBe(3);

    const vibrateCalls = await readVibrateCalls(page);
    expect(vibrateCalls).toHaveLength(3);
  });
});
