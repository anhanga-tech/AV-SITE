import { test, expect } from '@playwright/test';
import { AIChat } from './pages/AIChat';

const userMessageSelector = 'div.text-white.font-medium.leading-relaxed';

test.describe('Deep-link Chat Support', () => {
  test('should open chat automatically when chat parameter is present', async ({ page }) => {
    // Navigate with chat=1 (compatible)
    await page.goto('/?chat=1');
    const aiChat = new AIChat(page);
    await aiChat.expectVisible();

    // Check if URL is cleaned (params removed)
    await expect(page).toHaveURL(/\/$/);
    await expect(page.url()).not.toContain('chat=1');
  });

  test('should open chat automatically with ?chat=open', async ({ page }) => {
    await page.goto('/?chat=open');
    const aiChat = new AIChat(page);
    await aiChat.expectVisible();

    // Check if URL is cleaned
    await expect(page).toHaveURL(/\/$/);
    await expect(page.url()).not.toContain('chat=open');
  });

  test('should pre-fill input when m parameter is present and should not auto-send', async ({ page }) => {
    const customMsg = 'Quero viajar para o Japão';
    await page.goto(`/?chat=1&m=${encodeURIComponent(customMsg)}`);

    const aiChat = new AIChat(page);
    await aiChat.expectVisible();

    // The message must be pre-filled in input (no auto-send)
    await expect(aiChat.inputField).toHaveValue(customMsg);
    await expect(aiChat.chatDialog.locator('div.text-white.font-medium.leading-relaxed')).toHaveCount(0);
  });

  test('should pre-fill destination prompt when destino parameter is present and should not auto-send', async ({ page }) => {
    await page.goto('/?chat=1&destino=Orlando');
    const aiChat = new AIChat(page);
    await aiChat.expectVisible();

    const expectedPrompt = 'Olá! Gostaria de um roteiro personalizado para Orlando.';
    await expect(aiChat.inputField).toHaveValue(expectedPrompt);
    await expect(aiChat.chatDialog.locator('div.text-white.font-medium.leading-relaxed')).toHaveCount(0);

    // Check if URL is cleaned
    await expect(page).toHaveURL(/\/$/);
    await expect(page.url()).not.toContain('chat=1');
    await expect(page.url()).not.toContain('destino=Orlando');
  });

  test('should preserve UTM parameters when cleaning deep-link params', async ({ page }) => {
    const customMsg = 'Quero viajar para o Japão';
    await page.goto(`/?chat=1&m=${encodeURIComponent(customMsg)}&utm_source=instagram&utm_campaign=summer`);

    const aiChat = new AIChat(page);
    await aiChat.expectVisible();

    await expect(aiChat.inputField).toHaveValue(customMsg);
    await expect(page).toHaveURL(/utm_source=instagram/);
    await expect(page).toHaveURL(/utm_campaign=summer/);
    await expect(page.url()).not.toContain('chat=1');
    await expect(page.url()).not.toContain('m=');
  });
});
