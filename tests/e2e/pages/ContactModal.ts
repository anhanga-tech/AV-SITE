import { Page, Locator, expect } from '@playwright/test';

export class ContactModal {
  readonly page: Page;
  readonly modal: Locator;
  readonly firstNameInput: Locator;
  readonly whatsappInput: Locator;
  readonly emailInput: Locator;
  readonly optInCheckbox: Locator;
  readonly whatsappSubmitBtn: Locator;
  readonly callbackSubmitBtn: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.getByRole('dialog', { name: 'Fale com um consultor' });
    this.firstNameInput = page.locator('#contact-firstName');
    this.whatsappInput = page.locator('#contact-whatsapp');
    this.emailInput = page.locator('#contact-email');
    this.optInCheckbox = page.locator('#contact-optIn');
    this.whatsappSubmitBtn = page.getByRole('button', { name: 'Abrir WhatsApp agora' });
    this.callbackSubmitBtn = page.getByRole('button', { name: 'Prefiro que me chamem' });
    this.successMessage = page.getByText('Recebemos seu contato!');
  }

  async fillForm(data: {
    firstName: string;
    whatsapp: string;
    email?: string;
    optIn?: boolean;
  }) {
    await this.firstNameInput.fill(data.firstName);
    await this.whatsappInput.fill(data.whatsapp);
    if (data.email) await this.emailInput.fill(data.email);
    if (data.optIn) {
      await this.optInCheckbox.check();
    }
  }

  async submitWhatsApp() {
    await this.whatsappSubmitBtn.click();
  }

  async expectVisible() {
    await expect(this.modal).toBeVisible();
  }
}
