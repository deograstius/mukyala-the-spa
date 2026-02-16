import { test, expect } from '@playwright/test';
import { mockApiRoutes } from './api-mocks';

test('cart flow: add → open → verify subtotal → checkout', async ({ page }) => {
  await mockApiRoutes(page);
  // Go to shop and click the first product in the grid
  await page.goto('/shop');
  const grid = page.locator('.packages-grid');
  await expect(grid).toBeVisible();
  const firstProduct = grid.locator('a').first();
  await firstProduct.click();

  // Product detail: capture the price displayed and add to cart
  const priceEl = page.locator('.display-7').first();
  await expect(priceEl).toBeVisible();
  const priceText = (await priceEl.textContent())?.trim();
  await page.getByRole('button', { name: /add to cart/i }).click();

  // Webflow Commerce may auto-open the cart after "Add to cart". Only click the header button if needed.
  const cartHeading = page.getByRole('heading', { name: /your cart/i });
  try {
    await expect(cartHeading).toBeVisible({ timeout: 5000 });
  } catch {
    await page.getByRole('button', { name: /open cart/i }).click();
    await expect(cartHeading).toBeVisible();
  }

  // Subtotal should match unit price for quantity 1
  const subtotalEl = page.locator('.cart-footer .cart-subtotal-number');
  await expect(subtotalEl).toBeVisible();
  const subtotalText = (await subtotalEl.textContent())?.trim();
  expect(subtotalText).toBe(priceText);

  // Continue to checkout and verify
  await page.getByRole('button', { name: /continue to checkout/i }).click();
  await page.waitForURL('**/checkout/success?orderId=*');
  await expect(page.getByRole('heading', { name: /order summary/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /continue shopping/i })).toHaveAttribute(
    'href',
    '/shop',
  );
});
