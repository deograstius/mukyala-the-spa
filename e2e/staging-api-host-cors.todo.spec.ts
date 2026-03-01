import { expect, test } from '@playwright/test';

const CONFIGURED_API_BASE_URL = process.env.E2E_EXPECT_API_BASE_URL?.trim().replace(/\/$/, '');
const PROBE_API_BASE_URL = CONFIGURED_API_BASE_URL || 'https://api.staging.mukyala.com';

function corsHeadersForOrigin(origin: string | undefined, requestHeaders?: string) {
  return {
    'access-control-allow-origin': origin || '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers':
      requestHeaders || 'content-type,x-mukyala-anonymous-id,x-mukyala-session-id',
    vary: 'Origin',
  };
}

test.describe('staging API host + CORS parity', () => {
  test('service detail loader targets configured API host', async ({ page }) => {
    let requestedServicesUrl = '';

    await page.route('**/v1/services', async (route) => {
      const req = route.request();
      if (req.method() === 'OPTIONS') {
        const origin = req.headers().origin;
        const requestHeaders = req.headers()['access-control-request-headers'];
        await route.fulfill({
          status: 204,
          headers: corsHeadersForOrigin(origin, requestHeaders),
        });
        return;
      }

      requestedServicesUrl = req.url();
      await route.fulfill({
        status: 200,
        headers: {
          ...corsHeadersForOrigin(req.headers().origin),
          'content-type': 'application/json',
        },
        body: JSON.stringify([
          {
            slug: 'so-africal-facial',
            title: 'So AfriCal Facial',
            description: 'E2E fixture service description',
            durationMinutes: 60,
            priceCents: 40000,
          },
        ]),
      });
    });

    await page.goto('/services/so-africal-facial');
    await expect(page.getByRole('heading', { level: 1, name: 'So AfriCal Facial' })).toBeVisible();
    const expectedApiBaseUrl = CONFIGURED_API_BASE_URL || new URL(page.url()).origin;
    expect(requestedServicesUrl).toBe(`${expectedApiBaseUrl}/v1/services`);
  });

  test('cross-origin preflight allows matching origin and blocks mismatched origin', async ({
    page,
  }) => {
    const allowedProbeUrl = `${PROBE_API_BASE_URL}/v1/cors-allowed-probe`;
    const deniedProbeUrl = `${PROBE_API_BASE_URL}/v1/cors-denied-probe`;
    let allowedPreflightOrigin: string | undefined;
    let deniedPreflightOrigin: string | undefined;
    let allowedRequestOrigin: string | undefined;
    let deniedRequestOrigin: string | undefined;

    await page.route(allowedProbeUrl, async (route) => {
      const req = route.request();
      if (req.method() === 'OPTIONS') {
        allowedPreflightOrigin = req.headers().origin;
        const requestHeaders = req.headers()['access-control-request-headers'];
        await route.fulfill({
          status: 204,
          headers: corsHeadersForOrigin(allowedPreflightOrigin, requestHeaders),
        });
        return;
      }

      allowedRequestOrigin = req.headers().origin;
      await route.fulfill({
        status: 200,
        headers: {
          ...corsHeadersForOrigin(allowedPreflightOrigin),
          'content-type': 'application/json',
        },
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.route(deniedProbeUrl, async (route) => {
      const req = route.request();
      if (req.method() === 'OPTIONS') {
        deniedPreflightOrigin = req.headers().origin;
        const requestHeaders = req.headers()['access-control-request-headers'];
        await route.fulfill({
          status: 204,
          headers: {
            ...corsHeadersForOrigin('https://www.mukyala.com', requestHeaders),
            vary: 'Origin',
          },
        });
        return;
      }

      deniedRequestOrigin = req.headers().origin;
      await route.fulfill({
        status: 200,
        headers: {
          ...corsHeadersForOrigin('https://www.mukyala.com'),
          'content-type': 'application/json',
        },
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto('/');

    const allowedResult = await page.evaluate(async (url) => {
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: { 'x-mukyala-e2e': 'allow-origin-probe' },
        });
        return {
          ok: res.ok,
          status: res.status,
        };
      } catch (error) {
        return {
          ok: false,
          status: null,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }, allowedProbeUrl);

    expect(allowedResult).toEqual({ ok: true, status: 200 });
    expect(allowedRequestOrigin).toBe('http://localhost:5173');
    if (allowedPreflightOrigin) {
      expect(allowedPreflightOrigin).toBe('http://localhost:5173');
    }

    const deniedResult = await page.evaluate(async (url) => {
      try {
        await fetch(url, {
          method: 'GET',
          headers: { 'x-mukyala-e2e': 'deny-origin-probe' },
        });
        return 'succeeded';
      } catch {
        return 'blocked';
      }
    }, deniedProbeUrl);

    expect(deniedResult).toBe('blocked');
    expect(deniedRequestOrigin).toBe('http://localhost:5173');
    if (deniedPreflightOrigin) {
      expect(deniedPreflightOrigin).toBe('http://localhost:5173');
    }
  });
});
