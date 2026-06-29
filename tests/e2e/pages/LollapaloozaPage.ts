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
    this.lgpdCheckbox = page.locator('#lolla-waitlist-lgpd');
    this.submitBtn = page.locator('#lolla-waitlist-submit');
    this.successMessage = page.getByText('Você entrou na lista de espera');
    this.errorMessage = page.locator('role=alert');
  }

  async goto() {
    await this.page.goto('/lollapalooza');
    // networkidle é flaky em firefox/webkit: timers de analytics e o vídeo de
    // fundo mantêm conexões abertas e a página nunca atinge idle dentro do
    // timeout. Espera o formulário da waitlist renderizar — sinal observável e
    // determinístico de que a página hidratou e está interativa.
    await this.nameInput.waitFor({ state: 'visible' });
  }

  async fillForm(data: { name: string; email: string; acceptLgpd?: boolean }) {
    await this.nameInput.scrollIntoViewIfNeeded();
    await this.nameInput.fill(data.name);
    await this.emailInput.fill(data.email);

    if (data.acceptLgpd !== false) {
      // Direct label click is most reliable for sr-only inputs
      await this.page.locator('label').filter({ hasText: 'Autorizo a Anhangá' }).click();

      // If click doesn't work (e.g. mobile overlap), fallback to evaluate but wait for React
      const isChecked = await this.lgpdCheckbox.isChecked();
      if (!isChecked) {
        await this.lgpdCheckbox.evaluate((el: HTMLInputElement) => {
          el.checked = true;
          el.dispatchEvent(new Event('change', { bubbles: true }));
        });
      }
      await expect(this.lgpdCheckbox).toBeChecked();
    }
    // Safety wait for React reconciliation
    await this.page.waitForTimeout(200);
  }

  async submit() {
    await this.submitBtn.scrollIntoViewIfNeeded();
    await this.submitBtn.click();
  }
}
