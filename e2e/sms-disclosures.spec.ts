import { expect, test } from '@playwright/test';

test('SMS Program Disclosures page renders key compliance content at /sms-disclosures', async ({
  page,
}) => {
  await page.goto('/sms-disclosures');

  await expect(page).toHaveURL(/\/sms-disclosures\/?$/);
  await expect(
    page.getByRole('heading', { level: 1, name: /sms program disclosures/i }),
  ).toBeVisible();
  const disclosures = page.locator('.w-richtext');
  await expect(disclosures).toContainText(/brand\/program name:/i);
  await expect(disclosures).toContainText(/message frequency varies/i);
  await expect(disclosures).toContainText(/msg\s*&\s*data rates may apply/i);
  await expect(disclosures).toContainText(/reply\s+stop/i);
  await expect(disclosures).toContainText(/reply\s+help/i);
  await expect(disclosures).toContainText(/recurring marketing text messages/i);
  await expect(disclosures).toContainText(/consent is not a condition of purchase/i);

  const policyLinks = disclosures;
  await expect(policyLinks.getByRole('link', { name: /privacy policy/i })).toHaveAttribute(
    'href',
    '/privacy',
  );
  await expect(policyLinks.getByRole('link', { name: /terms of service/i })).toHaveAttribute(
    'href',
    '/terms',
  );
});

test('footer SMS Program Disclosures link navigates to /sms-disclosures', async ({ page }) => {
  await page.goto('/terms');

  const footer = page.getByRole('contentinfo');
  const smsDisclosuresLink = footer.locator('[data-cta-id="footer-sms-disclosures"]');

  await expect(smsDisclosuresLink).toBeVisible();
  await expect(smsDisclosuresLink).toHaveAttribute('href', '/sms-disclosures');

  await smsDisclosuresLink.click();
  await expect(page).toHaveURL(/\/sms-disclosures\/?$/);
  await expect(
    page.getByRole('heading', { level: 1, name: /sms program disclosures/i }),
  ).toBeVisible();
});

test('invalid sms-disclosures route shows not found state', async ({ page }) => {
  await page.goto('/sms-disclosures-invalid');

  await expect(page).toHaveURL(/\/sms-disclosures-invalid\/?$/);
  await expect(page.getByRole('heading', { level: 1, name: /page not found/i })).toBeVisible();
  await expect(page.locator('[data-cta-id="not-found-home"]')).toBeVisible();
});
