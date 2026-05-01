/**
 * E2E coverage for the home hero CTAs (Reservation + Consultation).
 *
 * Authored as the user-facing pin replacing the `consultation.todo.spec.ts`
 * placeholder. Mirrors the selector style used by `reservation.spec.ts` and
 * `spa-consultation-pre-release.spec.ts`:
 *   1) `data-cta-id` for the hero buttons
 *   2) `getByText` / `getByRole` for copy
 *
 * Network: shared `mockApiRoutes` stubs `/v1/services`, `/v1/products`,
 * `/v1/locations`, `/v1/locations/*\/services/*\/availability`, so the home
 * page never touches a real backend.
 */

import { test, expect } from '@playwright/test';
import { mockApiRoutes } from './api-mocks';

test.describe('home hero — Reservation + Consultation CTAs', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
  });

  test('subheadline copy is present', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Timeless rituals,\s*inclusive care\./i)).toBeVisible();
  });

  test('two CTAs render side-by-side with correct data-cta-id and hrefs', async ({ page }) => {
    await page.goto('/');

    const reservationCta = page.locator('[data-cta-id="home-hero-cta"]');
    const consultationCta = page.locator('[data-cta-id="home-hero-consultation-cta"]');
    await expect(reservationCta).toBeVisible();
    await expect(consultationCta).toBeVisible();

    await expect(reservationCta).toHaveAttribute('href', '/reservation');
    await expect(consultationCta).toHaveAttribute('href', '/consultation');

    // Both CTAs sit on the same horizontal row at hero width. Allow ~10px
    // slack on the y-coordinate for sub-pixel rendering of side-by-side
    // flex children.
    const resBox = await reservationCta.boundingBox();
    const consBox = await consultationCta.boundingBox();
    expect(resBox).not.toBeNull();
    expect(consBox).not.toBeNull();
    expect(Math.abs(resBox!.y - consBox!.y)).toBeLessThanOrEqual(10);
    expect(resBox!.x).toBeLessThan(consBox!.x);
  });

  test('clicking Consultation routes to /consultation/step-1', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-cta-id="home-hero-consultation-cta"]').click();
    await page.waitForURL(/\/consultation\/step-1$/);
    await expect(page.locator('.consultation-step-1')).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 1, name: /your free mukyala skin consultation/i }),
    ).toBeVisible();
  });

  test('clicking Reservation routes to /reservation', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-cta-id="home-hero-cta"]').click();
    await page.waitForURL(/\/reservation$/);
    await expect(
      page.getByRole('heading', { level: 1, name: /book an appointment/i }),
    ).toBeVisible();
  });
});
