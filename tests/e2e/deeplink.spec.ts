import { test, expect } from '@playwright/test';
import { AIChat } from './pages/AIChat';

test.describe('AIChat Deep-link Support', () => {
  test('should open chat automatically when chat=1 is present', async ({ page }) => {
    // Navigate with chat=1
    await page.goto('/?chat=1');

    const chat = new AIChat(page);

    // Check if chat dialog is visible (with timeout for the 800ms delay + animation)
    await expect(chat.chatDialog).toBeVisible({ timeout: 10000 });

    // Check if URL was cleaned (params removed)
    await page.waitForFunction(() => !window.location.search.includes('chat=1'), { timeout: 10000 });
    const url = new URL(page.url());
    expect(url.searchParams.has('chat')).toBe(false);
  });

  test('should send custom message when m parameter is present', async ({ page }) => {
    const customMsg = 'Quero viajar para o Japão';
    await page.goto(`/?chat=1&m=${encodeURIComponent(customMsg)}`);

    const chat = new AIChat(page);
    await expect(chat.chatDialog).toBeVisible({ timeout: 10000 });

    // Check if the user message appears in the chat
    await expect(chat.chatDialog.getByText(customMsg)).toBeVisible();
  });

  test('should send destination message when destino parameter is present', async ({ page }) => {
    const destino = 'Paris';
    await page.goto(`/?chat=1&destino=${encodeURIComponent(destino)}`);

    const chat = new AIChat(page);
    await expect(chat.chatDialog).toBeVisible({ timeout: 10000 });

    // Check if the auto-generated message appears
    await expect(chat.chatDialog.getByText(`Olá! Gostaria de um roteiro personalizado para ${destino}.`)).toBeVisible();
  });
});
