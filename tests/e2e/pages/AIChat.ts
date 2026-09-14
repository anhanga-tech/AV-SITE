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
    this.chatDialog = page.locator('dialog[aria-labelledby="ai-chat-title"]');
    this.inputField = page.locator('textarea[placeholder="Digite sua dúvida aqui..."]');
    this.sendBtn = page.locator('button[aria-label="Enviar mensagem"]');
    this.closeBtn = page.locator('button[aria-label="Fechar gaveta"]');
    this.openBtn = page.locator('button[aria-label="Abrir assistente virtual"]');
    this.typingIndicator = page.getByTestId('chat-typing-indicator');
    this.userMessages = page.getByTestId('chat-user-message');
  }

  async open() {
    // AIChat is lazy() (App.tsx) and never renders during SSR, so right after page.goto()
    // its trigger button may not have mounted yet — wait for it to attach before the
    // idempotent-guard isVisible() check below, which stays a plain (non-auto-waiting) read
    // since it's telling "already open" (button faded to opacity-0) apart from "not open yet".
    await this.openBtn.waitFor({ state: 'attached' });

    // The drawer uses a <dialog> that animates via translateX. Check the open button
    // visibility (it becomes opacity-0 when the drawer is open) as the reliable signal.
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
    await expect(this.chatDialog.getByText('Assistente virtual')).toBeVisible();
  }
}
