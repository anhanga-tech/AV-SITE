import { Page, Locator, expect } from '@playwright/test';

export class ContactModal {
  readonly page: Page;
  readonly modal: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly whatsappInput: Locator;
  readonly emailInput: Locator;
  readonly optInCheckbox: Locator;
  readonly whatsappSubmitBtn: Locator;
  readonly callbackSubmitBtn: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.getByRole('dialog', { name: 'Fale com um especialista' });
    this.firstNameInput = page.locator('#contact-firstName');
    this.lastNameInput = page.locator('#contact-lastName');
    this.whatsappInput = page.locator('#contact-whatsapp');
    this.emailInput = page.locator('#contact-email');
    this.optInCheckbox = page.locator('#contact-optIn');
    this.whatsappSubmitBtn = page.getByRole('button', { name: 'Chamar no WhatsApp' });
    this.callbackSubmitBtn = page.getByRole('button', { name: 'Me chamem no WhatsApp' });
    this.successMessage = page.getByText('Recebemos seu contato!');
  }

  async fillForm(data: {
    firstName: string;
    lastName?: string;
    whatsapp: string;
    email?: string;
    optIn?: boolean;
  }) {
    await this.firstNameInput.fill(data.firstName);
    if (data.lastName) await this.lastNameInput.fill(data.lastName);
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
