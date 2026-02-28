import { expect, test } from '@playwright/test';

async function expectFooterSupportContact(page: import('@playwright/test').Page, path = '/') {
  await page.goto(path);

  const footer = page.getByRole('contentinfo');
  const addressLink = footer.locator('[data-cta-id="footer-address"]');
  const phoneLink = footer.locator('[data-cta-id="footer-phone"]');
  const emailLink = footer.locator('[data-cta-id="footer-email"]');

  await expect(addressLink).toBeVisible();
  await expect(addressLink).toContainText('390 Oak Ave');
  await expect(addressLink).toContainText('Carlsbad, CA 92008');
  await expect(addressLink).toHaveAttribute('href', /google\.com\/maps\/place\/390\+Oak\+Ave/i);

  await expect(phoneLink).toBeVisible();
  await expect(phoneLink).toContainText('(443) 681 0463');
  await expect(phoneLink).toHaveAttribute('href', 'tel:+14436810463');

  await expect(emailLink).toBeVisible();
  await expect(emailLink).toHaveText('info@mukyala.com');
  await expect(emailLink).toHaveAttribute('href', 'mailto:info@mukyala.com');
}

test('footer support contact is visible and actionable on home (desktop)', async ({ page }) => {
  await expectFooterSupportContact(page, '/');
});

test('footer support contact is visible and actionable on Terms (desktop)', async ({ page }) => {
  await expectFooterSupportContact(page, '/terms');
});

test.describe('mobile viewport', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('footer support contact is visible and actionable on home (mobile)', async ({ page }) => {
    await expectFooterSupportContact(page, '/');
  });
});
