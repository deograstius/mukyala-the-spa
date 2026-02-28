import { expect, test } from '@playwright/test';

test('Shipping / Fulfillment page renders at /shipping', async ({ page }) => {
  await page.goto('/shipping');

  await expect(
    page.getByRole('heading', { level: 1, name: /shipping\s*\/\s*fulfillment/i }),
  ).toBeVisible();
  await expect(page.getByText(/last updated:\s*2026-02-28/i)).toBeVisible();
});

test('footer links to Shipping / Fulfillment → /shipping', async ({ page }) => {
  await page.goto('/');

  const footer = page.getByRole('contentinfo');
  const shippingLink = footer.getByRole('link', { name: /shipping\s*\/\s*fulfillment/i });

  await expect(shippingLink).toBeVisible();
  await expect(shippingLink).toHaveAttribute('href', '/shipping');

  await shippingLink.click();
  await expect(page).toHaveURL(/\/shipping\/?$/);

  await expect(
    page.getByRole('heading', { level: 1, name: /shipping\s*\/\s*fulfillment/i }),
  ).toBeVisible();
});
