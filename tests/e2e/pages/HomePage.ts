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
  readonly mobileFaleConoscoBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.headerLogo = page.locator('header img[alt="Anhangá Viagens"]');
    // Desktop button via data-testid
    this.faleConoscoBtn = page.getByTestId('desktop-fale-conosco-btn');
    // Mobile button in the drawer via data-testid
    this.mobileFaleConoscoBtn = page.getByTestId('mobile-fale-conosco-btn');

    this.destinationInput = page.locator('input[placeholder*="Ex: Orlando, Paris, Brasil..."]');
    this.guestsBtn = page.getByTestId('guests-filter-btn');
    this.datesBtn = page.getByTestId('dates-filter-btn');
    this.tripTypeBtn = page.getByTestId('trip-type-filter-btn');
    this.budgetBtn = page.getByTestId('budget-filter-btn');
    this.submitSearchBtn = page.getByTestId('submit-search-btn');
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

  async openMobileMenu() {
    await this.mobileMenuBtn.click();
  }

  async openChat(isMobile: boolean) {
    if (isMobile) {
      await this.openMobileMenu();
      await this.mobileFaleConoscoBtn.click();
    } else {
      await this.faleConoscoBtn.click();
    }
  }
}
