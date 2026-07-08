import { test, expect } from '@playwright/test';

test.describe('Hero UX and Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper ARIA attributes for destination search', async ({ page, isMobile }) => {
    test.skip(isMobile, 'SearchForm complex interactions are desktop-only');
    const destInput = page.getByPlaceholder('Ex: Orlando, Paris, Brasil...');

    // Check initial ARIA attributes
    await expect(destInput).toHaveAttribute('role', 'combobox');
    await expect(destInput).toHaveAttribute('aria-autocomplete', 'list');
    await expect(destInput).toHaveAttribute('aria-haspopup', 'listbox');
    await expect(destInput).toHaveAttribute('aria-expanded', 'false');

    // Type to show suggestions
    await destInput.fill('Or');
    await expect(destInput).toHaveAttribute('aria-expanded', 'true');

    // Check listbox
    const listbox = page.locator('[role="listbox"]');
    await expect(listbox).toBeVisible();
    const optionsCount = await listbox.locator('[role="option"]').count();
    expect(optionsCount).toBeGreaterThan(0);
  });

  test('should dismiss destination suggestions with Escape key', async ({ page, isMobile }) => {
    test.skip(isMobile, 'SearchForm complex interactions are desktop-only');
    const destInput = page.getByPlaceholder('Ex: Orlando, Paris, Brasil...');
    await destInput.fill('Or');
    await expect(page.locator('[role="listbox"]')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('[role="listbox"]')).not.toBeVisible();
  });

  test('should dismiss other dropdowns with Escape key', async ({ page, isMobile }) => {
    test.skip(isMobile, 'SearchForm complex interactions are desktop-only');
    // Open Calendar
    await page.getByTestId('dates-filter-btn').click();
    // Use a more specific locator for the calendar to avoid footer links
    const calendarHeader = page.locator('span.text-zinc-800').filter({ hasText: /202[56]/ });
    await expect(calendarHeader.first()).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(calendarHeader.first()).not.toBeVisible();

    // Open Guests
    await page.getByTestId('guests-filter-btn').click();
    // The dropdown contains exact labels "Adultos", "Crianças", etc.
    // Use exact match to avoid matching blog card headings that contain "Crianças" as a substring.
    const guestLabel = page.getByText('Crianças', { exact: true });
    await expect(guestLabel).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(guestLabel).not.toBeVisible();
  });

  test('should reveal Trip Type field only after activating its toggle', async ({ page, isMobile }) => {
    test.skip(isMobile, 'SearchForm complex interactions are desktop-only');

    const tripTypeReveal = page.getByTestId('trip-type-reveal-btn');
    const tripTypeField = page.getByTestId('trip-type-filter-btn');

    // Colapsado por padrão
    await expect(tripTypeReveal).toBeVisible();
    await expect(tripTypeField).not.toBeVisible();
    await expect(tripTypeReveal).toHaveAttribute('aria-expanded', 'false');
    await expect(tripTypeReveal).toHaveAttribute('aria-controls', 'hero-trip-type-panel');

    // Ativa o toggle
    await tripTypeReveal.click();

    // Campo revelado, toggle não existe mais (reveal unidirecional)
    await expect(tripTypeField).toBeVisible();
    await expect(tripTypeReveal).not.toBeVisible();

    // Foco move para o botão do campo revelado
    await expect(tripTypeField).toBeFocused();

    // Fluxo normal de seleção continua funcionando
    await tripTypeField.click();
    await page.getByRole('button', { name: 'Férias / Lazer' }).click();
    await expect(tripTypeField).toContainText('Férias / Lazer');
  });
});
