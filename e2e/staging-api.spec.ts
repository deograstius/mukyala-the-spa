import { test, expect } from '@playwright/test';

// Guarded: set STAGING_E2E=true to run this spec.
const RUN = process.env.STAGING_E2E === 'true';

const STAGING_ORIGIN = (process.env.STAGING_ORIGIN || 'https://staging.mukyala.com').replace(/\/$/, '');
const LOCATION_ID = process.env.LOCATION_ID || 'carlsbad-village';
const SERVICE_SLUG = process.env.SERVICE_SLUG || 'baobab-glow-facial';
const TIMEZONE = process.env.TIMEZONE || 'America/Los_Angeles';

function ymdInTz(daysAhead: number) {
  const ref = new Date(Date.now() + daysAhead * 86400 * 1000);
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(ref);
}

test.describe(RUN ? 'Staging API E2E' : 'Staging API E2E (skipped)', () => {
  test.skip(!RUN, 'Set STAGING_E2E=true to run staging API E2E');

  test('browse catalog → availability → create → confirm → cancel', async ({ page, request }) => {
    // Basic browse: services page renders (SPA fetches same-origin /v1/services)
    const res = await page.goto(`${STAGING_ORIGIN}/services`);
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { level: 1, name: /services/i })).toBeVisible();

    // Catalog via API (same-origin path proxy)
    const servicesResp = await request.get(`${STAGING_ORIGIN}/v1/services`);
    expect(servicesResp.ok()).toBeTruthy();

    const locationsResp = await request.get(`${STAGING_ORIGIN}/v1/locations`);
    expect(locationsResp.ok()).toBeTruthy();

    // Find a slot in the next 10 days
    let slot: string | null = null;
    let date: string | null = null;
    for (let d = 2; d <= 10; d++) {
      date = ymdInTz(d);
      const avail = await request.get(
        `${STAGING_ORIGIN}/v1/locations/${encodeURIComponent(LOCATION_ID)}/services/${encodeURIComponent(
          SERVICE_SLUG,
        )}/availability?date=${date}`,
      );
      expect(avail.ok()).toBeTruthy();
      const body = await avail.json();
      if (Array.isArray(body.slots) && body.slots.length) {
        slot = body.slots[0];
        break;
      }
    }
    expect(slot, 'no available slot found in the next 10 days').toBeTruthy();

    // Create reservation
    const create = await request.post(`${STAGING_ORIGIN}/v1/reservations`, {
      data: {
        name: 'E2E Staging QA',
        email: 'qa@example.com',
        phone: '+15550000000',
        serviceSlug: SERVICE_SLUG,
        locationId: LOCATION_ID,
        startAt: slot,
        timezone: TIMEZONE,
      },
    });
    expect(create.ok()).toBeTruthy();
    const reservation = await create.json();
    expect(reservation?.id).toBeTruthy();

    // Acquire signed token (requires ENABLE_TEST_ROUTES=true on Core API)
    const tok = await request.post(`${STAGING_ORIGIN}/v1/reservations/${encodeURIComponent(reservation.id)}/token`);
    expect(tok.ok()).toBeTruthy();
    const token = (await tok.json())?.token as string | undefined;
    expect(token, 'Token not returned; ensure ENABLE_TEST_ROUTES=true').toBeTruthy();

    // Confirm
    const confirmed = await request.post(
      `${STAGING_ORIGIN}/v1/reservations/${encodeURIComponent(reservation.id)}/confirm`,
      { data: { token } },
    );
    expect(confirmed.ok()).toBeTruthy();

    // Cancel
    const canceled = await request.post(
      `${STAGING_ORIGIN}/v1/reservations/${encodeURIComponent(reservation.id)}/cancel`,
      { data: { token } },
    );
    expect(canceled.ok()).toBeTruthy();

    // Verify slot reappears
    const avail2 = await request.get(
      `${STAGING_ORIGIN}/v1/locations/${encodeURIComponent(LOCATION_ID)}/services/${encodeURIComponent(
        SERVICE_SLUG,
      )}/availability?date=${date}`,
    );
    expect(avail2.ok()).toBeTruthy();
    const body2 = await avail2.json();
    expect(Array.isArray(body2.slots) && body2.slots.includes(slot)).toBeTruthy();
  });
});

