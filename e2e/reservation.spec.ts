import { test, expect } from '@playwright/test';
import { mockApiRoutes } from './api-mocks';

test('reservation flow: fill minimal fields and submit', async ({ page }) => {
  await mockApiRoutes(page);
  // Mock availability to include the requested slot at 10:00 PT => 18:00 UTC on 2030-01-01
  const selectedUtc = new Date(Date.UTC(2030, 0, 1, 18, 0, 0)).toISOString();
  await page.route('**/v1/locations/*/services/*/availability?*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ slots: [selectedUtc] }),
    });
  });
  // Mock reservation create endpoint
  await page.route('**/v1/reservations', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'e2e-1', status: 'pending' }),
    });
  });
  await page.goto('/reservation');

  await expect(page.getByRole('heading', { level: 1, name: /book an appointment/i })).toBeVisible();

  await page.getByLabel('Name').fill('Jane Doe');
  await page.getByLabel('Phone').fill('1234567890');
  await page.getByLabel('Email', { exact: true }).fill('qa@example.com');

  // Pick a future date/time within hours (10:00)
  await page.getByLabel('Date and time').fill('2030-01-01T10:00');

  // Select a service (required)
  await page.getByLabel('Service').selectOption({ index: 1 });

  // Consent is required for submission.
  await page.getByRole('checkbox', { name: /i consent to mukyala storing my details/i }).check();

  await page.getByRole('button', { name: /make a reservation/i }).click();

  await expect(page.getByRole('heading', { name: /thank you/i })).toBeVisible({ timeout: 10_000 });
});
