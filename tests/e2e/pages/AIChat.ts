import { Page, Locator, expect } from '@playwright/test';

export class AIChat {
  readonly page: Page;
  readonly chatDialog: Locator;
  readonly inputField: Locator;
  readonly sendBtn: Locator;
  readonly closeBtn: Locator;
  readonly openBtn: Locator;
  readonly typingIndicator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.chatDialog = page.locator('div[role="dialog"][aria-label="Assistente Virtual de Viagem"]');
    this.inputField = page.locator('input[aria-label="Digite sua mensagem para o assistente virtual"]');
    this.sendBtn = page.locator('button[aria-label="Enviar mensagem"]');
    this.closeBtn = page.locator('button[aria-label="Minimizar chat"]');
    this.openBtn = page.locator('button[aria-label="Abrir assistente virtual"]');
    this.typingIndicator = page.locator('span:has-text("digitando...")');
  }

  async open() {
    if (!(await this.chatDialog.isVisible())) {
      await this.openBtn.click();
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
    await expect(this.chatDialog.locator('span:has-text("Online agora")')).toBeVisible();
  }
}
