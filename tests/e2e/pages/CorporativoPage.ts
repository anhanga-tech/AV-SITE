import { Page, Locator, expect } from '@playwright/test';

export class CorporativoPage {
  readonly page: Page;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly whatsappInput: Locator;
  readonly empresaInput: Locator;
  readonly cargoInput: Locator;
  readonly submitBtn: Locator;
  readonly successHeading: Locator;
  readonly errorAlert: Locator;
  readonly whatsappCta: Locator;
  readonly contactAnchor: Locator;

  constructor(page: Page) {
    this.page = page;
    this.firstNameInput = page.locator('#firstName');
    this.lastNameInput = page.locator('#lastName');
    this.emailInput = page.locator('#email');
    this.whatsappInput = page.locator('#whatsapp');
    this.empresaInput = page.locator('#empresa');
    this.cargoInput = page.locator('#cargo');
    this.submitBtn = page.locator('button[type="submit"]');
    this.successHeading = page.locator('h3:has-text("Mensagem recebida!")');
    this.errorAlert = page.locator('p[role="alert"]');
    this.whatsappCta = page.locator('a[data-contact-intent]').first();
    this.contactAnchor = page.locator('a[href="#contato"]');
  }

  async goto() {
    await this.page.goto('/corporativo');
  }

  async fillForm(data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    whatsapp?: string;
    empresa?: string;
    cargo?: string;
  }) {
    if (data.firstName) await this.firstNameInput.fill(data.firstName);
    if (data.lastName) await this.lastNameInput.fill(data.lastName);
    if (data.email) await this.emailInput.fill(data.email);
    if (data.whatsapp) await this.whatsappInput.fill(data.whatsapp);
    if (data.empresa) await this.empresaInput.fill(data.empresa);
    if (data.cargo) await this.cargoInput.fill(data.cargo);
  }

  async submit() {
    await this.submitBtn.click();
  }

  async expectSuccess() {
    await expect(this.successHeading).toBeVisible();
  }

  async expectError(message?: string) {
    await expect(this.errorAlert).toBeVisible();
    if (message) {
      await expect(this.errorAlert).toContainText(message);
    }
  }
}
