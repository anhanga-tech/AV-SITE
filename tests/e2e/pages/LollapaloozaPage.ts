import { Page, Locator, expect } from '@playwright/test';

export class LollapaloozaPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly lgpdCheckbox: Locator;
  readonly submitBtn: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.locator('#lolla-waitlist-name');
    this.emailInput = page.locator('#lolla-waitlist-email');
    this.lgpdCheckbox = page.locator('input[type="checkbox"]');
    this.submitBtn = page.getByRole('button', { name: /ENTRAR NA LISTA/i });
    this.successMessage = page.getByText('Você entrou na lista de espera');
    this.errorMessage = page.locator('role=alert');
  }

  async goto() {
    await this.page.goto('/lollapalooza');
  }

  async fillForm(data: { name: string; email: string; acceptLgpd?: boolean }) {
    await this.nameInput.fill(data.name);
    await this.emailInput.fill(data.email);
    if (data.acceptLgpd !== false) {
      await this.lgpdCheckbox.check({ force: true });
    }
  }

  async submit() {
    await this.submitBtn.click();
  }
}
