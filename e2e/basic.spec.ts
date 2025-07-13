import { test, expect } from '@playwright/test';

// A very small smoke-test that visits the home page and checks that
// the React/Vite template heading is visible.

test('home page has correct heading', async ({ page }) => {
  await page.goto('/');

  // H1 contains the hero tagline
  const heading = page.getByRole('heading', {
    level: 1,
    name: /experience beauty and wellness like never before/i,
  });
  await expect(heading).toBeVisible();
});
