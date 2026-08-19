import { test, expect } from '@playwright/test';
import { AIChat } from './pages/AIChat';

const PANEL_MODULE_PATTERN = /AIChatPanel/;

test.describe('AI chat lazy loading', () => {
  test('does not load the chat panel implementation until the visitor opens it', async ({ page }) => {
    const requestedUrls: string[] = [];
    page.on('request', (request) => requestedUrls.push(request.url()));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(requestedUrls.some((url) => PANEL_MODULE_PATTERN.test(url))).toBe(false);

    const aiChat = new AIChat(page);
    await aiChat.open();
    await aiChat.expectVisible();

    expect(requestedUrls.some((url) => PANEL_MODULE_PATTERN.test(url))).toBe(true);
  });

  test('opens the chat via keyboard activation of the trigger button', async ({ page }) => {
    await page.goto('/');
    const aiChat = new AIChat(page);

    await aiChat.openBtn.focus();
    await page.keyboard.press('Enter');

    await expect(aiChat.sendBtn).toBeInViewport();
    await aiChat.expectVisible();
  });

  test('opens the chat and auto-sends a message from the toggle-ai-chat custom event', async ({ page }) => {
    await page.route('**/api/generate', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ text: 'Claro! Me conta mais sobre a viagem para Lisboa.' }),
      }),
    );

    await page.goto('/');
    const aiChat = new AIChat(page);

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('toggle-ai-chat', { detail: { message: 'Quero ir para Lisboa' } }));
    });

    await aiChat.expectVisible();
    await expect(aiChat.userMessages.filter({ hasText: 'Quero ir para Lisboa' })).toBeVisible();
  });

  test('shows an accessible loading state while the panel chunk is still fetching', async ({ page }) => {
    await page.route(PANEL_MODULE_PATTERN, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await route.continue();
    });

    await page.goto('/');
    const aiChat = new AIChat(page);
    await aiChat.openBtn.click();

    await expect(page.getByRole('status').filter({ hasText: 'Carregando assistente' })).toBeVisible();
    await expect(aiChat.sendBtn).toBeInViewport();
  });

  test('restores focus to the trigger button after closing', async ({ page }) => {
    await page.goto('/');
    const aiChat = new AIChat(page);
    await aiChat.open();
    await aiChat.close();

    await expect(aiChat.openBtn).toBeFocused();
  });

  test('removes the trigger button from the tab order while the chat is open', async ({ page }) => {
    await page.goto('/');
    const aiChat = new AIChat(page);
    await aiChat.open();

    await expect(aiChat.openBtn).toHaveAttribute('aria-hidden', 'true');
    await expect(aiChat.openBtn).toHaveAttribute('tabindex', '-1');
  });

  test('recovers after a chunk-load failure once the retry succeeds', async ({ page }) => {
    let firstAttempt = true;
    await page.route(PANEL_MODULE_PATTERN, async (route) => {
      if (firstAttempt) {
        firstAttempt = false;
        await route.abort('failed');
        return;
      }
      await route.continue();
    });

    await page.goto('/');
    const aiChat = new AIChat(page);
    await aiChat.openBtn.click();

    // ChunkErrorBoundary forces a hard reload on the first chunk-load failure so the
    // browser picks up a working chunk URL — wait for that reload, then retry opening.
    await page.waitForLoadState('load');
    await aiChat.openBtn.click();
    await expect(aiChat.sendBtn).toBeInViewport();
  });
});
