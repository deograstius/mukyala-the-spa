import { expect, test } from '@playwright/test';

test('Privacy Policy page shows explicit mobile-number usage language', async ({ page }) => {
  await page.goto('/privacy');

  await expect(
    page.getByRole('heading', { level: 1, name: /mukyala privacy policy/i }),
  ).toBeVisible();
  await expect(page.getByText(/we do not sell or rent your mobile number\./i)).toBeVisible();
  await expect(
    page.getByText(/we use your mobile number only for mukyala communications/i),
  ).toBeVisible();
  await expect(
    page.getByText(
      /required processors \(such as twilio\) solely to deliver those communications\./i,
    ),
  ).toBeVisible();
});

test('invalid privacy route shows not found state', async ({ page }) => {
  await page.goto('/privacy-invalid');

  await expect(page.getByRole('heading', { level: 1, name: /page not found\./i })).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 1, name: /mukyala privacy policy/i }),
  ).not.toBeVisible();
});
