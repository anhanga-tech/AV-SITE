import { test, expect } from '@playwright/test';
import { AIChat } from './pages/AIChat';

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

  test('should send custom message when m parameter is present', async ({ page }) => {
    const customMsg = 'Quero viajar para o Japão';
    await page.goto(`/?chat=1&m=${encodeURIComponent(customMsg)}`);

    const aiChat = new AIChat(page);
    await aiChat.expectVisible();

    // Check if the user message appears in the chat
    await expect(aiChat.chatDialog.getByText(customMsg)).toBeVisible();
  });

  test('should open chat and apply context with ?chat=open&destino=Orlando', async ({ page }) => {
    await page.goto('/?chat=open&destino=Orlando');
    const aiChat = new AIChat(page);
    await aiChat.expectVisible();

    // Wait for the message to appear
    await aiChat.expectMessageContaining('Orlando');

    // Check if URL is cleaned
    await expect(page).toHaveURL(/\/$/);
    await expect(page.url()).not.toContain('chat=open');
    await expect(page.url()).not.toContain('destino=Orlando');
  });
});
