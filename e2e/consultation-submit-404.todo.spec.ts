/**
 * E2E coverage for the consultation-submit 404 fix
 * (chunk: `consultation-submit-404-fix-2026-04-26`).
 *
 * Three real Playwright tests pinning the post-fix behavior:
 *   1) Happy-path submit — the SPA POSTs to a SAME-ORIGIN (relative) URL
 *      `/v1/consultations` (so the Vite dev proxy / the prod CloudFront
 *      origin can do its job). With a stubbed 200, the SuccessPanel
 *      renders and shows the returned `submission_id`.
 *   2) Upstream 404 — when the API returns 404, Step 6 surfaces a
 *      visible error UI (`.consultation-submit-error` with `role="alert"`).
 *      The user is NOT silently bounced; their signature stays intact.
 *   3) Network failure — when the request is aborted at the network
 *      layer, Step 6 surfaces the same visible error UI, never falling
 *      through to the SuccessPanel.
 *
 * Naming: `*.todo.spec.ts` retained for HANDOFF traceability across
 *         architect → tester → e2e stages, even though every entry below
 *         is now a real, asserting test (not `test.fixme`).
 *
 * Patterns mirror `consultation-ui-fixes.spec.ts`:
 *   - `data-testid` / `data-cta-id` selectors first.
 *   - `getByRole({ name })` / `getByLabel` for form fields.
 *   - `page.route()` to stub the API response — we do not depend on a
 *     local API server being up; the test is hermetic at the SPA layer.
 *   - The mock matches `**\/v1/consultations` so a same-origin
 *     `http://localhost:5173/v1/consultations` request is intercepted
 *     before it ever reaches the dev proxy or the network.
 */

import { test, expect, type Page, type Locator } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers (mirrored from consultation-ui-fixes.spec.ts to keep this spec
// self-contained — Playwright specs in this repo do not share a fixtures
// module yet, and the existing spec does the same inline-helpers thing).
// ---------------------------------------------------------------------------

function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  const mod10 = n % 10;
  if (mod10 === 1) return `${n}st`;
  if (mod10 === 2) return `${n}nd`;
  if (mod10 === 3) return `${n}rd`;
  return `${n}th`;
}

/** Mirrors the aria-label that react-day-picker emits for a day button. */
function dayPickerAriaLabel(d: Date): string {
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(d);
  const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(d);
  const year = new Intl.DateTimeFormat('en-US', { year: 'numeric' }).format(d);
  return `${weekday}, ${month} ${ordinal(d.getDate())}, ${year}`;
}

/** Locator for the inner DayPicker group (`role="group"`, `data-name=...`). */
function dayPickerInside(page: Page, name: string): Locator {
  return page.locator(`[data-name="${name}"]`);
}

/** Pick a date inside a `react-day-picker` calendar with dropdown caption. */
async function pickDate(field: Locator, target: Date): Promise<void> {
  const yearSelect = field.getByRole('combobox', { name: /year/i });
  if ((await yearSelect.count()) > 0) {
    await yearSelect.first().selectOption(String(target.getFullYear()));
  }
  const monthSelect = field.getByRole('combobox', { name: /month/i });
  if ((await monthSelect.count()) > 0) {
    await monthSelect.first().selectOption(String(target.getMonth()));
  }
  const dayBtn = field.getByRole('button', { name: dayPickerAriaLabel(target), exact: true });
  await dayBtn.click();
}

/** Click the wizard's primary "Next" button. */
async function clickNext(page: Page): Promise<void> {
  await page.locator('[data-cta-id="consultation-next"]').click();
}

/** Click a Yes/No option by name + value (label-for click; the radio input
 *  itself sits behind the visible chip). */
async function pickYesNo(page: Page, name: string, value: 'yes' | 'no'): Promise<void> {
  const baseId = name.replace(/[^a-zA-Z0-9_-]/g, '-');
  await page.locator(`label[for="${baseId}-${value}"]`).click();
}

/** Wait for a step root marker to be present. */
async function expectOnStep(page: Page, n: 1 | 2 | 3 | 4 | 5 | 6): Promise<void> {
  await expect(page.locator(`.consultation-step-${n}`)).toBeVisible();
}

/** Fill Steps 1–4 with a deterministic happy-path payload, opting OUT of
 *  females-only so Step 5 is skipped. Leaves the user on Step 6. */
async function walkToStep6(page: Page): Promise<void> {
  await page.goto('/consultation/step-1');
  await expectOnStep(page, 1);

  await page.getByLabel(/^Full name/).fill('Jane Doe');
  await page.getByLabel(/^Email/).fill('jane.submit404@example.com');
  await page.getByLabel(/^Phone/).fill('5551234567');
  await page.getByLabel(/^Home address/).fill('123 Test St, Springfield');
  await pickDate(dayPickerInside(page, 'personal.dob'), new Date(Date.UTC(1991, 2, 7)));
  await clickNext(page);

  await expectOnStep(page, 2);
  await clickNext(page);

  await expectOnStep(page, 3);
  await clickNext(page);

  await expectOnStep(page, 4);
  for (const name of [
    'health.under_physician_care',
    'health.being_treated',
    'health.using_steroids',
    'health.taking_medications',
    'health.allergies',
    'health.medication_allergies',
    'health.cosmetic_allergies',
  ]) {
    await pickYesNo(page, name, 'no');
  }
  await page.getByRole('button', { name: /mark all no/i }).click();
  await pickYesNo(page, 'females_only.applicable', 'no');
  await clickNext(page);

  await expectOnStep(page, 6);
}

/** Sign + attest on Step 6, then click Submit. */
async function signAndSubmit(page: Page): Promise<void> {
  await page.getByLabel('Type your full name').fill('Jane Doe');
  // signature.date is pre-populated by useEffect to today, so we only
  // need to confirm the picker is mounted before signing.
  await dayPickerInside(page, 'signature.date').waitFor({ state: 'attached' });
  await page.locator('label[for="signature.attested"]').click();
  await page.locator('[data-cta-id="consultation-submit"]').click();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Consultation submit — dev proxy 404 fix', () => {
  test('happy-path: POST goes to same-origin /v1/consultations and SuccessPanel renders', async ({
    page,
  }) => {
    // Capture the request that the SPA actually sends, so we can assert
    // the URL is RELATIVE / same-origin (the whole point of the 404 fix:
    // the SPA must not be hitting an absolute :4000 or hard-coded host).
    let capturedUrl: string | null = null;
    let capturedMethod: string | null = null;
    let capturedPostData: string | null = null;

    await page.route('**/v1/consultations', async (route) => {
      const req = route.request();
      if (req.method() !== 'POST') {
        await route.continue();
        return;
      }
      capturedUrl = req.url();
      capturedMethod = req.method();
      capturedPostData = req.postData();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          submission_id: 'sub_e2e_submit404_happy',
          received_at: '2026-04-26T12:00:00.000Z',
        }),
      });
    });

    await walkToStep6(page);
    await signAndSubmit(page);

    // SuccessPanel renders.
    await expect(page.getByTestId('consultation-submission-id')).toHaveText(
      'sub_e2e_submit404_happy',
      { timeout: 10_000 },
    );
    await expect(
      page.getByRole('heading', { level: 1, name: /we've received your consultation request/i }),
    ).toBeVisible();

    // The captured request must be SAME-ORIGIN with the dev preview server
    // (`http://localhost:5173`). This is the contract the dev proxy + the
    // prod single-origin deploy both rely on: the SPA never hard-codes
    // `:4000` or a different hostname.
    expect(capturedUrl).not.toBeNull();
    expect(capturedMethod).toBe('POST');
    const reqUrl = new URL(capturedUrl!);
    expect(reqUrl.origin).toBe('http://localhost:5173');
    expect(reqUrl.pathname).toBe('/v1/consultations');
    // Sanity: the body is a JSON envelope with the consultation form_id
    // (avoids future regressions where someone refactors apiPost away).
    expect(capturedPostData).toBeTruthy();
    expect(capturedPostData!).toContain('"form_id"');
    expect(capturedPostData!).toContain('"intake"');
  });

  test('upstream 404 surfaces a visible error UI on Step 6 (no silent failure)', async ({
    page,
  }) => {
    await page.route('**/v1/consultations', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      // Simulate the original bug's symptom: the request lands on a
      // route that doesn't know `/v1/consultations` and returns 404.
      // Body shape mimics what Vite's dev server / a misconfigured edge
      // returns: HTML or empty JSON. ApiError reads either gracefully.
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Not Found', code: 'not_found' }),
      });
    });

    await walkToStep6(page);
    await signAndSubmit(page);

    // The Step 6 inline error UI must surface (role=alert, visible to
    // screen readers and to sighted users — not console-only).
    const submitError = page.locator('.consultation-submit-error');
    await expect(submitError).toBeVisible({ timeout: 10_000 });
    await expect(submitError).toHaveAttribute('role', 'alert');
    // Error copy carries the upstream message, not a stack trace.
    const errorText = (await submitError.textContent())?.trim() ?? '';
    expect(errorText.length).toBeGreaterThan(0);
    // Must mention the failure semantics in plain English. `apiPost`
    // surfaces `ApiError.message` which inherits the JSON `message`
    // field — "Not Found" — so the user sees something meaningful.
    expect(errorText).toMatch(/not found|could not send|try again/i);

    // The user remains on Step 6 — no SuccessPanel sneak-through.
    await expect(page.locator('.consultation-step-6')).toBeVisible();
    await expect(page.getByTestId('consultation-submission-id')).toHaveCount(0);

    // Signature inputs remain populated so the user can retry without
    // re-typing.
    await expect(page.getByLabel('Type your full name')).toHaveValue('Jane Doe');
    await expect(page.locator('#signature\\.attested')).toBeChecked();
  });

  test('network failure surfaces a visible error UI on Step 6 (no silent failure)', async ({
    page,
  }) => {
    await page.route('**/v1/consultations', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      // Hard network failure (DNS / connection reset / offline).
      // Playwright's `route.abort('failed')` short-circuits the request
      // at the network layer — `fetch()` rejects with a TypeError, the
      // mutation hits its onError branch, and the SPA must show the UI.
      await route.abort('failed');
    });

    await walkToStep6(page);
    await signAndSubmit(page);

    // Visible error UI on Step 6.
    const submitError = page.locator('.consultation-submit-error');
    await expect(submitError).toBeVisible({ timeout: 10_000 });
    await expect(submitError).toHaveAttribute('role', 'alert');
    const errorText = (await submitError.textContent())?.trim() ?? '';
    expect(errorText.length).toBeGreaterThan(0);

    // Still on Step 6, no SuccessPanel.
    await expect(page.locator('.consultation-step-6')).toBeVisible();
    await expect(page.getByTestId('consultation-submission-id')).toHaveCount(0);

    // Signature inputs preserved for retry.
    await expect(page.getByLabel('Type your full name')).toHaveValue('Jane Doe');
    await expect(page.locator('#signature\\.attested')).toBeChecked();
  });
});
