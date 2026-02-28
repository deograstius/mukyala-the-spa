import { test, expect } from '@playwright/test';

test('footer links to Refunds & Returns → /refunds', async ({ page }) => {
  await page.goto('/');

  const footer = page.getByRole('contentinfo');
  const refundsLink = footer.getByRole('link', { name: /refunds\s*&\s*returns/i });

  await expect(refundsLink).toBeVisible();
  await expect(refundsLink).toHaveAttribute('href', '/refunds');

  await refundsLink.click();
  await expect(page).toHaveURL(/\/refunds\/?$/);

  await expect(
    page.getByRole('heading', { level: 1, name: /refunds\s*&\s*returns/i }),
  ).toBeVisible();
  await expect(page.getByText(/shipped product orders/i)).toBeVisible();
});

test('Refunds & Returns page renders at /refunds', async ({ page }) => {
  await page.goto('/refunds');

  await expect(
    page.getByRole('heading', { level: 1, name: /refunds\s*&\s*returns/i }),
  ).toBeVisible();
  await expect(
    page.locator('.w-richtext').getByRole('link', { name: 'info@mukyala.com' }),
  ).toHaveAttribute('href', /mailto:info@mukyala\.com/i);
});
