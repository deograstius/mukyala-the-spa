/**
 * E2E coverage for the /consultation wizard.
 *
 * Replaces the placeholder `consultation.todo.spec.ts` with real Playwright
 * assertions for the day-to-day user-visible flow:
 *   - Happy path Step 1 → 6 with calendar DOB, chip-selects, stepper bumps,
 *     skin-concern toggles, "Mark all No" sweep, Step 5 skip, signature,
 *     SuccessPanel
 *   - Draft persist + resume across navigation
 *   - Step 5 "Yes, continue" gate reveals the females-only fields
 *   - Validation: Step 1 empty Next + Step 6 attestation-unchecked submit
 *
 * Selector hierarchy (per existing e2e patterns):
 *   1) `data-testid` / `data-cta-id`
 *   2) `getByRole({ name })` / `getByLabel`
 *   3) Stable id selectors mounted by FormField / YesNoField
 *
 * Network: `POST /v1/consultations` is stubbed via `page.route()` so the
 *   suite never touches a real backend.
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

/** Locator for the inner DayPicker group (`role="group"`, `data-name=...`). */
function dayPickerInside(page: Page, name: string): Locator {
  return page.locator(`[data-name="${name}"]`);
}

/** Pick a date via the year/month dropdown caption + day cell click. */
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

async function clickNext(page: Page): Promise<void> {
  await page.locator('[data-cta-id="consultation-next"]').click();
}

/** Click a Yes/No option by name + value. YesNoField builds ids by replacing
 *  non-[a-zA-Z0-9_-] chars with `-`. The visible label intercepts pointer
 *  events, so we click the <label> via its `for` attribute. */
async function pickYesNo(page: Page, name: string, value: 'yes' | 'no'): Promise<void> {
  const baseId = name.replace(/[^a-zA-Z0-9_-]/g, '-');
  await page.locator(`label[for="${baseId}-${value}"]`).click();
}

async function pickChip(page: Page, name: string, value: string): Promise<void> {
  const baseId = name.replace(/[^a-zA-Z0-9_-]/g, '-');
  await page.locator(`label[for="${baseId}-${value}"]`).click();
}

async function toggleCheckbox(page: Page, name: string, value: string): Promise<void> {
  const baseId = name.replace(/[^a-zA-Z0-9_-]/g, '-');
  await page.locator(`label[for="${baseId}-${value}"]`).click();
}

async function expectOnStep(page: Page, n: 1 | 2 | 3 | 4 | 5 | 6): Promise<void> {
  await expect(page.locator(`.consultation-step-${n}`)).toBeVisible();
}

/** Mock POST /v1/consultations; resolves to a 201 with submission_id. */
async function mockConsultationSubmit(
  page: Page,
  submissionId = 'test-uuid',
  status = 201,
): Promise<void> {
  await page.route('**/v1/consultations', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({
        submission_id: submissionId,
        received_at: new Date().toISOString(),
      }),
    });
  });
}

async function fillStep1Valid(page: Page): Promise<void> {
  await page.getByLabel(/^Full name/).fill('Jane Doe');
  await page.getByLabel(/^Email/).fill('jane.e2e@example.com');
  await page.getByLabel(/^Phone/).fill('5551234567');
  await page.getByLabel(/^Home address/).fill('123 Test St, Springfield');
  await pickDate(dayPickerInside(page, 'personal.dob'), new Date(1991, 2, 7));
}

async function answerStep4AllNo(page: Page): Promise<void> {
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
  // Sweep the Conditions card.
  await page.getByRole('button', { name: /^mark all no$/i }).click();
  // The sweep may or may not show an inline confirm depending on whether any
  // conditions were Yes. If a confirm strip appears, accept it.
  const confirmStrip = page.locator('#consultation-mark-all-no-confirm');
  if ((await confirmStrip.count()) > 0 && (await confirmStrip.isVisible())) {
    const confirmBtn = confirmStrip.getByRole('button', { name: /^confirm$/i });
    if ((await confirmBtn.count()) > 0) {
      await confirmBtn.click();
    }
  }
}

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

test.describe('consultation — happy path', () => {
  test('Step 1 → 6 with calendar DOB, chips, stepper, Mark-all-No, Step 5 skip, success', async ({
    page,
  }) => {
    await mockConsultationSubmit(page, 'test-uuid');
    await page.goto('/consultation/step-1');

    // No resume prompt on a fresh visit.
    await expect(page.getByRole('dialog', { name: /pick up where you left off/i })).toHaveCount(0);
    await expectOnStep(page, 1);

    // ---- Step 1 ----
    await page.getByLabel(/^Full name/).fill('Jane Doe');
    await page.getByLabel(/^Email/).fill('jane.e2e@example.com');
    await page.getByLabel(/^Phone/).fill('5551234567');
    await page.getByLabel(/^Home address/).fill('123 Test St, Springfield');
    // DOB: open DatePickerField, navigate via year-dropdown, pick a day.
    await pickDate(dayPickerInside(page, 'personal.dob'), new Date(1991, 2, 7));
    await clickNext(page);

    // ---- Step 2 ----
    await expectOnStep(page, 2);
    // Chip-select stress level "Low".
    await pickChip(page, 'lifestyle.stress_level', 'low');
    // Exercise Yes reveals frequency chips; pick a value.
    await pickYesNo(page, 'lifestyle.exercise', 'yes');
    await expect(page.locator('input[name="lifestyle.exercise_frequency"]').first()).toBeAttached();
    await pickChip(page, 'lifestyle.exercise_frequency', '3_5_per_week');
    // Bump water glasses from default 6 to 8 via stepper +.
    const waterStepper = page.locator('[data-name="lifestyle.water_glasses_per_day"]');
    await waterStepper.getByRole('button', { name: /increase glasses of water per day/i }).click();
    await waterStepper.getByRole('button', { name: /increase glasses of water per day/i }).click();
    await expect(waterStepper).toHaveAttribute('aria-valuenow', '8');
    await clickNext(page);

    // ---- Step 3 ----
    await expectOnStep(page, 3);
    // Chip-toggle 2 skin concerns.
    await toggleCheckbox(page, 'skin_concerns.selected', 'acne_or_scarring');
    await toggleCheckbox(page, 'skin_concerns.selected', 'hyperpigmentation');
    // Type goals.
    await page.locator('textarea[name="skin_concerns.goals"]').fill('clearer pores, brighter tone');
    await clickNext(page);

    // ---- Step 4 ----
    await expectOnStep(page, 4);
    await answerStep4AllNo(page);
    // Females_only opt-in: leave No so Step 5 is skipped.
    await pickYesNo(page, 'females_only.applicable', 'no');
    await clickNext(page);

    // ---- Step 5 was skipped → progress denominator drops to 5. ----
    await expectOnStep(page, 6);
    const progressBar = page.locator('.consultation-progress-bar[role="progressbar"]');
    await expect(progressBar).toHaveAttribute('aria-valuemax', '5');
    // Spot-check "of 5" appears in the on-screen progress indicator.
    await expect(page.getByText(/of\s+5/i).first()).toBeVisible();

    // ---- Step 6 review reflects entered values ----
    const personalSection = page
      .locator('.consultation-review-section')
      .filter({ has: page.getByRole('heading', { level: 3, name: 'Personal information' }) });
    await expect(personalSection).toContainText('Jane Doe');
    await expect(personalSection).toContainText('jane.e2e@example.com');
    await expect(personalSection).toContainText('123 Test St, Springfield');
    await expect(personalSection).toContainText(/Mar 7,?\s+1991/);

    const lifestyleSection = page
      .locator('.consultation-review-section')
      .filter({ has: page.getByRole('heading', { level: 3, name: 'Lifestyle' }) });
    await expect(lifestyleSection).toContainText(/low/i);

    // Sign + attest + submit.
    await page.getByLabel('Type your full name').fill('Jane Doe');
    await page.locator('label[for="signature.attested"]').click();
    await expect(page.locator('#signature\\.attested')).toBeChecked();
    await page.locator('[data-cta-id="consultation-submit"]').click();

    // ---- SuccessPanel ----
    await expect(page.getByTestId('consultation-submission-id')).toHaveText('test-uuid', {
      timeout: 10_000,
    });
    await expect(
      page.getByRole('heading', { level: 1, name: /we've received your consultation request/i }),
    ).toBeVisible();
    // SLA copy.
    await expect(page.getByText(/We'll respond within 2 business days/i)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Draft persist + resume
// ---------------------------------------------------------------------------

test.describe('consultation — draft persist + resume', () => {
  test('typing on Step 1 then revisiting shows resume card with Continue / Start fresh', async ({
    page,
  }) => {
    await mockConsultationSubmit(page);
    await page.goto('/consultation/step-1');
    await expectOnStep(page, 1);

    // Fill Step 1 minimal.
    await fillStep1Valid(page);

    // Wait for the autosave debounce to flush a draft to localStorage.
    await expect
      .poll(
        async () =>
          page.evaluate(
            () =>
              Object.keys(window.localStorage).filter((k) =>
                k.startsWith('mukyala.forms.draft.intake.'),
              ).length,
          ),
        { timeout: 5000 },
      )
      .toBeGreaterThan(0);

    // Navigate away then back.
    await page.goto('/');
    await page.goto('/consultation');

    // Resume card appears with Continue / Start fresh.
    const resumeDialog = page.getByRole('dialog', { name: /pick up where you left off/i });
    await expect(resumeDialog).toBeVisible();
    await expect(page.locator('[data-cta-id="consultation-resume-yes"]')).toBeVisible();
    await expect(page.locator('[data-cta-id="consultation-resume-no"]')).toBeVisible();

    // Continue restores Step 1 values.
    await page.locator('[data-cta-id="consultation-resume-yes"]').click();
    await expectOnStep(page, 1);
    await expect(page.getByLabel(/^Full name/)).toHaveValue('Jane Doe');
    await expect(page.getByLabel(/^Email/)).toHaveValue('jane.e2e@example.com');
  });
});

// ---------------------------------------------------------------------------
// Step 5 "Yes, continue"
// ---------------------------------------------------------------------------

test.describe('consultation — Step 5 gate', () => {
  test('Yes, continue reveals the Step 5 fields', async ({ page }) => {
    await mockConsultationSubmit(page);
    await page.goto('/consultation/step-1');
    await expectOnStep(page, 1);
    await fillStep1Valid(page);
    await clickNext(page);
    await expectOnStep(page, 2);
    await clickNext(page);
    await expectOnStep(page, 3);
    await clickNext(page);
    await expectOnStep(page, 4);
    await answerStep4AllNo(page);
    // Opt INTO Step 5.
    await pickYesNo(page, 'females_only.applicable', 'yes');
    await clickNext(page);
    await expectOnStep(page, 5);

    // Tap "Yes, continue" on the gate row.
    const gateRow = page.locator('.consultation-gate-row');
    await expect(gateRow).toBeVisible();
    await gateRow.getByRole('button', { name: /^yes,?\s*continue$/i }).click();

    // Step 5 fields render.
    await expect(page.locator('#females_only-pregnant-yes')).toBeAttached();
    await expect(page.locator('#females_only-breastfeeding-yes')).toBeAttached();
    await expect(page.locator('#females_only-contraceptives-yes')).toBeAttached();
  });
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

test.describe('consultation — validation', () => {
  test('Step 1 Next with empty required field shows the validation banner', async ({ page }) => {
    await mockConsultationSubmit(page);
    await page.goto('/consultation/step-1');
    await expectOnStep(page, 1);

    // Press Next without filling anything.
    await clickNext(page);

    // Still on Step 1, validation banner mounts.
    await expectOnStep(page, 1);
    await expect(page.locator('.consultation-validation-banner')).toBeVisible();
    // First required field flagged invalid.
    await expect(page.locator('#personal\\.client_name')).toHaveAttribute('aria-invalid', 'true');
  });

  test('Step 6 submit with attestation unchecked surfaces an error', async ({ page }) => {
    await mockConsultationSubmit(page);
    await page.goto('/consultation/step-1');
    await expectOnStep(page, 1);
    await fillStep1Valid(page);
    await clickNext(page);
    await expectOnStep(page, 2);
    await clickNext(page);
    await expectOnStep(page, 3);
    await clickNext(page);
    await expectOnStep(page, 4);
    await answerStep4AllNo(page);
    await pickYesNo(page, 'females_only.applicable', 'no');
    await clickNext(page);
    await expectOnStep(page, 6);

    // Fill print_name but leave attestation unchecked.
    await page.getByLabel('Type your full name').fill('Jane Doe');
    await expect(page.locator('#signature\\.attested')).not.toBeChecked();
    await page.locator('[data-cta-id="consultation-submit"]').click();

    // Validation error surfaces; SuccessPanel does not render.
    await expect(page.locator('.consultation-validation-banner')).toBeVisible();
    await expect(page.getByTestId('consultation-submission-id')).toHaveCount(0);
  });
});
