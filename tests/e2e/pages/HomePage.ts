import { Page, Locator } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly headerLogo: Locator;
  readonly faleConoscoBtn: Locator;
  readonly destinationInput: Locator;
  readonly guestsBtn: Locator;
  readonly datesBtn: Locator;
  readonly tripTypeBtn: Locator;
  readonly budgetBtn: Locator;
  readonly submitSearchBtn: Locator;
  readonly mobileMenuBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.headerLogo = page.locator('header img[alt="Anhangá Viagens"]');
    this.faleConoscoBtn = page.locator('header .btn-specialist', { hasText: 'Fale Conosco' });
    this.destinationInput = page.locator('input[placeholder*="Ex: Orlando, Paris, Brasil..."]');
    this.guestsBtn = page.locator('button:has(span:has-text("Nº de Viajantes"))');
    this.datesBtn = page.locator('button:has(span:has-text("Quando você vai?"))');
    this.tripTypeBtn = page.locator('button:has(span:has-text("Tipo de Viagem"))');
    this.budgetBtn = page.locator('button:has(span:has-text("Orçamento Aprox."))');
    this.submitSearchBtn = page.locator('button[type="submit"]:has-text("Planejar Viagem")');
    this.mobileMenuBtn = page.locator('button[aria-label="Abrir menu"]');
  }

  async goto() {
    await this.page.goto('/');
  }

  async fillDestination(destination: string) {
    await this.destinationInput.fill(destination);
  }

  async selectBudget(tier: string) {
    await this.budgetBtn.click();
    await this.page.locator(`button:has-text("${tier}")`).click();
  }

  async submitSearch() {
    await this.submitSearchBtn.click();
  }

  async openChatViaHeader() {
    await this.faleConoscoBtn.first().click();
  }
}
