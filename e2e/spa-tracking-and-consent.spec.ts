/**
 * E2E coverage for chunk `spa-tracking-and-consent-2026-05-09`.
 *
 * Sections:
 *   A. Cookie banner — auto-show, Accept/Decline persistence, privacy-page DNSMPI re-open (#41),
 *      keyboard accessibility.
 *   B. Privacy page — /privacy renders, content substrings, headings, footer link.
 *   D. DataLayer / no-tracking-by-default — zero GTM/GA/Pixel network requests when
 *      VITE_GTM_ID is unset; window.dataLayer is undefined or empty.
 *   E. Smoke regressions — services list, pre-opening surfaces stay gone, JSON-LD
 *      BeautySalon.
 *   F. Mobile viewport — banner doesn't overflow / blocks usage on iPhone 13.
 *
 * Selector style: prefer `data-cta-id` and `getByRole`. Locators auto-wait;
 * we never use `page.waitForTimeout`.
 *
 * Network: `mockApiRoutes` stubs `/v1/services`, `/v1/products`, `/v1/locations`.
 * The /v1/services mock is overridden in section E to render the full 8-service
 * opening menu.
 */

import { test, expect, type Page } from '@playwright/test';
import { mockApiRoutes } from './api-mocks';

const CONSENT_STORAGE_KEY = 'mukyala.consentChoice.v1';

// iPhone 13-ish viewport (Firefox doesn't support `isMobile`, so we keep it
// to a plain viewport override to stay portable across all three projects).
const IPHONE_13_VIEWPORT = {
  viewport: { width: 390, height: 844 },
};

const OPENING_MENU = [
  { slug: 'signature-facial', title: 'Signature Facial', priceCents: 18500 },
  { slug: 'deluxe-ritual-facial', title: 'Deluxe Ritual Facial', priceCents: 24500 },
  { slug: 'dermaplane-facial', title: 'Dermaplane Facial', priceCents: 19500 },
  { slug: 'chemical-peel', title: 'Chemical Peel', priceCents: 17500 },
  { slug: 'nano-needling', title: 'Nano-needling', priceCents: 25000 },
  { slug: 'body-scrub-ritual', title: 'Body Scrub Ritual', priceCents: 24500 },
  { slug: 'back-facial', title: 'Back Facial', priceCents: 11500 },
  { slug: 'led-add-on', title: 'LED Therapy Add-on', priceCents: 3500 },
];

async function mockOpeningMenu(page: Page) {
  await page.route('**/v1/services', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        OPENING_MENU.map((s) => ({
          ...s,
          description: `${s.title} description.`,
          durationMinutes: 60,
          image: '/images/home-hero.jpg',
          imageSrcSet:
            '/images/home-hero-p-500.jpg 500w, /images/home-hero-p-800.jpg 800w, /images/home-hero.jpg 1024w',
          imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
          active: true,
        })),
      ),
    }),
  );
}

// ---------------------------------------------------------------------------
// A. Cookie banner
// ---------------------------------------------------------------------------

test.describe('Cookie banner', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
  });

  test('first visit: banner is visible at bottom with role/aria + Accept and Decline buttons', async ({
    page,
  }) => {
    // Each Playwright test gets a fresh browser context (isolated localStorage)
    // by default, so this is already a "first visit".
    await page.goto('/');

    const banner = page.getByRole('region', { name: /cookie consent/i });
    await expect(banner).toBeVisible();

    // Banner sits near the bottom of the viewport.
    const bannerBox = await banner.boundingBox();
    const viewportSize = page.viewportSize();
    expect(bannerBox).not.toBeNull();
    expect(viewportSize).not.toBeNull();
    // Banner bottom edge should be at or near the viewport bottom (within 40px).
    const bottomEdge = bannerBox!.y + bannerBox!.height;
    expect(viewportSize!.height - bottomEdge).toBeLessThan(40);

    // Both buttons exist inside the banner.
    await expect(banner.getByRole('button', { name: /^accept$/i })).toBeVisible();
    await expect(banner.getByRole('button', { name: /^no thanks$/i })).toBeVisible();
  });

  test('Accept persists, banner stays hidden after reload, localStorage = accepted', async ({
    page,
  }) => {
    await page.goto('/');
    const banner = page.getByRole('region', { name: /cookie consent/i });
    await expect(banner).toBeVisible();

    await page.getByRole('button', { name: /^accept$/i }).click();
    await expect(banner).toHaveCount(0);

    const stored = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      CONSENT_STORAGE_KEY,
    );
    expect(stored).toBe('accepted');

    await page.reload();
    await expect(page.getByRole('region', { name: /cookie consent/i })).toHaveCount(0);
  });

  test('Decline persists, banner stays hidden after reload, localStorage = declined', async ({
    page,
  }) => {
    await page.goto('/');
    const banner = page.getByRole('region', { name: /cookie consent/i });
    await expect(banner).toBeVisible();

    await page.getByRole('button', { name: /^no thanks$/i }).click();
    await expect(banner).toHaveCount(0);

    const stored = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      CONSENT_STORAGE_KEY,
    );
    expect(stored).toBe('declined');

    await page.reload();
    await expect(page.getByRole('region', { name: /cookie consent/i })).toHaveCount(0);
  });

  test('Privacy-page DNSMPI re-opens the banner (footer no longer carries it, #41); clicking Decline updates state from accepted to declined', async ({
    page,
  }) => {
    await page.goto('/');
    // First, accept so we have a stored "accepted" state.
    await page.getByRole('button', { name: /^accept$/i }).click();
    await expect(page.getByRole('region', { name: /cookie consent/i })).toHaveCount(0);

    let stored = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      CONSENT_STORAGE_KEY,
    );
    expect(stored).toBe('accepted');

    // #41: the DNSMPI control moved off the footer onto the privacy page.
    // The footer must NOT carry it anymore; the privacy page re-opens the banner.
    await expect(page.locator('[data-cta-id="footer-do-not-sell-or-share"]')).toHaveCount(0);
    await page.goto('/privacy');
    const dnsmpi = page.locator('[data-cta-id="privacy-do-not-sell-or-share"]');
    await expect(dnsmpi).toBeVisible();
    await dnsmpi.scrollIntoViewIfNeeded();
    await dnsmpi.click();

    const banner = page.getByRole('region', { name: /cookie consent/i });
    await expect(banner).toBeVisible();

    // Flip from accepted to declined.
    await banner.getByRole('button', { name: /^no thanks$/i }).click();
    await expect(banner).toHaveCount(0);

    stored = await page.evaluate((key) => window.localStorage.getItem(key), CONSENT_STORAGE_KEY);
    expect(stored).toBe('declined');
  });

  test('banner is keyboard accessible — both buttons reachable via Tab and activatable with Enter', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name === 'webkit',
      'Tab focus traversal in WebKit/macOS requires Option+Tab and is unreliable in headless preview',
    );
    await page.goto('/');
    const banner = page.getByRole('region', { name: /cookie consent/i });
    await expect(banner).toBeVisible();

    // Focus the Decline button programmatically and verify Tab reaches Accept,
    // then Enter activates it. Programmatic focus avoids the very long header
    // tab chain and keeps the test deterministic across Firefox/Chromium.
    await banner.getByRole('button', { name: /^no thanks$/i }).focus();
    let focused = await page.evaluate(() =>
      (document.activeElement as HTMLElement | null)?.getAttribute('data-cta-id'),
    );
    expect(focused).toBe('cookie-banner-decline');

    await page.keyboard.press('Tab');
    focused = await page.evaluate(() =>
      (document.activeElement as HTMLElement | null)?.getAttribute('data-cta-id'),
    );
    expect(focused).toBe('cookie-banner-accept');

    // Enter activates the focused button -> banner closes, choice = accepted.
    await page.keyboard.press('Enter');
    await expect(page.getByRole('region', { name: /cookie consent/i })).toHaveCount(0);
    const stored = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      CONSENT_STORAGE_KEY,
    );
    expect(stored).toBe('accepted');
  });
});

// ---------------------------------------------------------------------------
// B. Privacy page
// ---------------------------------------------------------------------------

test.describe('Privacy page', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
  });

  test('GET /privacy returns 200', async ({ request }) => {
    const response = await request.get('/privacy');
    expect(response.status()).toBe(200);
  });

  test('contains required CCPA substrings', async ({ page }) => {
    await page.goto('/privacy');
    const html = await page.content();
    // Required substrings from the chunk spec (case-insensitive on the
    // "last updated" header since the rendered copy uses sentence case).
    expect(html).toContain('California');
    expect(html).toContain('Right to know');
    expect(html).toContain('Right to delete');
    expect(html).toContain('Right to opt out');
    expect(html).toContain('info@mukyala.com');
    expect(html).toMatch(/Last updated/i);
    expect(html).toContain('390 Oak Ave');
    expect(html).toContain('Carlsbad');
  });

  test('does not contain template-language placeholders (regression guard)', async ({ page }) => {
    await page.goto('/privacy');
    const html = await page.content();
    // Regression guard: the privacy policy was authored against a template; if any
    // of these strings creep back, copy review didn't happen. Keep this test as the
    // single source of truth for the forbidden-strings list.
    expect(html).not.toMatch(/Klaviyo/i);
    expect(html).not.toMatch(/Mailchimp/i);
    expect(html).not.toMatch(/once selected/i);
    expect(html).not.toMatch(/to be determined/i);
    expect(html).not.toMatch(/\bTBD\b/);
    expect(html).not.toMatch(/\[provider\]/i);
  });

  test('has a real <h1> and at least 5 distinct <h2> headings', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const h2Texts = await page.getByRole('heading', { level: 2 }).allTextContents();
    const distinct = new Set(h2Texts.map((t) => t.trim()).filter(Boolean));
    expect(distinct.size).toBeGreaterThanOrEqual(5);
  });

  test('reachable from footer link', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('[data-cta-id="footer-privacy"]');
    await expect(link).toBeVisible();
    await link.scrollIntoViewIfNeeded();
    await link.click();
    await page.waitForURL(/\/privacy$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// D. DataLayer / no-tracking-by-default
// ---------------------------------------------------------------------------

test.describe('No tracking by default', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
  });

  test('zero requests to googletagmanager.com / google-analytics.com / connect.facebook.net when VITE_GTM_ID is unset', async ({
    page,
  }) => {
    const tracked: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (
        url.includes('googletagmanager.com') ||
        url.includes('google-analytics.com') ||
        url.includes('connect.facebook.net') ||
        url.includes('facebook.com/tr')
      ) {
        tracked.push(url);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Cross to another in-SPA route to make sure no tags fire on transitions either.
    await page.goto('/about');
    await page.waitForLoadState('networkidle');

    expect(tracked, `unexpected tracking requests: ${tracked.join(', ')}`).toEqual([]);
  });

  test('window.dataLayer is undefined OR an empty array on first navigation when GTM is unset', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const dataLayerKind = await page.evaluate(() => {
      const dl = (window as unknown as { dataLayer?: unknown }).dataLayer;
      if (typeof dl === 'undefined') return 'undefined';
      if (Array.isArray(dl)) return dl.length === 0 ? 'empty-array' : 'non-empty-array';
      return 'other';
    });
    expect(['undefined', 'empty-array']).toContain(dataLayerKind);
  });
});

// ---------------------------------------------------------------------------
// E. Smoke regressions (carry-over from prior chunk)
// ---------------------------------------------------------------------------

test.describe('Regression smoke', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
    await mockOpeningMenu(page);
  });

  test('the 8 services on /services still render with prices', async ({ page }) => {
    await page.goto('/services');
    await expect(page.getByRole('heading', { level: 1, name: /^services$/i })).toBeVisible();
    for (const svc of OPENING_MENU) {
      await expect(page.getByText(svc.title, { exact: true }).first()).toBeVisible();
    }
    // Anchor a couple of price strings to prove the price slot is rendering.
    await expect(page.getByText('$115').first()).toBeVisible();
    await expect(page.getByText('$185').first()).toBeVisible();
  });

  test('pre-opening surfaces stay gone — no newsletter signup or founders ribbon', async ({
    page,
  }) => {
    // Operator decision 2026-09-14: pre-opening surfaces were removed entirely.
    // Guard against them creeping back on the two pages that hosted them.
    for (const path of ['/', '/about']) {
      await page.goto(path);
      await expect(page.locator('[data-cta-id="newsletter-signup-impression"]')).toHaveCount(0);
      await expect(page.locator('[data-cta-id="founders-ribbon-impression"]')).toHaveCount(0);
      await expect(page.getByText(/notify me when we open/i)).toHaveCount(0);
      await expect(page.getByText(/founders' rate/i)).toHaveCount(0);
    }
  });

  test('JSON-LD BeautySalon block is still present in head', async ({ page }) => {
    await page.goto('/');
    const ldJson = await page
      .locator('head > script[type="application/ld+json"]')
      .first()
      .textContent();
    expect(ldJson).toBeTruthy();
    const data = JSON.parse(ldJson!) as { '@type'?: string };
    expect(data['@type']).toBe('BeautySalon');
  });
});

// ---------------------------------------------------------------------------
// F. Mobile viewport — iPhone 13
// ---------------------------------------------------------------------------

test.describe('Cookie banner on iPhone 13 viewport', () => {
  test.use(IPHONE_13_VIEWPORT);

  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
  });

  test('banner does not horizontally overflow and Accept + Decline are reachable', async ({
    page,
  }) => {
    await page.goto('/');
    const banner = page.getByRole('region', { name: /cookie consent/i });
    await expect(banner).toBeVisible();

    // No horizontal overflow at the document level.
    const hasHorizontalOverflow = await page.evaluate(() => {
      const docEl = document.documentElement;
      return docEl.scrollWidth > docEl.clientWidth + 1;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Banner sits within the viewport horizontally.
    const bannerBox = await banner.boundingBox();
    const viewportSize = page.viewportSize();
    expect(bannerBox).not.toBeNull();
    expect(viewportSize).not.toBeNull();
    expect(bannerBox!.x).toBeGreaterThanOrEqual(0);
    expect(bannerBox!.x + bannerBox!.width).toBeLessThanOrEqual(viewportSize!.width + 1);

    // Both buttons reachable inside the banner without scrolling within the banner
    // — bounding boxes fit inside the banner's bounding box.
    const accept = banner.getByRole('button', { name: /^accept$/i });
    const decline = banner.getByRole('button', { name: /^no thanks$/i });
    const acceptBox = await accept.boundingBox();
    const declineBox = await decline.boundingBox();
    expect(acceptBox).not.toBeNull();
    expect(declineBox).not.toBeNull();
    expect(acceptBox!.y).toBeGreaterThanOrEqual(bannerBox!.y);
    expect(acceptBox!.y + acceptBox!.height).toBeLessThanOrEqual(
      bannerBox!.y + bannerBox!.height + 1,
    );
    expect(declineBox!.y).toBeGreaterThanOrEqual(bannerBox!.y);
    expect(declineBox!.y + declineBox!.height).toBeLessThanOrEqual(
      bannerBox!.y + bannerBox!.height + 1,
    );

    // Both still functional.
    await accept.click();
    await expect(page.getByRole('region', { name: /cookie consent/i })).toHaveCount(0);
  });
});
