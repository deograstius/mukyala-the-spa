import { test, expect } from '@playwright/test';
import { zonedTimeToUtc } from '../src/utils/tz';
import { mockApiRoutes } from './api-mocks';

function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  const mod10 = n % 10;
  if (mod10 === 1) return `${n}st`;
  if (mod10 === 2) return `${n}nd`;
  if (mod10 === 3) return `${n}rd`;
  return `${n}th`;
}

function dayPickerAriaLabel(d: Date): string {
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(d);
  const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(d);
  const year = new Intl.DateTimeFormat('en-US', { year: 'numeric' }).format(d);
  return `${weekday}, ${month} ${ordinal(d.getDate())}, ${year}`;
}

test('reservation flow: fill minimal fields and submit', async ({ page }) => {
  await mockApiRoutes(page);
  await page.unroute('**/v1/locations/*/services/*/availability?*');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = formatYmd(tomorrow);
  const [year, month, day] = date.split('-').map((n) => parseInt(n, 10));
  const selectedUtc = zonedTimeToUtc(
    { year, month, day, hour: 10, minute: 0 },
    'America/Los_Angeles',
  ).toISOString();

  await page.route('**/v1/locations/*/services/*/availability?*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ timezone: 'America/Los_Angeles', slots: [selectedUtc] }),
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

  // Select a service (required)
  await page.getByLabel('Service').selectOption({ index: 1 });

  // Pick a date (tomorrow)
  const dateField = page.getByRole('group', { name: 'Date' });
  await dateField.getByRole('button', { name: dayPickerAriaLabel(tomorrow), exact: true }).click();

  // Pick a time (10:00 AM) – enabled by mocked availability
  const timeField = page.getByRole('group', { name: 'Time' });
  const tenAm = timeField.getByRole('button', { name: '10:00 AM' });
  await expect(tenAm).toBeEnabled();
  await tenAm.click();

  await page.getByRole('button', { name: /make a reservation/i }).click();

  await expect(page.getByRole('heading', { name: /thank you/i })).toBeVisible({ timeout: 10_000 });
});
