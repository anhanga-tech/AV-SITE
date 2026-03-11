import { Page, Locator, expect } from '@playwright/test';

export class AIChat {
  readonly page: Page;
  readonly chatDialog: Locator;
  readonly inputField: Locator;
  readonly sendBtn: Locator;
  readonly closeBtn: Locator;
  readonly openBtn: Locator;
  readonly typingIndicator: Locator;
  readonly userMessages: Locator;

  constructor(page: Page) {
    this.page = page;
    this.chatDialog = page.locator('div[role="dialog"][aria-label="Assistente Virtual Anhangá"]');
    this.inputField = page.locator('textarea[placeholder="Digite sua dúvida aqui..."]');
    this.sendBtn = page.locator('button[aria-label="Enviar mensagem"]');
    this.closeBtn = page.locator('button[aria-label="Fechar gaveta"]');
    this.openBtn = page.locator('button[aria-label="Abrir assistente virtual"]');
    this.typingIndicator = page.getByTestId('chat-typing-indicator');
    this.userMessages = page.getByTestId('chat-user-message');
  }

  async open() {
    // The drawer hides via translateX (not display:none), so chatDialog.isVisible()
    // returns true even when closed. Instead, check the open button: it becomes
    // opacity-0 (invisible to Playwright) when the drawer is open.
    if (await this.openBtn.isVisible()) {
      await this.openBtn.click();
      // Wait for the drawer slide-in animation (500ms) to complete by confirming
      // the send button has entered the viewport before interacting further.
      await expect(this.sendBtn).toBeInViewport();
    }
  }

  async close() {
    if (await this.chatDialog.isVisible()) {
      await this.closeBtn.click();
    }
  }

  async sendMessage(text: string) {
    await this.inputField.fill(text);
    await this.sendBtn.click();
  }

  async expectVisible() {
    await expect(this.chatDialog).toBeVisible();
  }

  async expectHidden() {
    await expect(this.chatDialog).not.toBeVisible();
  }

  async expectMessageContaining(text: string) {
    // We use getByText inside the dialog to be agnostic of whether it's model (.prose) or user (p.leading-relaxed)
    await expect(this.chatDialog.getByText(text).first()).toBeVisible();
  }

  async expectOnlineStatus() {
    await expect(this.chatDialog.locator('span:has-text("Assistente Online")')).toBeVisible();
  }
}
