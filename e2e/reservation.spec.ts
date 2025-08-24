import { test, expect } from '@playwright/test';

test('reservation flow: fill minimal fields and submit', async ({ page }) => {
  await page.goto('/reservation');

  await expect(page.getByRole('heading', { level: 1, name: /book an appointment/i })).toBeVisible();

  await page.getByLabel('Name').fill('Jane Doe');
  await page.getByLabel('Phone').fill('1234567890');

  // Pick a future date/time within hours (10:00)
  await page.getByLabel('Date and time').fill('2030-01-01T10:00');

  await page.getByRole('button', { name: /make a reservation/i }).click();

  await expect(page.getByRole('heading', { name: /thank you/i })).toBeVisible();
});
