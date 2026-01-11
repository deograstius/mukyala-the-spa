import { test, expect } from '@playwright/test';
import { mockApiRoutes, mockReservationFlow } from './api-mocks';

// Use staging when explicitly requested, otherwise run against local preview with mocks
const USE_STAGING = process.env.STAGING_E2E === 'true';

const STAGING_ORIGIN = (process.env.STAGING_ORIGIN || 'https://staging.mukyala.com').replace(
  /\/$/,
  '',
);
const LOCATION_ID = process.env.LOCATION_ID || 'carlsbad-village';
const SERVICE_SLUG = process.env.SERVICE_SLUG || 'so-africal-facial';
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

test.describe('Staging API E2E', () => {
  test('browse catalog → availability → create → confirm → cancel', async ({ page, request }) => {
    const ORIGIN = USE_STAGING ? STAGING_ORIGIN : 'http://localhost:5173';
    const getJson = async (path: string) => {
      if (USE_STAGING) {
        const r = await request.get(`${ORIGIN}${path}`);
        expect(r.ok()).toBeTruthy();
        return r.json();
      } else {
        // Use page.fetch via evaluate to allow route interception to apply
        return page.evaluate(async (p) => {
          const res = await fetch(p);
          if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
          return res.json();
        }, path);
      }
    };
    const postJson = async (path: string, data?: any) => {
      if (USE_STAGING) {
        const r = await request.post(`${ORIGIN}${path}`, { data });
        expect(r.ok()).toBeTruthy();
        return r.json();
      } else {
        return page.evaluate(
          async ({ p, d }) => {
            const res = await fetch(p, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify(d ?? {}),
            });
            if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
            return res.json();
          },
          { p: path, d: data },
        );
      }
    };
    if (!USE_STAGING) {
      await mockApiRoutes(page);
      await mockReservationFlow(page);
    }
    // Basic browse: services page renders (SPA fetches same-origin /v1/services)
    const res = await page.goto(`${ORIGIN}/services`);
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { level: 1, name: /services/i })).toBeVisible();

    // Catalog via API (same-origin path proxy)
    await getJson(`/v1/services`);

    await getJson(`/v1/locations`);

    // Find a slot in the next 10 days
    let slot: string | null = null;
    let date: string | null = null;
    for (let d = 2; d <= 10; d++) {
      date = ymdInTz(d);
      const body: any = await getJson(
        `/v1/locations/${encodeURIComponent(LOCATION_ID)}/services/${encodeURIComponent(
          SERVICE_SLUG,
        )}/availability?date=${date}`,
      );
      if (Array.isArray(body.slots) && body.slots.length) {
        slot = body.slots[0];
        break;
      }
    }
    expect(slot, 'no available slot found in the next 10 days').toBeTruthy();

    // Create reservation
    const reservation = await postJson(`/v1/reservations`, {
      name: 'E2E Staging QA',
      email: 'qa@example.com',
      phone: '+15550000000',
      serviceSlug: SERVICE_SLUG,
      locationId: LOCATION_ID,
      startAt: slot,
      timezone: TIMEZONE,
    });
    expect(reservation?.id).toBeTruthy();

    // Acquire signed token (requires ENABLE_TEST_ROUTES=true on Core API)
    const tokenResp: any = await postJson(
      `/v1/reservations/${encodeURIComponent(reservation.id)}/token`,
    );
    const token = tokenResp?.token as string | undefined;
    expect(token, 'Token not returned; ensure ENABLE_TEST_ROUTES=true').toBeTruthy();

    // Confirm
    await postJson(`/v1/reservations/${encodeURIComponent(reservation.id)}/confirm`, { token });

    // Cancel
    await postJson(`/v1/reservations/${encodeURIComponent(reservation.id)}/cancel`, { token });

    // Verify slot reappears
    const body2: any = await getJson(
      `/v1/locations/${encodeURIComponent(LOCATION_ID)}/services/${encodeURIComponent(
        SERVICE_SLUG,
      )}/availability?date=${date}`,
    );
    expect(Array.isArray(body2.slots) && body2.slots.includes(slot)).toBeTruthy();
  });
});
