import { test, expect } from '@playwright/test';

test('Featured products heading reveals on scroll', async ({ page }) => {
  await page.goto('/');
  const heading = page.getByRole('heading', { name: /featured products/i });
  await heading.scrollIntoViewIfNeeded();
  await expect(heading).toBeVisible();
});
