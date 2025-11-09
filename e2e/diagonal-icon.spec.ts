import { test, expect } from '@playwright/test';
import { mockApiRoutes } from './api-mocks';

test.describe('Diagonal icon hover (Services)', () => {
  test('background and icon color change on hover and reverse on unhover', async ({ page }) => {
    await mockApiRoutes(page);
    await page.goto('/services');
    const card = page.locator('.beauty-services-link-item').first();
    const button = card.locator('.secondary-button-icon.white-button-inside-link');
    const iconSpan = card.locator('.diagonal-button-icon span');

    await expect(button).toBeVisible();
    await expect(iconSpan).toBeVisible();

    // Initial inline styles
    const initialBg = await button.evaluate((el) => (el as HTMLElement).style.backgroundColor);
    const initialColor = await iconSpan.evaluate((el) => (el as HTMLElement).style.color);
    expect(initialBg).toBe('');
    // Component sets an initial inline color via motion to neutral-100
    expect(initialColor).toBe('var(--core--colors--neutral--100)');

    // Hover over the whole card to trigger animation
    await card.hover();
    // Poll styles to account for WebKit animation timing
    await expect
      .poll(async () => button.evaluate((el) => (el as HTMLElement).style.backgroundColor))
      .toBe('var(--core--colors--neutral--100)');
    await expect
      .poll(async () => iconSpan.evaluate((el) => (el as HTMLElement).style.color))
      .toBe('var(--core--colors--neutral--800)');

    // Move away and confirm reversal
    await page.mouse.move(0, 0);
    await expect
      .poll(async () =>
        button
          .evaluate((el) => (el as HTMLElement).style.backgroundColor)
          .then((v) => v === '' || v === 'rgba(0, 0, 0, 0)'),
      )
      .toBeTruthy();
    await expect
      .poll(async () => iconSpan.evaluate((el) => (el as HTMLElement).style.color))
      .toBe('var(--core--colors--neutral--100)');
  });

  test('only one icon exists in the button', async ({ page }) => {
    await mockApiRoutes(page);
    await page.goto('/services');
    const card = page.locator('.beauty-services-link-item').first();
    const button = card.locator('.secondary-button-icon.white-button-inside-link');
    await expect(button).toBeVisible();
    const iconCount = await button.locator('.diagonal-button-icon').count();
    expect(iconCount).toBe(1);
  });

  test('long title keeps icon pinned right (no wrap to left)', async ({ page }) => {
    await mockApiRoutes(page);
    await page.goto('/services');
    const card = page.locator('.beauty-services-link-item').first();
    const row = card.locator('.content-card-services .flex-horizontal.space-between');
    const icon = card.locator('.content-card-services .secondary-button-icon');

    // Make the title very long to force wrapping
    await card.evaluate((el) => {
      const h3 = el.querySelector('.content-card-services h3');
      if (h3) h3.textContent = 'Very long service title '.repeat(10);
    });

    const rowBox = await row.boundingBox();
    const iconBox = await icon.boundingBox();
    expect(rowBox && iconBox).toBeTruthy();
    if (rowBox && iconBox) {
      // Icon should be on the right half of the row (pinned right)
      expect(iconBox.x).toBeGreaterThan(rowBox.x + rowBox.width / 2);
    }
  });
});
