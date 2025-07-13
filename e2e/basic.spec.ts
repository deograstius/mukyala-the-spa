import { test, expect } from '@playwright/test';

// A very small smoke-test that visits the home page and checks that
// the React/Vite template heading is visible.

test('home page has correct heading', async ({ page }) => {
  await page.goto('/');

  // H1 contains "Vite + React"
  const heading = page.getByRole('heading', { level: 1, name: /vite \+ react/i });
  await expect(heading).toBeVisible();
});
