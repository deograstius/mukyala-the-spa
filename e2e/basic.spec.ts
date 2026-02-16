import { test, expect } from '@playwright/test';

test('home page has correct heading', async ({ page }) => {
  await page.goto('/');

  const heading = page.getByRole('heading', {
    level: 1,
    name: /luxury with truth/i,
  });
  await expect(heading).toBeVisible();
});
