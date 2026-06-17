import { test, expect } from '@playwright/test';
import { HomePage } from './pages/HomePage';

test.describe('Smoke Suite', () => {
  test('should load home page and verify key elements', async ({ page, isMobile }) => {
    await page.goto('/');
    const homePage = new HomePage(page);
    await expect(homePage.headerLogo).toBeVisible();

    if (isMobile) {
      await expect(homePage.mobileMenuBtn).toBeVisible();
      await expect(homePage.faleConoscoBtn).not.toBeVisible();
    } else {
      await expect(homePage.faleConoscoBtn).toBeVisible();
    }

    if (isMobile) {
      await expect(homePage.mobileDestinationInput).toBeVisible();
      await expect(homePage.mobileSubmitSearchBtn).toBeVisible();
    } else {
      await expect(homePage.destinationInput).toBeVisible();
      await expect(homePage.submitSearchBtn).toBeVisible();
    }
  });

  test('should open contact modal via "Fale Conosco" button', async ({ page, isMobile }) => {
    await page.goto('/');
    const homePage = new HomePage(page);

    if (isMobile) {
      await homePage.openMobileMenu();
      await homePage.mobileFaleConoscoBtn.click();
    } else {
      await homePage.faleConoscoBtn.click();
    }

    await expect(page.getByRole('dialog', { name: 'Fale com um especialista' })).toBeVisible();
    await expect(page.getByText('Fale com um especialista')).toBeVisible();
  });

  test('should navigate to basic landing pages', async ({ page }) => {
    const landingPages = [
      { path: '/orlando', title: /Orlando/i },
      { path: '/beto-carrero', title: /Beto Carrero/i },
      { path: '/lollapalooza', title: /Lollapalooza/i },
    ];

    for (const landing of landingPages) {
      await page.goto(landing.path);
      await expect(page).toHaveTitle(landing.title);
      await expect(page.getByTestId('site-header')).not.toBeVisible();
    }
  });

  test('should verify mobile menu visibility', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test is for mobile only');
    await page.goto('/');
    const homePage = new HomePage(page);
    await expect(homePage.mobileMenuBtn).toBeVisible();
    await homePage.openMobileMenu();
    await expect(page.locator('#mobile-menu')).toBeVisible();
  });

  test('should clear the mobile destination input and keep focus', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test is for the mobile hero form only');
    await page.goto('/');
    const homePage = new HomePage(page);

    // Clear button is hidden until the user types something.
    await expect(homePage.mobileClearDestinationBtn).toHaveCount(0);

    await homePage.mobileDestinationInput.fill('Paris');
    await expect(homePage.mobileClearDestinationBtn).toBeVisible();

    await homePage.mobileClearDestinationBtn.click();

    // Input is reset, button disappears again, and focus stays on the input
    // so the virtual keyboard does not dismiss.
    await expect(homePage.mobileDestinationInput).toHaveValue('');
    await expect(homePage.mobileClearDestinationBtn).toHaveCount(0);
    await expect(homePage.mobileDestinationInput).toBeFocused();
  });

  test('should open contact modal from landing pages CTAs', async ({ page }) => {
    // Orlando
    await page.goto('/orlando');
    await page.getByTestId('cta-orlando-specialist').click();
    await expect(page.getByRole('dialog', { name: 'Fale com um especialista' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Fale com um especialista' })).not.toBeVisible();

    // Beto Carrero
    await page.goto('/beto-carrero');
    await page.getByTestId('cta-betocarrero-specialist').click();
    await expect(page.getByRole('dialog', { name: 'Fale com um especialista' })).toBeVisible();

  });

  test('should ensure header anchor links work from non-home pages', async ({ page, isMobile }) => {
    // Navigate to a non-home page
    await page.goto('/sobre/');

    const homePage = new HomePage(page);
    let contactLink;

    if (isMobile) {
      await homePage.openMobileMenu();
      contactLink = page.locator('#mobile-menu a[href*="#contato"]');
    } else {
      contactLink = page.getByTestId('site-header').getByRole('link', { name: 'Contato' });
    }

    const href = await contactLink.getAttribute('href');

    // Memory 27 says: Header component uses a conditional href that prepends
    // the absolute SITE_URL when isHome is false.
    // So we expect it to be an absolute URL or at least start with /
    expect(href).toMatch(/^https?:\/\/.*\/#contato$/);

    await contactLink.click();

    // Should navigate back to home with the anchor
    await expect(page).toHaveURL(/\/.*#contato$/);
  });
});
