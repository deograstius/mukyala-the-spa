/**
 * E2E coverage for chunk `spa-launch-readiness-seo-2026-05-09`.
 *
 * Exercises the user-visible behaviour of the launch-readiness ship:
 *   A. Founders' Rate ribbon — render, persistence (localStorage), reset.
 *   B. <head> meta tags rendered in shipped HTML (title, description,
 *      OG, Twitter, canonical).
 *   C. JSON-LD BeautySalon block — parsed and field-checked.
 *   D. /robots.txt + /sitemap.xml — served as static public assets.
 *   E. Smoke — home + services + booking-CTA navigation, no console errors,
 *      services menu carries the new 8-service opening menu and "nano-needling"
 *      replaces "microneedling".
 *   F. Mobile viewport spot-check (iPhone 13).
 *
 * Selector style mirrors the rest of the e2e suite:
 *   1) `data-cta-id` for the ribbon + the hero CTAs.
 *   2) `getByRole`/`getByText` for visible copy.
 *   3) `request.get(...)` for static asset fetches (matches
 *      compliance-static-html.spec.ts).
 *
 * Network: shared `mockApiRoutes` stubs `/v1/services`, `/v1/products`,
 * `/v1/locations`, and availability so the SPA never touches a real backend.
 * The /v1/services mock is OVERRIDDEN per-test below so the Services page
 * renders the full 8-service opening menu.
 *
 * No real production traffic: all tests run against the local preview server
 * configured in playwright.config.ts. No screenshot snapshots in this pass.
 */

import { test, expect, type Page } from '@playwright/test';
import { mockApiRoutes } from './api-mocks';

// iPhone 13 viewport without forcing a different browser. The full
// `devices['iPhone 13']` preset includes `defaultBrowserType: 'webkit'`,
// which Playwright forbids inside a describe-scoped `test.use()` (would
// require a new worker). We also avoid `isMobile`/`hasTouch`/
// `deviceScaleFactor` because Firefox does not support `isMobile` and a
// physical-pixel viewport at 390x844 is sufficient for layout-overflow
// assertions across all three projects (chromium / firefox / webkit).
const IPHONE_13_VIEWPORT = {
  viewport: { width: 390, height: 844 },
};

const FOUNDERS_RIBBON_STORAGE_KEY = 'mukyala.foundersRibbonDismissed.v1';
const FOUNDERS_RIBBON_COPY = "Founders' Rate — Signature Facial $129 · First 50 guests";

// Source-of-truth opening menu (mirrors src/data/services.ts). Used to
// override the /v1/services mock so the Services page renders all 8 cards.
const OPENING_MENU = [
  {
    slug: 'signature-facial',
    title: 'Signature Facial',
    durationMinutes: 60,
    priceCents: 18500,
  },
  {
    slug: 'deluxe-ritual-facial',
    title: 'Deluxe Ritual Facial',
    durationMinutes: 90,
    priceCents: 24500,
  },
  {
    slug: 'dermaplane-facial',
    title: 'Dermaplane Facial',
    durationMinutes: 60,
    priceCents: 19500,
  },
  {
    slug: 'chemical-peel',
    title: 'Chemical Peel',
    durationMinutes: 45,
    priceCents: 17500,
  },
  {
    slug: 'nano-needling',
    title: 'Nano-needling',
    durationMinutes: 60,
    priceCents: 25000,
  },
  {
    slug: 'body-scrub-ritual',
    title: 'Body Scrub Ritual',
    durationMinutes: 60,
    priceCents: 24500,
  },
  {
    slug: 'back-facial',
    title: 'Back Facial',
    durationMinutes: 45,
    priceCents: 11500,
  },
  {
    slug: 'led-add-on',
    title: 'LED Therapy Add-on',
    durationMinutes: 20,
    priceCents: 3500,
  },
];

// Build the full /v1/services payload; image fields are required by mapService
// but don't matter for these assertions, so we point at the existing hero.jpg.
const OPENING_MENU_API = OPENING_MENU.map((s) => ({
  ...s,
  description: `${s.title} description.`,
  image: '/images/home-hero.jpg',
  imageSrcSet:
    '/images/home-hero-p-500.jpg 500w, /images/home-hero-p-800.jpg 800w, /images/home-hero.jpg 1024w',
  imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
  active: true,
}));

async function mockOpeningMenu(page: Page) {
  await page.route('**/v1/services', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(OPENING_MENU_API),
    }),
  );
}

// ---------------------------------------------------------------------------
// A. Founders' Rate ribbon flow
// ---------------------------------------------------------------------------

test.describe("Founders' Rate ribbon — render + persistence", () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
  });

  test('ribbon renders above header on a fresh visit', async ({ page }) => {
    await page.goto('/');

    const ribbon = page.locator('[data-cta-id="founders-ribbon-impression"]');
    await expect(ribbon).toBeVisible();
    await expect(ribbon).toContainText(FOUNDERS_RIBBON_COPY);

    // Ribbon sits ABOVE the header (smaller y-coordinate).
    const ribbonBox = await ribbon.boundingBox();
    const header = page.locator('header').first();
    const headerBox = await header.boundingBox();
    expect(ribbonBox).not.toBeNull();
    expect(headerBox).not.toBeNull();
    expect(ribbonBox!.y).toBeLessThan(headerBox!.y);

    // CTA link has a non-empty href.
    const cta = page.locator('[data-cta-id="founders-ribbon-cta"]');
    await expect(cta).toBeVisible();
    const href = await cta.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href!.length).toBeGreaterThan(0);
  });

  test('dismiss hides ribbon and persists across reload via localStorage', async ({ page }) => {
    await page.goto('/');

    const ribbon = page.locator('[data-cta-id="founders-ribbon-impression"]');
    await expect(ribbon).toBeVisible();

    await page.locator('[data-cta-id="founders-ribbon-dismiss"]').click();
    await expect(ribbon).toHaveCount(0);

    // localStorage flag was set.
    const stored = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      FOUNDERS_RIBBON_STORAGE_KEY,
    );
    expect(stored).toBe('1');

    // Reload — ribbon stays hidden.
    await page.reload();
    await expect(page.locator('[data-cta-id="founders-ribbon-impression"]')).toHaveCount(0);
  });

  test('clearing localStorage and reloading brings the ribbon back', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-cta-id="founders-ribbon-dismiss"]').click();
    await expect(page.locator('[data-cta-id="founders-ribbon-impression"]')).toHaveCount(0);

    await page.evaluate((key) => window.localStorage.removeItem(key), FOUNDERS_RIBBON_STORAGE_KEY);
    await page.reload();
    await expect(page.locator('[data-cta-id="founders-ribbon-impression"]')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// B. <head> meta tags rendered in shipped HTML
// ---------------------------------------------------------------------------

test.describe('Head meta tags', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
  });

  test('title, description, OG, Twitter, canonical are present and correct', async ({ page }) => {
    await page.goto('/');

    // <title> contains "Mukyala"
    const title = await page.title();
    expect(title).toContain('Mukyala');

    // meta description: mentions Carlsbad, no "AI" framing.
    const description = await page
      .locator('head > meta[name="description"]')
      .getAttribute('content');
    expect(description).toBeTruthy();
    expect(description!).toContain('Carlsbad');
    expect(description!).not.toMatch(/\bAI\b/);

    // og:image is the production absolute URL.
    const ogImage = await page.locator('head > meta[property="og:image"]').getAttribute('content');
    expect(ogImage).toBe('https://www.mukyala.com/og-image.jpg');

    // og:title + og:description present and non-empty.
    const ogTitle = await page.locator('head > meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toBeTruthy();
    expect(ogTitle!.length).toBeGreaterThan(0);

    const ogDescription = await page
      .locator('head > meta[property="og:description"]')
      .getAttribute('content');
    expect(ogDescription).toBeTruthy();
    expect(ogDescription!.length).toBeGreaterThan(0);

    // twitter:card = summary_large_image
    const twitterCard = await page
      .locator('head > meta[name="twitter:card"]')
      .getAttribute('content');
    expect(twitterCard).toBe('summary_large_image');

    // canonical href is the production www host.
    const canonical = await page.locator('head > link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBe('https://www.mukyala.com');
  });
});

// ---------------------------------------------------------------------------
// C. JSON-LD BeautySalon block
// ---------------------------------------------------------------------------

test.describe('JSON-LD structured data', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
  });

  test('BeautySalon block has correct NAP, telephone, and 8-offer catalog', async ({ page }) => {
    await page.goto('/');

    const ldJson = await page
      .locator('head > script[type="application/ld+json"]')
      .first()
      .textContent();
    expect(ldJson).toBeTruthy();

    type Offer = { '@type': string; itemOffered?: { name?: string } };
    type LdJson = {
      '@type'?: string;
      address?: { streetAddress?: string; addressLocality?: string };
      telephone?: string;
      hasOfferCatalog?: { itemListElement?: Offer[] };
    };
    const data = JSON.parse(ldJson!) as LdJson;

    expect(data['@type']).toBe('BeautySalon');
    expect(data.address?.streetAddress).toBe('390 Oak Ave');
    expect(data.address?.addressLocality).toBe('Carlsbad');

    // Telephone — accept either E.164 form or US display form. Normalise to
    // digits and check the 10-digit suffix matches 7602766583.
    const telephone = data.telephone ?? '';
    const digits = telephone.replace(/\D/g, '');
    const lastTen = digits.slice(-10);
    expect(lastTen).toBe('7602766583');

    expect(data.hasOfferCatalog?.itemListElement?.length).toBe(8);
  });
});

// ---------------------------------------------------------------------------
// D. Public assets — robots.txt + sitemap.xml
// ---------------------------------------------------------------------------

test.describe('Public assets — robots.txt + sitemap.xml', () => {
  test('GET /robots.txt returns 200 with User-agent + Sitemap directive', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    expect(body).toContain('User-agent: *');
    expect(body).toMatch(/^Sitemap:\s*https:\/\/www\.mukyala\.com\/sitemap\.xml/m);
  });

  test('GET /sitemap.xml returns 200 with valid XML and home URL', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    expect(body).toContain('<urlset');
    expect(body).toContain('</urlset>');
    expect(body).toContain('https://www.mukyala.com/');
  });
});

// ---------------------------------------------------------------------------
// E. Smoke — critical pages load with no console errors
// ---------------------------------------------------------------------------

test.describe('Smoke — critical pages', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
    await mockOpeningMenu(page);
  });

  test('home loads with hero visible and no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    // Hero CTA marks the hero as rendered (FALLBACK_HERO path on localhost).
    await expect(page.locator('[data-cta-id="home-hero-cta"]')).toBeVisible();

    expect(errors, `console errors on /:\n${errors.join('\n')}`).toEqual([]);
  });

  test('services page lists all 8 services and uses "nano-needling" not "microneedling"', async ({
    page,
  }) => {
    await page.goto('/services');

    // Service grid heading is rendered server-side via prerender.
    await expect(page.getByRole('heading', { level: 1, name: /^services$/i })).toBeVisible();

    // All 8 service titles render.
    for (const svc of OPENING_MENU) {
      await expect(page.getByText(svc.title, { exact: true }).first()).toBeVisible();
    }

    // Nano-needling is present (case-insensitive); microneedling is not.
    await expect(page.getByText(/nano-needling/i).first()).toBeVisible();
    const microMatches = await page.getByText(/microneedling/i).count();
    expect(microMatches).toBe(0);
  });

  test('services list shows USD prices on every card (regression: rightElement was hiding price)', async ({
    page,
  }) => {
    await page.goto('/services');

    // Anchor prices: entry-price hook (Back Facial $115) and a mid-tier
    // ($185 Signature Facial). Two anchors are enough to prove the
    // priceCents -> Price slot is wired; we don't list all eight to keep
    // the assertion robust against future menu edits.
    await expect(page.getByText('$115').first()).toBeVisible();
    await expect(page.getByText('$185').first()).toBeVisible();
  });

  test('a booking-flow CTA navigates from home', async ({ page }) => {
    await page.goto('/');

    const reservationCta = page.locator('[data-cta-id="home-hero-cta"]');
    await expect(reservationCta).toBeVisible();
    await expect(reservationCta).toHaveAttribute('href', '/reservation');

    await reservationCta.click();
    await page.waitForURL(/\/reservation$/);
    await expect(
      page.getByRole('heading', { level: 1, name: /book an appointment/i }),
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// F. Mobile viewport spot-check (iPhone 13)
// ---------------------------------------------------------------------------

test.describe('Mobile viewport spot-check', () => {
  test.use(IPHONE_13_VIEWPORT);

  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
  });

  test('hero + ribbon do not horizontal-overflow at iPhone 13 width', async ({ page }) => {
    await page.goto('/');

    const ribbon = page.locator('[data-cta-id="founders-ribbon-impression"]');
    await expect(ribbon).toBeVisible();

    // Hero CTA is rendered.
    const heroCta = page.locator('[data-cta-id="home-hero-cta"]');
    await expect(heroCta).toBeVisible();

    // No horizontal overflow at the document level.
    const hasHorizontalOverflow = await page.evaluate(() => {
      const docEl = document.documentElement;
      return docEl.scrollWidth > docEl.clientWidth + 1; // 1px slack for sub-pixel rounding
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Hero image renders without a broken-image marker — naturalWidth > 0
    // means the browser successfully decoded the bytes (no broken icon).
    const heroImageBroken = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      // Filter to images that have actually been laid out (heroes, lazy or eager).
      const decoded = imgs.filter((img) => img.complete);
      // If nothing is decoded yet that's fine — we only flag broken ones.
      return decoded.some((img) => img.naturalWidth === 0);
    });
    expect(heroImageBroken).toBe(false);
  });
});
