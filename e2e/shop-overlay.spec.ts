import { test, expect } from '@playwright/test';
import { mockApiRoutes } from './api-mocks';

test.describe('Shop overlay + layout', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
    await page.goto('/shop');
    await expect(page.locator('.packages-grid')).toBeVisible();
  });

  test('overlay plus updates styles on hover', async ({ page }) => {
    const firstTile = page.locator('.packages-grid a').first();
    const overlayWrapper = firstTile.locator('.button-icon-inside-link-wrapper');
    const overlayButton = overlayWrapper.locator('.secondary-button-icon.large.no-hover');
    const overlayLines = overlayWrapper.locator('.accordion-icon-line');

    await expect(overlayWrapper).toBeVisible();
    await expect(overlayButton).toBeVisible();
    await expect(overlayLines).toHaveCount(2);

    // Hover the entire card (anchor) to trigger CSS hover rules
    await firstTile.hover();

    // Colors after hover are driven by CSS variables defined in Webflow CSS
    // --core--colors--neutral--800 => #1e1e24 (rgb(30, 30, 36))
    // --core--colors--neutral--100 => white (rgb(255, 255, 255))
    const buttonBgAfterHover = await overlayButton.evaluate((el) => {
      return getComputedStyle(el as HTMLElement).backgroundColor;
    });
    expect(buttonBgAfterHover).toBe('rgb(30, 30, 36)');

    // Lines become neutral-100 on hover
    const lineBgAfterHover = await overlayLines.first().evaluate((el) => {
      return getComputedStyle(el as HTMLElement).backgroundColor;
    });
    expect(lineBgAfterHover).toBe('rgb(255, 255, 255)');
  });

  test('title/price row layout and colors', async ({ page }) => {
    const firstTile = page.locator('.packages-grid a').first();
    const row = firstTile.locator('.flex-horizontal.space-between.gap-16px---flex-wrap');
    await expect(row).toBeVisible();

    const title = row.locator('h3');
    const price = row.locator('.display-7.text-neutral-100').first();
    await expect(title).toBeVisible();
    await expect(price).toBeVisible();

    // Price color should be the dark neutral (overridden in Shop grid CSS)
    const priceColor = await price.evaluate((el) => getComputedStyle(el as HTMLElement).color);
    expect(priceColor).toBe('rgb(30, 30, 36)');

    // Title and price should be on the same visual row (y positions roughly equal)
    const [titleBox, priceBox] = await Promise.all([title.boundingBox(), price.boundingBox()]);
    expect(titleBox).toBeTruthy();
    expect(priceBox).toBeTruthy();
    if (titleBox && priceBox) {
      const yDelta = Math.abs(titleBox.y - priceBox.y);
      expect(yDelta).toBeLessThanOrEqual(8);
    }
  });
});
