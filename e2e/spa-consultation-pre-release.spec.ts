/**
 * E2E coverage for chunk `spa-consultation-pre-release-2026-05-01`.
 *
 * Bundles three sub-chunks for the pre-release sweep:
 *   - `spa-hero-consultation-cta` (home hero secondary CTA + subheadline copy)
 *   - `spa-consultation-form-v1` (full /consultation wizard happy path,
 *     draft persist, Step 5 skip + continue, validation, Mark-all-No)
 *   - `spa-consultation-input-overhaul` (DOB calendar, chip selects, steppers,
 *     conditional reveals)
 *
 * Goal: replace the architect's `consultation.todo.spec.ts` placeholders with
 *   real assertions that would catch regressions in the integrated flow before
 *   shipping to production. Wire-format payload shape is also verified on the
 *   happy-path test so an accidental schema change at the SPA layer would be
 *   caught here.
 *
 * Selectors prefer (per playbook agent rules):
 *   1) `data-testid` / `data-cta-id`
 *   2) `getByRole({ name })` / `getByLabel`
 *   3) Stable id selectors mounted by FormField / YesNoField
 *   4) Class selectors only when the spec asserts the class (sizing, etc.)
 *
 * Mocks: `POST /v1/consultations` is stubbed with `page.route` so the suite
 *   never touches a real backend. The home page also stubs `/v1/services`,
 *   `/v1/products`, `/v1/locations` via the shared `mockApiRoutes` helper.
 */

import { test, expect, type Page, type Locator } from '@playwright/test';
import { mockApiRoutes } from './api-mocks';

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

/** Click the wizard's primary "Next" button. */
async function clickNext(page: Page): Promise<void> {
  await page.locator('[data-cta-id="consultation-next"]').click();
}

/** Click a Yes/No option by name + value. */
async function pickYesNo(page: Page, name: string, value: 'yes' | 'no'): Promise<void> {
  const baseId = name.replace(/[^a-zA-Z0-9_-]/g, '-');
  await page.locator(`label[for="${baseId}-${value}"]`).click();
}

/** Click a chip-segment option by name + value. */
async function pickChip(page: Page, name: string, value: string): Promise<void> {
  const baseId = name.replace(/[^a-zA-Z0-9_-]/g, '-');
  await page.locator(`label[for="${baseId}-${value}"]`).click();
}

/** Click a checkbox-group option by name + value. */
async function toggleCheckbox(page: Page, name: string, value: string): Promise<void> {
  const baseId = name.replace(/[^a-zA-Z0-9_-]/g, '-');
  await page.locator(`label[for="${baseId}-${value}"]`).click();
}

async function expectOnStep(page: Page, n: 1 | 2 | 3 | 4 | 5 | 6): Promise<void> {
  await expect(page.locator(`.consultation-step-${n}`)).toBeVisible();
}

interface ConsultationCapture {
  payload: unknown;
  headers: Record<string, string>;
}

/**
 * Mock POST /v1/consultations and capture the request for payload assertions.
 *
 * Returns a getter that resolves to the most recent captured request once
 * the SPA fires the submit. Tests that don't need to inspect the payload
 * can ignore the getter and just rely on the SuccessPanel rendering.
 */
function mockConsultationSubmit(
  page: Page,
  options: { submissionId?: string; status?: number } = {},
): { getCaptured: () => ConsultationCapture | null } {
  const submissionId = options.submissionId ?? 'sub_e2e_pre_release';
  const status = options.status ?? 200;
  let captured: ConsultationCapture | null = null;
  void page.route('**/v1/consultations', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    captured = {
      payload: route.request().postDataJSON?.() ?? null,
      headers: route.request().headers(),
    };
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({
        submission_id: submissionId,
        received_at: new Date().toISOString(),
      }),
    });
  });
  return { getCaptured: () => captured };
}

/** Fill the four Step 1 text inputs + DOB. */
async function fillStep1Valid(page: Page): Promise<void> {
  await page.getByLabel(/^Full name/).fill('Jane Doe');
  await page.getByLabel(/^Email/).fill('jane.e2e@example.com');
  await page.getByLabel(/^Phone/).fill('5551234567');
  await page.getByLabel(/^Home address/).fill('123 Test St, Springfield');
  await pickDate(dayPickerInside(page, 'personal.dob'), new Date(1991, 2, 7));
}

/** Set every Step 4 health boolean to No (Care/Allergies cards individually,
 *  Conditions card via Mark-all-No sweep). Leaves females_only.applicable
 *  unset — caller decides Yes (continue to Step 5) vs No (skip Step 5). */
async function answerStep4AllNo(page: Page): Promise<void> {
  const noFields = [
    'health.under_physician_care',
    'health.being_treated',
    'health.using_steroids',
    'health.taking_medications',
    'health.allergies',
    'health.medication_allergies',
    'health.cosmetic_allergies',
  ];
  for (const name of noFields) {
    await pickYesNo(page, name, 'no');
  }
  await page.getByRole('button', { name: /^mark all no$/i }).click();
}

// ---------------------------------------------------------------------------
// 1. Home hero CTAs
// ---------------------------------------------------------------------------

test.describe('home hero — Reservation + Consultation CTAs', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
  });

  test('subheadline copy + two CTAs side-by-side with correct data-cta-id and hrefs', async ({
    page,
  }) => {
    await page.goto('/');

    // Subheadline copy ("Timeless rituals, inclusive care.").
    await expect(page.getByText(/Timeless rituals,\s*inclusive care\./i)).toBeVisible();

    // Both CTAs are rendered with the documented data-cta-id values.
    const reservationCta = page.locator('[data-cta-id="home-hero-cta"]');
    const consultationCta = page.locator('[data-cta-id="home-hero-consultation-cta"]');
    await expect(reservationCta).toBeVisible();
    await expect(consultationCta).toBeVisible();

    // Hrefs point at the correct routes.
    await expect(reservationCta).toHaveAttribute('href', '/reservation');
    await expect(consultationCta).toHaveAttribute('href', '/consultation');

    // Both CTAs sit on the same horizontal row at hero width (operator
    // override: keep horizontal at every viewport). Allow ~10px slack on the
    // y-coordinate for sub-pixel rendering of side-by-side flex children.
    const resBox = await reservationCta.boundingBox();
    const consBox = await consultationCta.boundingBox();
    expect(resBox).not.toBeNull();
    expect(consBox).not.toBeNull();
    expect(Math.abs(resBox!.y - consBox!.y)).toBeLessThanOrEqual(10);
    // Reservation comes first (left), Consultation comes second (right).
    expect(resBox!.x).toBeLessThan(consBox!.x);
  });

  test('clicking Consultation routes to /consultation/step-1', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-cta-id="home-hero-consultation-cta"]').click();
    // /consultation redirects to /consultation/step-1 via the router default.
    await page.waitForURL(/\/consultation\/step-1$/);
    await expectOnStep(page, 1);
    await expect(
      page.getByRole('heading', { level: 1, name: /your free mukyala skin consultation/i }),
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. Consultation happy path (full flow)
// ---------------------------------------------------------------------------

test.describe('consultation — happy path', () => {
  test('Step 1 → 6 with calendar DOB, chips, steppers, Mark-all-No, Step 5 skip, signature, success', async ({
    page,
  }) => {
    const capture = mockConsultationSubmit(page, { submissionId: 'sub_e2e_happy_path' });
    await page.goto('/consultation');

    // Resume prompt should NOT appear on a fresh visit.
    await expect(page.getByRole('dialog', { name: /pick up where you left off/i })).toHaveCount(0);
    await expectOnStep(page, 1);

    // ---- Step 1 ----
    await page.getByLabel(/^Full name/).fill('Jane Doe');
    await page.getByLabel(/^Email/).fill('jane.e2e@example.com');
    await page.getByLabel(/^Phone/).fill('5551234567');
    await page.getByLabel(/^Home address/).fill('123 Test St, Springfield');
    // DOB via year-dropdown calendar — pick 30+ years back (chunk brief).
    const targetDob = new Date(1991, 2, 7); // 1991-03-07
    await pickDate(dayPickerInside(page, 'personal.dob'), targetDob);
    await clickNext(page);

    // ---- Step 2 ----
    await expectOnStep(page, 2);
    // Stress level chip: high.
    await pickChip(page, 'lifestyle.stress_level', 'high');
    // Exercise = Yes reveals a frequency chip group; pick 3-5/wk.
    await pickYesNo(page, 'lifestyle.exercise', 'yes');
    await expect(page.locator('input[name="lifestyle.exercise_frequency"]').first()).toBeAttached();
    await pickChip(page, 'lifestyle.exercise_frequency', '3_5_per_week');
    // Water glasses to 8 via stepper +. Default is 6.
    const waterStepper = page.locator('[data-name="lifestyle.water_glasses_per_day"]');
    await waterStepper.getByRole('button', { name: /increase glasses of water per day/i }).click();
    await waterStepper.getByRole('button', { name: /increase glasses of water per day/i }).click();
    await expect(waterStepper).toHaveAttribute('aria-valuenow', '8');
    // Alcohol = Yes; set to 2 via stepper +.
    await pickYesNo(page, 'lifestyle.alcohol', 'yes');
    const alcoholStepper = page.locator('[data-name="lifestyle.alcohol_units_per_week"]');
    await expect(alcoholStepper).toBeVisible();
    await alcoholStepper.getByRole('button', { name: /increase drinks per week/i }).click();
    await alcoholStepper.getByRole('button', { name: /increase drinks per week/i }).click();
    await expect(alcoholStepper).toHaveAttribute('aria-valuenow', '2');
    await clickNext(page);

    // ---- Step 3 ----
    await expectOnStep(page, 3);
    // Multi-select skin concerns (chips/checkboxes).
    await toggleCheckbox(page, 'skin_concerns.selected', 'acne_or_scarring');
    await toggleCheckbox(page, 'skin_concerns.selected', 'hyperpigmentation');
    // Free-text goals.
    await page.locator('textarea[name="skin_concerns.goals"]').fill('clearer pores, brighter tone');
    await clickNext(page);

    // ---- Step 4 ----
    await expectOnStep(page, 4);
    // Care + Allergies cards → No on each YesNoField.
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
    // Set ONE Conditions Yes so the inline confirm fires when we sweep.
    await pickYesNo(page, 'health.diabetes', 'yes');
    // Mark all No → triggers inline confirm.
    await page.getByRole('button', { name: /^mark all no$/i }).click();
    const confirmStrip = page.locator('#consultation-mark-all-no-confirm');
    await expect(confirmStrip).toBeVisible();
    await expect(confirmStrip).toHaveText(/reset 1 answer/i);
    // Confirm.
    await confirmStrip.getByRole('button', { name: /^confirm$/i }).click();
    // Diabetes radio is now No (and the rest of the conditions are also No).
    await expect(page.locator('#health-diabetes-no')).toBeChecked();
    await expect(page.locator('#health-diabetes-yes')).not.toBeChecked();
    // Females_only opt-in: leave No so Step 5 is skipped.
    await pickYesNo(page, 'females_only.applicable', 'no');
    await clickNext(page);

    // ---- Step 5 was skipped → land on Step 6 ----
    // Progress denominator drops from 6 to 5 once Step 5 is excluded.
    await expectOnStep(page, 6);
    const progressBar = page.locator('.consultation-progress-bar[role="progressbar"]');
    await expect(progressBar).toHaveAttribute('aria-valuemax', '5');
    await expect(progressBar).toHaveAttribute('aria-valuenow', '5');

    // ---- Step 6 review summary shows the values we entered ----
    const personalSection = page
      .locator('.consultation-review-section')
      .filter({ has: page.getByRole('heading', { level: 3, name: 'Personal information' }) });
    await expect(personalSection.locator('dl dd').nth(0)).toHaveText('Jane Doe');
    await expect(personalSection.locator('dl dd').nth(1)).toHaveText('jane.e2e@example.com');
    await expect(personalSection.locator('dl dd').nth(3)).toHaveText('123 Test St, Springfield');
    // DOB renders via toLocaleDateString({timeZone: 'UTC'}); check year + month.
    await expect(personalSection.locator('dl dd').nth(4)).toHaveText(/Mar 7,?\s+1991/);

    const lifestyleSection = page
      .locator('.consultation-review-section')
      .filter({ has: page.getByRole('heading', { level: 3, name: 'Lifestyle' }) });
    await expect(lifestyleSection).toContainText(/Stress level/i);
    await expect(lifestyleSection).toContainText(/high/i);
    await expect(lifestyleSection).toContainText(/3_5_per_week/);
    await expect(lifestyleSection).toContainText(/2 units\/week/);

    // Sign + attest + submit.
    await page.getByLabel('Type your full name').fill('Jane Doe');
    await page.locator('label[for="signature.attested"]').click();
    await expect(page.locator('#signature\\.attested')).toBeChecked();
    await page.locator('[data-cta-id="consultation-submit"]').click();

    // ---- Success panel ----
    await expect(page.getByTestId('consultation-submission-id')).toHaveText('sub_e2e_happy_path', {
      timeout: 10_000,
    });
    await expect(
      page.getByRole('heading', { level: 1, name: /we've received your consultation request/i }),
    ).toBeVisible();
    // SLA copy: "We'll respond within 2 business days." (operator-confirmed).
    await expect(page.getByText(/We'll respond within 2 business days/i)).toBeVisible();

    // Wire-format payload assertions on the captured POST body.
    const cap = capture.getCaptured();
    expect(cap, 'POST /v1/consultations was not captured').not.toBeNull();
    const body = cap!.payload as Record<string, unknown>;
    expect(body.form_id).toBe('intake');
    expect(typeof body.submitted_at).toBe('string');
    expect(typeof body.client_session_id).toBe('string');
    expect(Array.isArray(body.attachments)).toBe(true);
    expect((body.attachments as unknown[]).length).toBe(0);
    const signatures = body.signatures as Array<Record<string, unknown>>;
    expect(Array.isArray(signatures)).toBe(true);
    expect(signatures.length).toBe(1);
    expect(signatures[0].field).toBe('signature.client');
    expect(signatures[0].method).toBe('typed');
    expect(signatures[0].typed_name).toBe('Jane Doe');
    expect(signatures[0].attested).toBe(true);
    const payload = body.payload as Record<string, unknown>;
    // Personal block — flat dotted keys.
    expect(payload['personal.client_name']).toBe('Jane Doe');
    expect(payload['personal.email']).toBe('jane.e2e@example.com');
    expect(payload['personal.dob_year']).toBe('1991');
    expect(payload['personal.dob_month']).toBe('03');
    expect(payload['personal.dob_day']).toBe('07');
    // Lifestyle stepper round-trips as stringified ints.
    expect(payload['lifestyle.water_glasses_per_day']).toBe('8');
    expect(payload['lifestyle.alcohol_units_per_week']).toBe('2');
    // Health booleans are present (we cleared them all to false via the
    // Mark-all-No sweep + per-field clicks).
    expect(payload['health.under_physician_care']).toBe(false);
    expect(payload['health.diabetes']).toBe(false);
    // Required headers.
    expect(cap!.headers['idempotency-key']).toBeTruthy();
    expect(cap!.headers['x-client-session-id']).toBeTruthy();

    // Draft was cleared from localStorage on success.
    const draftKeys = await page.evaluate(() =>
      Object.keys(window.localStorage).filter((k) => k.startsWith('mukyala.forms.draft.intake.')),
    );
    expect(draftKeys).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 3. Draft persist + resume
// ---------------------------------------------------------------------------

test.describe('consultation — draft persist + resume', () => {
  test('typing on Step 1+2 then revisiting shows resume prompt; Continue restores Step 2 state', async ({
    page,
  }) => {
    mockConsultationSubmit(page);
    await page.goto('/consultation/step-1');
    await expectOnStep(page, 1);

    // Fill Step 1 minimal + advance to Step 2.
    await fillStep1Valid(page);
    await clickNext(page);
    await expectOnStep(page, 2);

    // On Step 2, set a recognizable value (alcohol = Yes, stepper increment).
    await pickYesNo(page, 'lifestyle.alcohol', 'yes');
    const alcoholStepper = page.locator('[data-name="lifestyle.alcohol_units_per_week"]');
    await alcoholStepper.getByRole('button', { name: /increase drinks per week/i }).click();
    await expect(alcoholStepper).toHaveAttribute('aria-valuenow', '1');

    // Wait for the autosave debounce (500ms) + flush to localStorage.
    await expect(page.getByTestId('consultation-autosave-indicator')).toBeVisible();
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

    // Navigate away to a different route, then back.
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
    await page.goto('/consultation');

    // Resume prompt should appear with Continue / Start fresh actions.
    const resumeDialog = page.getByRole('dialog', { name: /pick up where you left off/i });
    await expect(resumeDialog).toBeVisible();
    await expect(page.locator('[data-cta-id="consultation-resume-yes"]')).toBeVisible();
    await expect(page.locator('[data-cta-id="consultation-resume-no"]')).toBeVisible();

    // Click Continue: state restores. The wizard renders the URL's step-1
    // (the draft store does not persist the active step), but the saved
    // draft values must still be present. Walk to Step 2 and assert
    // alcohol = Yes + units/week = 1.
    await page.locator('[data-cta-id="consultation-resume-yes"]').click();
    await expectOnStep(page, 1);
    // Step 1 fields are pre-filled from the draft.
    await expect(page.getByLabel(/^Full name/)).toHaveValue('Jane Doe');
    await expect(page.getByLabel(/^Email/)).toHaveValue('jane.e2e@example.com');
    // Advance to Step 2 (no input needed — required fields are already filled).
    await clickNext(page);
    await expectOnStep(page, 2);
    await expect(page.locator('#lifestyle-alcohol-yes')).toBeChecked();
    const restoredAlcohol = page.locator('[data-name="lifestyle.alcohol_units_per_week"]');
    await expect(restoredAlcohol).toHaveAttribute('aria-valuenow', '1');
  });

  test('clicking "Start fresh" on the resume prompt clears the draft from localStorage', async ({
    page,
  }) => {
    mockConsultationSubmit(page);
    await page.goto('/consultation/step-1');
    await expectOnStep(page, 1);
    await fillStep1Valid(page);
    // Wait for autosave to land.
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

    // Revisit so the resume prompt appears.
    await page.goto('/consultation');
    const resumeDialog = page.getByRole('dialog', { name: /pick up where you left off/i });
    await expect(resumeDialog).toBeVisible();

    // Click Start fresh — draft should be wiped from localStorage.
    await page.locator('[data-cta-id="consultation-resume-no"]').click();
    await expect(resumeDialog).toHaveCount(0);
    await expectOnStep(page, 1);
    await expect(page.getByLabel(/^Full name/)).toHaveValue('');
    const remainingDraftKeys = await page.evaluate(() =>
      Object.keys(window.localStorage).filter((k) => k.startsWith('mukyala.forms.draft.intake.')),
    );
    expect(remainingDraftKeys).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 4. Step 5 (Females-only) full flow
// ---------------------------------------------------------------------------

test.describe('consultation — Step 5 Females-only full flow', () => {
  test('Yes-continue gate reveals all Step 5 fields and lets the user advance to Step 6', async ({
    page,
  }) => {
    mockConsultationSubmit(page);
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
    // Opt INTO Step 5 here so the wizard does not skip it.
    await pickYesNo(page, 'females_only.applicable', 'yes');
    await clickNext(page);
    await expectOnStep(page, 5);

    // Two gate buttons visible. Click "Yes, continue".
    const gateRow = page.locator('.consultation-gate-row');
    await expect(gateRow).toBeVisible();
    await gateRow.getByRole('button', { name: /^yes,?\s*continue$/i }).click();

    // All three Step 5 YesNoFields render.
    await expect(page.locator('#females_only-pregnant-yes')).toBeAttached();
    await expect(page.locator('#females_only-breastfeeding-yes')).toBeAttached();
    await expect(page.locator('#females_only-contraceptives-yes')).toBeAttached();

    // Progress denominator stays at 6 (Step 5 is included).
    const progressBar = page.locator('.consultation-progress-bar[role="progressbar"]');
    await expect(progressBar).toHaveAttribute('aria-valuemax', '6');

    // Advance to Step 6.
    await clickNext(page);
    await expectOnStep(page, 6);
  });

  test('"Skip this step" gate skips Step 5 and progress denominator drops to 5', async ({
    page,
  }) => {
    mockConsultationSubmit(page);
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
    // Opt INTO Step 5 from Step 4 so we visit it...
    await pickYesNo(page, 'females_only.applicable', 'yes');
    await clickNext(page);
    await expectOnStep(page, 5);

    // ...then change our mind on Step 5 with "Skip this step".
    const gateRow = page.locator('.consultation-gate-row');
    await gateRow.getByRole('button', { name: /skip this step/i }).click();

    // The step-5 reveal collapses (no pregnant/breastfeeding fields).
    await expect(page.locator('#females_only-pregnant-yes')).toHaveCount(0);

    // Progress denominator drops to 5; we land on Step 6 after Next.
    await clickNext(page);
    await expectOnStep(page, 6);
    const progressBar = page.locator('.consultation-progress-bar[role="progressbar"]');
    await expect(progressBar).toHaveAttribute('aria-valuemax', '5');
    await expect(progressBar).toHaveAttribute('aria-valuenow', '5');
  });
});

// ---------------------------------------------------------------------------
// 5. Conditional reveal animation
// ---------------------------------------------------------------------------

test.describe('consultation — conditional reveal', () => {
  test('Step 2 exercise: Yes reveals frequency chip group; No collapses + clears it', async ({
    page,
  }) => {
    mockConsultationSubmit(page);
    await page.goto('/consultation/step-1');
    await expectOnStep(page, 1);
    await fillStep1Valid(page);
    await clickNext(page);
    await expectOnStep(page, 2);

    // Initially the exercise_frequency chip group is not mounted (RevealOnTrigger
    // does not mount children when show=false).
    expect(await page.locator('input[name="lifestyle.exercise_frequency"]').count()).toBe(0);

    // Tap Yes → frequency chips render, child is in the DOM.
    await pickYesNo(page, 'lifestyle.exercise', 'yes');
    await expect(page.locator('input[name="lifestyle.exercise_frequency"]').first()).toBeAttached();
    // Pick a value so we can later assert the clear-on-flip behaviour.
    await pickChip(page, 'lifestyle.exercise_frequency', 'daily');
    await expect(page.locator('#lifestyle-exercise_frequency-daily')).toBeChecked();

    // Tap No → frequency chips unmount and the value is cleared.
    await pickYesNo(page, 'lifestyle.exercise', 'no');
    await expect(page.locator('input[name="lifestyle.exercise_frequency"]')).toHaveCount(0);

    // Re-tap Yes → chip group remounts but the daily selection is gone (cleared).
    await pickYesNo(page, 'lifestyle.exercise', 'yes');
    await expect(page.locator('#lifestyle-exercise_frequency-daily')).not.toBeChecked();
  });
});

// ---------------------------------------------------------------------------
// 6. Validation flow
// ---------------------------------------------------------------------------

test.describe('consultation — validation', () => {
  test('Step 1 Next with empty required field shows the validation banner; filling it advances', async ({
    page,
  }) => {
    mockConsultationSubmit(page);
    await page.goto('/consultation/step-1');
    await expectOnStep(page, 1);

    // Press Next without filling anything.
    await clickNext(page);

    // Still on Step 1.
    await expectOnStep(page, 1);
    // The first invalid field has aria-invalid="true".
    await expect(page.locator('#personal\\.client_name')).toHaveAttribute('aria-invalid', 'true');

    // Fill all required fields and re-press Next.
    await fillStep1Valid(page);
    await clickNext(page);
    await expectOnStep(page, 2);
  });

  test('Step 6 submit with attestation unchecked surfaces an error and stays on the form', async ({
    page,
  }) => {
    mockConsultationSubmit(page);
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

    // Fill print_name but DO NOT check the attestation box.
    await page.getByLabel('Type your full name').fill('Jane Doe');
    await expect(page.locator('#signature\\.attested')).not.toBeChecked();
    await page.locator('[data-cta-id="consultation-submit"]').click();

    // Validation banner mounts; we stay on Step 6 (success panel must NOT
    // render).
    await expect(page.locator('.consultation-validation-banner')).toBeVisible();
    await expect(page.getByTestId('consultation-submission-id')).toHaveCount(0);

    // Tick attestation and re-submit — should now succeed.
    await page.locator('label[for="signature.attested"]').click();
    await page.locator('[data-cta-id="consultation-submit"]').click();
    await expect(page.getByTestId('consultation-submission-id')).toBeVisible({ timeout: 10_000 });
  });
});
