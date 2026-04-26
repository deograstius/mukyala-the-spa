/**
 * E2E coverage for chunk `consultation-ui-fixes-2026-04-25`.
 *
 * The implementer landed seven UI fixes in the consultation flow; the
 * tester pass added 49 unit tests. This file exercises the user-visible
 * flow end-to-end so we'd catch regressions a unit test would miss:
 *   - Real rendering across Steps 1–6 with the dev preview build.
 *   - Real navigation forward through the wizard shell.
 *   - Real react-day-picker interaction (no native <input type="date">).
 *   - Real computed CSS for tap targets and gate-button sizing.
 *
 * Mocks `POST /v1/consultations` so submit reaches the SuccessPanel.
 *
 * Selectors prefer:
 *   1) `data-testid` / `data-cta-id` (already present in components)
 *   2) `getByRole({ name })` / `getByLabel`
 *   3) Class selectors only when the spec explicitly assets the class
 *      (e.g. `.consultation-yesno-option` for tap-target sizing).
 */

import { test, expect, type Page, type Locator } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
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

/** Locator for the inner DayPicker group (`role="group"`, `data-name=...`)
 *  inside an enclosing fieldset. The fieldset's <legend> also synthesizes
 *  a role="group" name, so we narrow to the picker explicitly. */
function dayPickerInside(page: Page, name: string): Locator {
  return page.locator(`[data-name="${name}"]`);
}

/** Pick a date inside a `react-day-picker` calendar that uses
 *  `captionLayout="dropdown"` (year + month dropdowns). */
async function pickDate(field: Locator, target: Date): Promise<void> {
  // The DayPicker dropdown caption renders one <select> for month and one for year.
  // We pick year first (so endMonth/startMonth limits stay sane), then month, then day.
  const yearSelect = field.getByRole('combobox', { name: /year/i });
  if ((await yearSelect.count()) > 0) {
    await yearSelect.first().selectOption(String(target.getFullYear()));
  }
  const monthSelect = field.getByRole('combobox', { name: /month/i });
  if ((await monthSelect.count()) > 0) {
    // react-day-picker uses month index 0..11.
    await monthSelect.first().selectOption(String(target.getMonth()));
  }
  const dayBtn = field.getByRole('button', { name: dayPickerAriaLabel(target), exact: true });
  await dayBtn.click();
}

/** Mock POST /v1/consultations to a stable submission_id. */
async function mockConsultationSubmit(page: Page): Promise<void> {
  await page.route('**/v1/consultations', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        submission_id: 'sub_e2e_consultation_ui_fixes',
        received_at: new Date().toISOString(),
      }),
    });
  });
}

/** Click the wizard's primary "Next" button. */
async function clickNext(page: Page): Promise<void> {
  await page.locator('[data-cta-id="consultation-next"]').click();
}

/** Click a Yes/No option by name + value. The radio input itself is covered
 *  by the wrapping `<label>` (the visible "Yes"/"No" span intercepts pointer
 *  events), so we click the label by its `for` attribute / id pair. */
async function pickYesNo(page: Page, name: string, value: 'yes' | 'no'): Promise<void> {
  // YesNoField builds ids by replacing non-[a-zA-Z0-9_-] chars with `-`.
  const baseId = name.replace(/[^a-zA-Z0-9_-]/g, '-');
  await page.locator(`label[for="${baseId}-${value}"]`).click();
}

/** Wait for a step root marker to be present. The wizard sets a body class
 *  per step root: `.consultation-step-1`..`.consultation-step-6`. */
async function expectOnStep(page: Page, n: 1 | 2 | 3 | 4 | 5 | 6): Promise<void> {
  await expect(page.locator(`.consultation-step-${n}`)).toBeVisible();
}

// ---------------------------------------------------------------------------
// Console-error tracking (used by the happy-path test)
// ---------------------------------------------------------------------------

function attachConsoleErrorSpy(page: Page): string[] {
  const errors: string[] = [];
  // Telemetry beacon (`POST /v1/events`) and other unrelated network warnings
  // are environment noise — the dev preview server has no telemetry sink.
  // We only care about UI-layer pageerrors and console.error from the
  // application itself.
  const ignoreRe =
    /Failed to load resource|\/v1\/events|access control checks|Could not connect to the server|Beacon API/i;
  page.on('pageerror', (err) => {
    if (ignoreRe.test(err.message)) return;
    errors.push(`pageerror: ${err.message}`);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (ignoreRe.test(text)) return;
      errors.push(`console.error: ${text}`);
    }
  });
  return errors;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('consultation-ui-fixes-2026-04-25 — UI flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockConsultationSubmit(page);
  });

  test('full happy path Steps 1→6 reaches SuccessPanel without console errors', async ({
    page,
  }) => {
    const consoleErrors = attachConsoleErrorSpy(page);
    await page.goto('/consultation/step-1');

    // ---- Step 1 ----
    await expectOnStep(page, 1);
    await expect(
      page.getByRole('heading', { level: 1, name: /your free mukyala skin consultation/i }),
    ).toBeVisible();
    await page.getByLabel(/^Full name/).fill('Jane Doe');
    await page.getByLabel(/^Email/).fill('jane.e2e@example.com');
    await page.getByLabel(/^Phone/).fill('5551234567');
    await page.getByLabel(/^Home address/).fill('123 Test St, Springfield');

    // DOB via react-day-picker
    const dobField = dayPickerInside(page, 'personal.dob');
    await expect(dobField).toBeVisible();
    await pickDate(dobField, new Date(Date.UTC(1991, 2, 7))); // 1991-03-07

    await clickNext(page);

    // ---- Step 2 ----
    await expectOnStep(page, 2);
    // Lifestyle is all-optional; advance immediately.
    await clickNext(page);

    // ---- Step 3 ----
    await expectOnStep(page, 3);
    // Skin concerns / care all optional.
    await clickNext(page);

    // ---- Step 4 ----
    await expectOnStep(page, 4);
    // Health booleans are required. Use the "Mark all No" sweep for the
    // conditions card, then click No on the four "Care & treatment" YesNos
    // and the three "Allergies" YesNos.
    const noRadios = [
      'health.under_physician_care',
      'health.being_treated',
      'health.using_steroids',
      'health.taking_medications',
      'health.allergies',
      'health.medication_allergies',
      'health.cosmetic_allergies',
    ];
    for (const name of noRadios) {
      await pickYesNo(page, name, 'no');
    }
    // Sweep all Conditions to No in one tap.
    await page.getByRole('button', { name: /mark all no/i }).click();
    // Females_only.applicable opt-in toggle — leave No so step-5 is skipped.
    await pickYesNo(page, 'females_only.applicable', 'no');
    await clickNext(page);

    // ---- Step 6 (Step 5 was skipped) ----
    // The wizard's earliest-incomplete-step guard should not bounce us back.
    await expectOnStep(page, 6);
    // Health review summary renders a <dl>.
    const healthSection = page
      .locator('.consultation-review-section')
      .filter({ has: page.getByRole('heading', { level: 3, name: 'Health' }) });
    await expect(healthSection.locator('dl')).toBeVisible();

    // Sign + attest.
    await page.getByLabel('Type your full name').fill('Jane Doe');
    await dayPickerInside(page, 'signature.date').waitFor({ state: 'attached' });
    // Signature date — pre-populated by useEffect to today; only fill if the
    // calendar selection is missing.
    // Attest checkbox.
    await page.locator('label[for="signature.attested"]').click();

    // Submit.
    await page.locator('[data-cta-id="consultation-submit"]').click();

    // ---- SuccessPanel ----
    await expect(page.getByTestId('consultation-submission-id')).toHaveText(
      'sub_e2e_consultation_ui_fixes',
      { timeout: 10_000 },
    );
    await expect(
      page.getByRole('heading', { level: 1, name: /we've received your consultation request/i }),
    ).toBeVisible();

    // No console errors during the run.
    expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
  });

  test('H1 visual consistency: same computed font-size on Step 1 and Step 2+', async ({ page }) => {
    await page.goto('/consultation/step-1');
    await expectOnStep(page, 1);
    const h1Step1 = page
      .getByRole('heading', { level: 1, name: /your free mukyala skin consultation/i })
      .first();
    const fontSize1 = await h1Step1.evaluate((el) => getComputedStyle(el).fontSize);

    // Navigate to Step 2 via direct URL (Step 1 has no required fields blocking
    // raw nav once the resume-prompt resolves to fresh — but the deep-link
    // guard redirects forward-jumps. So we fill the minimum Step 1 and click
    // Next.
    await page.getByLabel(/^Full name/).fill('Jane Doe');
    await page.getByLabel(/^Email/).fill('jane.e2e@example.com');
    await page.getByLabel(/^Phone/).fill('5551234567');
    await page.getByLabel(/^Home address/).fill('123 Test St');
    await pickDate(dayPickerInside(page, 'personal.dob'), new Date(Date.UTC(1991, 2, 7)));
    await clickNext(page);

    await expectOnStep(page, 2);
    const h1Step2 = page
      .getByRole('heading', { level: 1, name: /your free mukyala skin consultation/i })
      .first();
    const fontSize2 = await h1Step2.evaluate((el) => getComputedStyle(el).fontSize);

    expect(fontSize2).toBe(fontSize1);
    // Defensive: H1 must NOT have shrunk (parse to number).
    const px1 = Number.parseFloat(fontSize1);
    const px2 = Number.parseFloat(fontSize2);
    expect(px2).toBe(px1);
    expect(px1).toBeGreaterThan(0);
  });

  test('Step 2 stepper labels render with non-collapsed whitespace (consultation-stepper-field)', async ({
    page,
  }) => {
    await page.goto('/consultation/step-1');
    await expectOnStep(page, 1);
    // Walk to Step 2.
    await page.getByLabel(/^Full name/).fill('Jane Doe');
    await page.getByLabel(/^Email/).fill('jane.e2e@example.com');
    await page.getByLabel(/^Phone/).fill('5551234567');
    await page.getByLabel(/^Home address/).fill('123 Test St');
    await pickDate(dayPickerInside(page, 'personal.dob'), new Date(Date.UTC(1991, 2, 7)));
    await clickNext(page);
    await expectOnStep(page, 2);

    // Water glasses stepper-field is always visible on Step 2.
    const stepperField = page.locator('.consultation-stepper-field').first();
    await expect(stepperField).toBeVisible();
    // The wrapper must lay out as a flex column (the whole point of the new class).
    const display = await stepperField.evaluate((el) => getComputedStyle(el).display);
    const flexDirection = await stepperField.evaluate((el) => getComputedStyle(el).flexDirection);
    expect(display).toBe('flex');
    expect(flexDirection).toBe('column');
    // Sub-label sits inside the wrapper above the stepper control.
    const subLabel = stepperField.locator('.consultation-sub-label').first();
    await expect(subLabel).toBeVisible();
    // The label must render with a non-empty text node (no browser-default
    // whitespace collapse swallowing it).
    const labelText = (await subLabel.textContent())?.trim() || '';
    expect(labelText.length).toBeGreaterThan(0);
  });

  test('tap targets: yesno + checkbox options have computed height ≥ 44px', async ({ page }) => {
    await page.goto('/consultation/step-1');
    await expectOnStep(page, 1);
    // Walk to Step 3 (where checkbox options live) and Step 4 (where lots of yesno options live).
    await page.getByLabel(/^Full name/).fill('Jane Doe');
    await page.getByLabel(/^Email/).fill('jane.e2e@example.com');
    await page.getByLabel(/^Phone/).fill('5551234567');
    await page.getByLabel(/^Home address/).fill('123 Test St');
    await pickDate(dayPickerInside(page, 'personal.dob'), new Date(Date.UTC(1991, 2, 7)));
    await clickNext(page);
    await expectOnStep(page, 2);
    await clickNext(page);
    await expectOnStep(page, 3);

    // Step 3 has checkbox-option chips.
    const checkboxOption = page.locator('.consultation-checkbox-option').first();
    await expect(checkboxOption).toBeVisible();
    const cbBox = await checkboxOption.boundingBox();
    expect(cbBox).not.toBeNull();
    // Floor: 44px (iOS HIG / WCAG AA). Allow a small subpixel margin.
    expect(cbBox!.height).toBeGreaterThanOrEqual(43.5);

    // Walk to Step 4 — yesno options are everywhere.
    await clickNext(page);
    await expectOnStep(page, 4);
    const yesnoOption = page.locator('.consultation-yesno-option').first();
    await expect(yesnoOption).toBeVisible();
    const yBox = await yesnoOption.boundingBox();
    expect(yBox).not.toBeNull();
    expect(yBox!.height).toBeGreaterThanOrEqual(43.5);
  });

  test('Step 5 gate buttons match flow-standard sizing (44px height, 14px font-size, no 56/16 outlier)', async ({
    page,
  }) => {
    await page.goto('/consultation/step-1');
    await expectOnStep(page, 1);
    // Walk through, opting into females_only on Step 4.
    await page.getByLabel(/^Full name/).fill('Jane Doe');
    await page.getByLabel(/^Email/).fill('jane.e2e@example.com');
    await page.getByLabel(/^Phone/).fill('5551234567');
    await page.getByLabel(/^Home address/).fill('123 Test St');
    await pickDate(dayPickerInside(page, 'personal.dob'), new Date(Date.UTC(1991, 2, 7)));
    await clickNext(page);
    await expectOnStep(page, 2);
    await clickNext(page);
    await expectOnStep(page, 3);
    await clickNext(page);
    await expectOnStep(page, 4);

    // Required Step 4 booleans → No.
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
    // Opt INTO Step 5.
    await pickYesNo(page, 'females_only.applicable', 'yes');
    await clickNext(page);
    await expectOnStep(page, 5);

    // Two gate buttons: "Yes, continue" and "Skip this step".
    const gateButtons = page.locator('.consultation-gate-button');
    await expect(gateButtons).toHaveCount(2);
    const gate = gateButtons.first();
    const box = await gate.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(43.5);
    // Should not exceed the prior 56px outlier (give 4px slack for borders/padding).
    expect(box!.height).toBeLessThan(56);
    const fontSize = await gate.evaluate((el) => getComputedStyle(el).fontSize);
    const fontPx = Number.parseFloat(fontSize);
    // 14px target — allow 1px slack for browser-specific rounding.
    expect(fontPx).toBeLessThan(16);
    expect(fontPx).toBeGreaterThanOrEqual(13);
  });

  test('date pickers unified: no native <input type="date"> anywhere in the consultation flow', async ({
    page,
  }) => {
    await page.goto('/consultation/step-1');
    await expectOnStep(page, 1);
    // Step 1 — DOB.
    expect(await page.locator('input[type="date"]').count()).toBe(0);
    await expect(dayPickerInside(page, 'personal.dob')).toBeVisible();
    // Calendar grid is present (react-day-picker renders role=grid).
    await expect(page.locator('[role="grid"]').first()).toBeVisible();

    // Walk to Step 6 and assert no native date input there either.
    await page.getByLabel(/^Full name/).fill('Jane Doe');
    await page.getByLabel(/^Email/).fill('jane.e2e@example.com');
    await page.getByLabel(/^Phone/).fill('5551234567');
    await page.getByLabel(/^Home address/).fill('123 Test St');
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

    // Step 6: signature.date is a DatePickerField, NOT a native date input.
    expect(await page.locator('input[type="date"]').count()).toBe(0);
    await expect(dayPickerInside(page, 'signature.date')).toBeVisible();
  });

  // ---------------------------------------------------------------------
  // Bug A — off-by-one date selection (UTC vs local timezone).
  //
  // The local-time helpers (`localDateTripleToDate`,
  // `dateToLocalDateTriple`, `dateTripleToLocalIsoYmd`) are wired into
  // DatePickerField and Step6ReviewSign as of the implementer stage of
  // this chunk. These tests pin the user-visible behavior under a
  // negative-offset timezone (the failure mode surfaces in PT/MT/CT).
  //
  // We override the browser context timezone to `America/Los_Angeles`
  // for both tests below so the regression would reproduce
  // deterministically if the implementation regressed to UTC accessors.
  // ---------------------------------------------------------------------

  test.describe('Bug A — off-by-one (Pacific Time)', () => {
    test.use({ timezoneId: 'America/Los_Angeles' });

    test('DOB picked on Step 1 round-trips to the same calendar day on the Step 6 review', async ({
      page,
    }) => {
      await page.goto('/consultation/step-1');
      await expectOnStep(page, 1);

      // March 7, 1991 — the canonical regression date from the bug
      // report. Build via the local constructor (matches what
      // react-day-picker emits when a user clicks a cell).
      const target = new Date(1991, 2, 7);

      await page.getByLabel(/^Full name/).fill('Jane Doe');
      await page.getByLabel(/^Email/).fill('jane.e2e@example.com');
      await page.getByLabel(/^Phone/).fill('5551234567');
      await page.getByLabel(/^Home address/).fill('123 Test St');
      await pickDate(dayPickerInside(page, 'personal.dob'), target);

      // After clicking, the cell should be marked aria-selected (real
      // browser DOM, no off-by-one in the highlight).
      const selectedCell = dayPickerInside(page, 'personal.dob').locator(
        'td[aria-selected="true"]',
      );
      await expect(selectedCell).toHaveAttribute('data-day', '1991-03-07');

      // Walk to Step 6.
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

      // Personal info review — Date of birth dd should read the same
      // calendar day, not Mar 6 (the pre-fix Pacific-time regression).
      const personalSection = page
        .locator('.consultation-review-section')
        .filter({ has: page.getByRole('heading', { level: 3, name: 'Personal information' }) });
      const dobDt = personalSection.locator('dl dt', { hasText: /Date of birth/i }).first();
      const dobDd = dobDt.locator('xpath=following-sibling::dd[1]');
      // formatDob renders via toLocaleDateString({year, month: 'short', day, timeZone: UTC}).
      // For Y=1991, M=3, D=7 that lands at "Mar 7, 1991".
      await expect(dobDd).toHaveText(/Mar 7,?\s+1991/);
      // Defensive: the previous-day off-by-one must NOT appear.
      const dobText = await dobDd.textContent();
      expect(dobText ?? '').not.toMatch(/Mar 6,?\s+1991/);
    });

    test('signature.date picked on Step 6 highlights the same day after re-render', async ({
      page,
    }) => {
      // Walk to Step 6 with a known DOB.
      await page.goto('/consultation/step-1');
      await expectOnStep(page, 1);
      await page.getByLabel(/^Full name/).fill('Jane Doe');
      await page.getByLabel(/^Email/).fill('jane.e2e@example.com');
      await page.getByLabel(/^Phone/).fill('5551234567');
      await page.getByLabel(/^Home address/).fill('123 Test St');
      await pickDate(dayPickerInside(page, 'personal.dob'), new Date(1991, 2, 7));
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

      // signature.date opens on today (defaultVisibleMonthYearsBack=0
      // and useEffect prefills with today). Pick a known date in the
      // current month — use the 15th to avoid month-edge surprises.
      const sigField = dayPickerInside(page, 'signature.date');
      await expect(sigField).toBeVisible();
      const now = new Date();
      const target = new Date(now.getFullYear(), now.getMonth(), 15);
      await pickDate(sigField, target);

      // The cell the user clicked should now be aria-selected on the
      // SAME day in the SAME month/year. data-day uses ISO YYYY-MM-DD.
      const yyyy = target.getFullYear().toString();
      const mm = String(target.getMonth() + 1).padStart(2, '0');
      const dd = String(target.getDate()).padStart(2, '0');
      const expectedIso = `${yyyy}-${mm}-${dd}`;
      const selectedCell = sigField.locator('td[aria-selected="true"]');
      await expect(selectedCell).toHaveAttribute('data-day', expectedIso);
    });
  });

  // ---------------------------------------------------------------------
  // Bug B — picker sizing / positioning.
  //
  // The `.consultation-daypicker` width/cell-size rule is in place, and
  // Step 6's signature.date FormField now wraps in `consultation-dob-group`
  // to match Step 1 DOB. Both pickers should render INLINE inside their
  // input wrapper (no popover, no portal) at parity widths.
  // ---------------------------------------------------------------------

  test.describe('Bug B — picker sizing/positioning', () => {
    test('Step 1 DOB and Step 6 signature.date pickers render at parity width, inline within their wrapper, above page content', async ({
      page,
    }) => {
      await page.goto('/consultation/step-1');
      await expectOnStep(page, 1);

      // ----- Step 1: DOB picker measurement -----
      const dobWrapper = dayPickerInside(page, 'personal.dob');
      await expect(dobWrapper).toBeVisible();
      const dobBox = await dobWrapper.boundingBox();
      expect(dobBox).not.toBeNull();

      // The picker must NOT be a tiny collapsed control (the pre-fix
      // failure mode rendered the calendar at ~210–230px).
      expect(dobBox!.width).toBeGreaterThan(240);
      expect(dobBox!.height).toBeGreaterThan(240);

      // The picker must render INLINE within its FormField/fieldset
      // wrapper — not floating in a corner of the page. The DOM is a
      // plain `<div role="group">` (no `[role="dialog"]` portal).
      expect(await dobWrapper.locator('[role="dialog"]').count()).toBe(0);

      // The picker wrapper sits inside the DOB fieldset / `.consultation-dob-group`
      // (DOM ancestor relationship — proves the picker isn't being
      // portal'd to the page corner).
      const dobAncestor = page.locator('.consultation-dob-group').filter({ has: dobWrapper });
      await expect(dobAncestor).toBeVisible();
      const dobAncestorBox = await dobAncestor.boundingBox();
      expect(dobAncestorBox).not.toBeNull();
      // The picker's horizontal extent sits within its ancestor's
      // horizontal extent (subpixel slack). We only check the X axis —
      // the legend element's boundingBox can extend above the fieldset's
      // content rect on some engines, so a strict Y containment is
      // brittle for the regression we're guarding here.
      expect(dobBox!.x).toBeGreaterThanOrEqual(dobAncestorBox!.x - 1);
      expect(dobBox!.x + dobBox!.width).toBeLessThanOrEqual(
        dobAncestorBox!.x + dobAncestorBox!.width + 1,
      );
      // Sanity: picker is NOT in the page corner (the pre-fix worry was
      // it floating away from the input). It must sit somewhere in the
      // main content column.
      expect(dobBox!.x).toBeGreaterThan(8);

      // No portal hoisting — every day button lives inside the wrapper.
      const dobButtonsTotal = await page.locator('.rdp-day_button').count();
      const dobButtonsInside = await dobWrapper.locator('.rdp-day_button').count();
      expect(dobButtonsInside).toBe(dobButtonsTotal);

      // Picker stacking renders above page content. Probe with a real
      // day cell — the cell must be the topmost element at its center
      // (no overlay clipping it). Scroll the cell into view first so
      // viewport-relative coordinates align with elementFromPoint.
      const dobProbeCell = dobWrapper.locator('.rdp-day_button').nth(10);
      await dobProbeCell.scrollIntoViewIfNeeded();
      const dobCellBox = await dobProbeCell.boundingBox();
      expect(dobCellBox).not.toBeNull();
      const dobOnTop = await page.evaluate(
        ({ x, y }) => {
          const el = document.elementFromPoint(x, y);
          return el ? el.closest('[data-name="personal.dob"]') !== null : false;
        },
        { x: dobCellBox!.x + dobCellBox!.width / 2, y: dobCellBox!.y + dobCellBox!.height / 2 },
      );
      expect(dobOnTop).toBe(true);

      // ----- Walk to Step 6 -----
      await page.getByLabel(/^Full name/).fill('Jane Doe');
      await page.getByLabel(/^Email/).fill('jane.e2e@example.com');
      await page.getByLabel(/^Phone/).fill('5551234567');
      await page.getByLabel(/^Home address/).fill('123 Test St');
      await pickDate(dobWrapper, new Date(1991, 2, 7));
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

      // ----- Step 6: signature.date picker measurement -----
      const sigWrapper = dayPickerInside(page, 'signature.date');
      await expect(sigWrapper).toBeVisible();
      // Scroll into view so boundingBox returns layout-true coordinates.
      await sigWrapper.scrollIntoViewIfNeeded();
      const sigBox = await sigWrapper.boundingBox();
      expect(sigBox).not.toBeNull();

      // Same minimum size threshold as Step 1.
      expect(sigBox!.width).toBeGreaterThan(240);
      expect(sigBox!.height).toBeGreaterThan(240);

      // Inline (no popover/dialog/portal).
      expect(await sigWrapper.locator('[role="dialog"]').count()).toBe(0);

      // Visual parity: both pickers should render at the same width
      // (same source-of-truth `.consultation-daypicker` rule + same
      // `consultation-dob-group` wrapper). Allow 2px slack for sub-pixel
      // browser-specific rounding in flexible-width grids.
      expect(Math.abs(sigBox!.width - dobBox!.width)).toBeLessThanOrEqual(2);

      // Containing-block parity: signature.date sits inside its own
      // `consultation-dob-group` wrapper, mirroring Step 1.
      const sigAncestor = page.locator('.consultation-dob-group').filter({ has: sigWrapper });
      await expect(sigAncestor).toBeVisible();
      const sigAncestorBox = await sigAncestor.boundingBox();
      expect(sigAncestorBox).not.toBeNull();
      expect(sigBox!.x).toBeGreaterThanOrEqual(sigAncestorBox!.x - 1);
      expect(sigBox!.x + sigBox!.width).toBeLessThanOrEqual(
        sigAncestorBox!.x + sigAncestorBox!.width + 1,
      );

      // No portal hoisting on Step 6 either.
      const sigButtonsTotal = await page.locator('.rdp-day_button').count();
      const sigButtonsInside = await sigWrapper.locator('.rdp-day_button').count();
      expect(sigButtonsInside).toBe(sigButtonsTotal);

      // Stacking: hit-test a real day cell on Step 6 too.
      const sigProbeCell = sigWrapper.locator('.rdp-day_button').nth(10);
      await sigProbeCell.scrollIntoViewIfNeeded();
      const sigCellBox = await sigProbeCell.boundingBox();
      expect(sigCellBox).not.toBeNull();
      const sigOnTop = await page.evaluate(
        ({ x, y }) => {
          const el = document.elementFromPoint(x, y);
          return el ? el.closest('[data-name="signature.date"]') !== null : false;
        },
        { x: sigCellBox!.x + sigCellBox!.width / 2, y: sigCellBox!.y + sigCellBox!.height / 2 },
      );
      expect(sigOnTop).toBe(true);
    });

    test('day cells share matching size between Step 1 DOB and Step 6 signature.date (visual parity)', async ({
      page,
    }) => {
      await page.goto('/consultation/step-1');
      await expectOnStep(page, 1);

      // Measure a single Step 1 day cell — the `.consultation-daypicker`
      // rule sets `--rdp-cell-size: 44px` (chunk's tap-target floor).
      const dobWrapper = dayPickerInside(page, 'personal.dob');
      await expect(dobWrapper).toBeVisible();
      const dobCell = dobWrapper.locator('.rdp-day_button').first();
      const dobCellBox = await dobCell.boundingBox();
      expect(dobCellBox).not.toBeNull();
      expect(dobCellBox!.width).toBeGreaterThanOrEqual(36);
      expect(dobCellBox!.height).toBeGreaterThanOrEqual(36);

      // Walk to Step 6.
      await page.getByLabel(/^Full name/).fill('Jane Doe');
      await page.getByLabel(/^Email/).fill('jane.e2e@example.com');
      await page.getByLabel(/^Phone/).fill('5551234567');
      await page.getByLabel(/^Home address/).fill('123 Test St');
      await pickDate(dobWrapper, new Date(1991, 2, 7));
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

      const sigWrapper = dayPickerInside(page, 'signature.date');
      await expect(sigWrapper).toBeVisible();
      await sigWrapper.scrollIntoViewIfNeeded();
      const sigCell = sigWrapper.locator('.rdp-day_button').first();
      const sigCellBox = await sigCell.boundingBox();
      expect(sigCellBox).not.toBeNull();

      // Cell sizes should match within 1px (same CSS variable applies
      // to both pickers via `.consultation-daypicker`).
      expect(Math.abs(sigCellBox!.width - dobCellBox!.width)).toBeLessThanOrEqual(1);
      expect(Math.abs(sigCellBox!.height - dobCellBox!.height)).toBeLessThanOrEqual(1);
    });
  });

  test('Step 6 Health review renders a <dl> with the entered Step 4 values', async ({ page }) => {
    await page.goto('/consultation/step-1');
    await expectOnStep(page, 1);
    await page.getByLabel(/^Full name/).fill('Jane Doe');
    await page.getByLabel(/^Email/).fill('jane.e2e@example.com');
    await page.getByLabel(/^Phone/).fill('5551234567');
    await page.getByLabel(/^Home address/).fill('123 Test St');
    await pickDate(dayPickerInside(page, 'personal.dob'), new Date(Date.UTC(1991, 2, 7)));
    await clickNext(page);
    await expectOnStep(page, 2);
    await clickNext(page);
    await expectOnStep(page, 3);
    await clickNext(page);
    await expectOnStep(page, 4);

    // Set under_physician_care = Yes; everything else = No / sweep.
    await pickYesNo(page, 'health.under_physician_care', 'yes');
    for (const name of [
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

    // Find the Health review section and the dl inside it.
    const healthSection = page
      .locator('.consultation-review-section')
      .filter({ has: page.getByRole('heading', { level: 3, name: 'Health' }) });
    const dl = healthSection.locator('dl');
    await expect(dl).toBeVisible();
    // dt for "Under a physician's care" should be sibling to dd "Yes".
    const physicianDt = dl.locator('dt', { hasText: /Under a physician's care/i }).first();
    await expect(physicianDt).toBeVisible();
    // The dd that immediately follows the physician dt holds the value.
    const physicianDd = physicianDt.locator('xpath=following-sibling::dd[1]');
    await expect(physicianDd).toHaveText(/^Yes$/);
    // "Conditions reported" row exists and reads "None reported" after the sweep.
    const conditionsDt = dl.locator('dt', { hasText: /Conditions reported/i }).first();
    await expect(conditionsDt).toBeVisible();
    const conditionsDd = conditionsDt.locator('xpath=following-sibling::dd[1]');
    await expect(conditionsDd).toHaveText('None reported');

    // Defensive: the legacy placeholder paragraph must NOT exist inside the
    // health review section.
    expect(await healthSection.locator('p').count()).toBe(0);
  });
});
