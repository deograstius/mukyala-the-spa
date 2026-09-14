import { test, expect } from '@playwright/test';

// Smoke: the home page loads and renders the hero. The old assertion pinned a
// long-removed h1 ("luxury with truth"); the current home hero intentionally
// has NO h1 (see home-hero.spec.ts, which pins the subheadline + no-h1
// invariant in detail).
test('home page loads with the hero visible', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/mukyala/i);
  await expect(page.locator('[data-cta-id="home-hero-cta"]')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(0);
});
