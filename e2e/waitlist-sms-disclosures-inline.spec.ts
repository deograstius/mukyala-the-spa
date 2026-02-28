import { expect, test, type Page } from '@playwright/test';
import { mockApiRoutes } from './api-mocks';

async function seedCartWithOneProduct(page: Page) {
  await page.goto('/shop');
  const productGrid = page.locator('.packages-grid');
  await expect(productGrid).toBeVisible();
  await productGrid.locator('a').first().click();
  await page.getByRole('button', { name: /add to cart/i }).click();
}

async function mockHoldFailedCheckout(page: Page) {
  await page.route('**/orders/v1/orders/*/checkout', async (route) => {
    await route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'hold_failed',
        details: { sku: 'MK-B5HS-30ML' },
      }),
    });
  });
}

test('reservation waitlist SMS CTA includes disclosures link and navigates to /sms-disclosures', async ({
  page,
}) => {
  await mockApiRoutes(page);
  await page.goto('/reservation');

  const waitlistSmsCta = page.locator('[data-cta-id="waitlist-sms"]').first();
  const disclosuresLink = page
    .locator('[data-cta-id="reservation-waitlist-sms-disclosures"]')
    .first();

  await expect(waitlistSmsCta).toBeVisible();
  await expect(disclosuresLink).toBeVisible();
  await expect(disclosuresLink).toHaveAttribute('href', '/sms-disclosures');
  await expect(disclosuresLink).not.toHaveClass(/(^|\s)link(\s|$)/);
  await expect(disclosuresLink).toHaveCSS('display', 'inline');

  await disclosuresLink.click();
  await expect(page).toHaveURL(/\/sms-disclosures\/?$/);
});

test('checkout sold-out waitlist CTA includes disclosures link to /sms-disclosures', async ({
  page,
}) => {
  await mockApiRoutes(page);
  await mockHoldFailedCheckout(page);
  await seedCartWithOneProduct(page);

  await page.goto('/checkout');
  await page.locator('[data-cta-id="checkout-proceed"]').click();

  const soldOutAlert = page
    .getByRole('alert')
    .filter({ has: page.locator('[data-cta-id="checkout-waitlist-sms-disclosures"]') });
  const waitlistSmsCta = soldOutAlert.locator('[data-cta-id="waitlist-sms"]');
  const disclosuresLink = soldOutAlert.locator('[data-cta-id="checkout-waitlist-sms-disclosures"]');

  await expect(waitlistSmsCta).toBeVisible();
  await expect(disclosuresLink).toBeVisible();
  await expect(disclosuresLink).toHaveAttribute('href', '/sms-disclosures');
  await expect(disclosuresLink).not.toHaveClass(/(^|\s)link(\s|$)/);
  await expect(disclosuresLink).toHaveCSS('display', 'inline');
});

test('cart drawer sold-out waitlist CTA includes disclosures link to /sms-disclosures', async ({
  page,
}) => {
  await mockApiRoutes(page);
  await mockHoldFailedCheckout(page);
  await seedCartWithOneProduct(page);

  const cartHeading = page.getByRole('heading', { name: /your cart/i });
  await expect(cartHeading).toBeVisible();

  await page.locator('[data-cta-id="cart-continue-to-checkout"]').click();

  const soldOutAlert = page
    .getByRole('alert')
    .filter({ has: page.locator('[data-cta-id="cart-waitlist-sms-disclosures"]') });
  const waitlistSmsCta = soldOutAlert.locator('[data-cta-id="waitlist-sms"]');
  const disclosuresLink = soldOutAlert.locator('[data-cta-id="cart-waitlist-sms-disclosures"]');

  await expect(waitlistSmsCta).toBeVisible();
  await expect(disclosuresLink).toBeVisible();
  await expect(disclosuresLink).toHaveAttribute('href', '/sms-disclosures');
  await expect(disclosuresLink).not.toHaveClass(/(^|\s)link(\s|$)/);
  await expect(disclosuresLink).toHaveCSS('display', 'inline');
});
