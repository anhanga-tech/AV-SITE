import { Page, Locator, expect } from '@playwright/test';

export class AIChat {
  readonly page: Page;
  readonly chatDialog: Locator;
  readonly inputField: Locator;
  readonly sendBtn: Locator;
  readonly closeBtn: Locator;
  readonly openBtn: Locator;
  readonly messages: Locator;

  constructor(page: Page) {
    this.page = page;
    this.chatDialog = page.locator('div[role="dialog"][aria-label="Assistente Virtual de Viagem"]');
    this.inputField = page.locator('input[aria-label="Digite sua mensagem para o assistente virtual"]');
    this.sendBtn = page.locator('button[aria-label="Enviar mensagem"]');
    this.closeBtn = page.locator('button[aria-label="Minimizar chat"]');
    this.openBtn = page.locator('button[aria-label="Abrir assistente virtual"]');
    // Messages can be in .prose (model) or outside (user)
    this.messages = page.locator('div.prose, p.leading-relaxed');
  }

  async open() {
    if (!(await this.chatDialog.isVisible())) {
      await this.openBtn.click();
    }
  }

  async sendMessage(text: string) {
    await this.inputField.fill(text);
    await this.sendBtn.click();
  }

  async expectVisible() {
    await expect(this.chatDialog).toBeVisible();
  }

  async expectMessageContaining(text: string) {
    // Look for text anywhere within the dialog to be more resilient
    await expect(this.chatDialog.getByText(text).first()).toBeVisible();
  }
}
