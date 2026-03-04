import { test, expect } from '@playwright/test';

test.describe('Hero UX and Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper ARIA attributes for destination search', async ({ page }) => {
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

  test('should dismiss destination suggestions with Escape key', async ({ page }) => {
    const destInput = page.getByPlaceholder('Ex: Orlando, Paris, Brasil...');
    await destInput.fill('Or');
    await expect(page.locator('[role="listbox"]')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('[role="listbox"]')).not.toBeVisible();
  });

  test('should dismiss other dropdowns with Escape key', async ({ page }) => {
    // Open Calendar
    await page.getByTestId('dates-filter-btn').click();
    // Use a more specific locator for the calendar to avoid footer links
    const calendarHeader = page.locator('span.text-gray-800').filter({ hasText: /202[56]/ });
    await expect(calendarHeader.first()).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(calendarHeader.first()).not.toBeVisible();

    // Open Guests
    await page.click('text=2 Adultos');
    // The dropdown contains "Adultos", "Crianças", etc.
    const guestLabel = page.getByText('Crianças').first();
    await expect(guestLabel).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(guestLabel).not.toBeVisible();
  });
});
