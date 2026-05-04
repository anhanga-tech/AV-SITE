import { test, expect } from "@playwright/test";

test.describe("Orlando Landing SEO", () => {
  test("should have a single visible H1 with combined content", async ({
    page,
  }) => {
    await page.goto("/orlando");

    // Check for exactly one H1
    const h1s = page.locator("h1");
    await expect(h1s).toHaveCount(1);

    // Check that it is visible
    await expect(h1s).toBeVisible();

    // Check content (both descriptive and branding)
    const h1Text = await h1s.innerText();
    expect(h1Text).toMatch(/Pacote para Orlando 2026/i);
    expect(h1Text).toMatch(/Orlando/i);
    expect(h1Text).toMatch(/É SURREAL/i);

    // Verify it's not sr-only (check height/width/overflow)
    const box = await h1s.boundingBox();
    expect(box?.height).toBeGreaterThan(10);
    expect(box?.width).toBeGreaterThan(10);
  });
});
