import { test, expect } from '@playwright/test';
import { AIChat } from './pages/AIChat';

test.describe('Deep-link Chat Support', () => {
  test('should open chat automatically with ?chat=open', async ({ page }) => {
    await page.goto('/?chat=open');
    const aiChat = new AIChat(page);
    await aiChat.expectVisible();

    // Check if URL is cleaned
    await expect(page).toHaveURL(/\/$/);
    await expect(page.url()).not.toContain('chat=open');
  });

  test('should open chat and apply context with ?chat=open&destino=Orlando', async ({ page }) => {
    // We might need to encode the URI component if there are spaces, but Orlando is fine.
    await page.goto('/?chat=open&destino=Orlando');
    const aiChat = new AIChat(page);
    await aiChat.expectVisible();

    // It should have sent a message about Orlando or at least contain it in the chat
    // The exact implementation might vary, but usually it would trigger a search for that destination
    await expect(aiChat.chatDialog).toBeVisible();

    // Wait for the typing indicator or the message to appear
    await aiChat.expectMessageContaining('Orlando');

    // Check if URL is cleaned
    await expect(page).toHaveURL(/\/$/);
    await expect(page.url()).not.toContain('chat=open');
    await expect(page.url()).not.toContain('destino=Orlando');
  });
});
