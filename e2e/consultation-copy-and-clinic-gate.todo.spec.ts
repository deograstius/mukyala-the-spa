/**
 * E2E coverage for chunk `consultation-copy-and-clinic-gate-2026-04-26`.
 *
 * Promoted from architect's `test.fixme` placeholders into real assertions.
 *
 * Behaviour under test (browser-real):
 *   - Step 1 renders WITHOUT the clinic_* inputs by default. They are gated
 *     behind a Yes/No question and `RevealOnTrigger` does not mount its
 *     children until `show === true`, so the inputs are absent from the DOM.
 *   - Answering "Yes" reveals the three optional clinic_* inputs.
 *   - With the gate Yes and clinic_* blank, Next advances to Step 2 (the
 *     fields stay optional even when revealed — proves the optional contract).
 *   - Flipping the gate Yes -> No clears any text typed into clinic_* via the
 *     centralized `applyRevealClears` (Step 1 round-trip: type, flip No, flip
 *     Yes again, the input is empty).
 *   - On Step 2, the alcohol section's revealed sub-section uses the new
 *     "Drinks per week" copy and the "1 drink ≈ 12oz beer / 5oz wine /
 *     1.5oz spirits" helper.
 *   - On Step 2, the cigarettes section's revealed sub-section uses the
 *     "1 pack = 20 cigarettes" helper and the Stepper renders a "cigarettes"
 *     suffix so the unit is meaningful.
 *
 * Selectors prefer:
 *   1) `data-cta-id` (Next button — already used by other consultation
 *      e2e specs).
 *   2) Stable ids mounted by FormField (`#personal\\.clinic_name`, etc.).
 *   3) Stable label-for ids mounted by YesNoField
 *      (`label[for="<sanitized-name>-yes|no"]`).
 *   4) User-facing helper text via `getByText` regex.
 *
 * The filename keeps the `*.todo.spec.ts` convention only for HANDOFF
 * traceability across stages — the file no longer contains any
 * `test.fixme` placeholders.
 */

import { test, expect, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Click the wizard's primary "Next" button. */
async function clickNext(page: Page): Promise<void> {
  await page.locator('[data-cta-id="consultation-next"]').click();
}

/** Wait for a step root marker to be present. */
async function expectOnStep(page: Page, n: 1 | 2 | 3 | 4 | 5 | 6): Promise<void> {
  await expect(page.locator(`.consultation-step-${n}`)).toBeVisible();
}

/**
 * Click a Yes/No option by name + value. The radio input itself is covered
 * by the wrapping `<label>` (the visible "Yes"/"No" span intercepts pointer
 * events), so we click the label by its `for` attribute / id pair.
 *
 * YesNoField sanitizes ids by replacing non-[a-zA-Z0-9_-] chars with `-`,
 * so `personal.has_referring_clinic` becomes `personal-has_referring_clinic`.
 */
async function pickYesNo(page: Page, name: string, value: 'yes' | 'no'): Promise<void> {
  const baseId = name.replace(/[^a-zA-Z0-9_-]/g, '-');
  await page.locator(`label[for="${baseId}-${value}"]`).click();
}

/**
 * Fill all Step-1 required fields with valid values so Next can advance.
 * The DOB picker is a react-day-picker with dropdown caption; we pick the
 * year/month from the comboboxes and then click the data-day cell.
 */
async function fillStep1Required(page: Page): Promise<void> {
  await page.getByLabel(/^Full name/).fill('Jane Doe');
  await page.getByLabel(/^Email/).fill('jane.e2e@example.com');
  await page.getByLabel(/^Phone/).fill('5551234567');
  await page.getByLabel(/^Home address/).fill('123 Test St, Springfield');

  const dob = page.locator('[data-name="personal.dob"]');
  await expect(dob).toBeVisible();
  const yearSelect = dob.getByRole('combobox', { name: /year/i });
  if ((await yearSelect.count()) > 0) {
    await yearSelect.first().selectOption('1991');
  }
  const monthSelect = dob.getByRole('combobox', { name: /month/i });
  if ((await monthSelect.count()) > 0) {
    // react-day-picker uses month index 0..11.
    await monthSelect.first().selectOption('2');
  }
  await dob.locator('td[data-day="1991-03-07"] button').click();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('consultation-copy-and-clinic-gate-2026-04-26 — clinic gate + Step 2 copy', () => {
  test('Step 1: clinic_* inputs are not present by default (gate is unanswered)', async ({
    page,
  }) => {
    await page.goto('/consultation/step-1');
    await expectOnStep(page, 1);

    // The gate question itself is visible (legend text).
    await expect(page.getByText(/Were you referred by a clinic\?/i)).toBeVisible();

    // None of the three clinic_* inputs are mounted. RevealOnTrigger does
    // not mount its children when `show === false` (no `keepMounted`), so
    // the inputs are fully absent from the DOM — count must be zero.
    expect(await page.locator('#personal\\.clinic_name').count()).toBe(0);
    expect(await page.locator('#personal\\.clinic_address').count()).toBe(0);
    expect(await page.locator('#personal\\.clinic_phone').count()).toBe(0);

    // The clinic-group fieldset wrapper is also absent from the DOM.
    expect(await page.locator('.consultation-clinic-group').count()).toBe(0);
  });

  test('Step 1: answering "Yes" reveals the three optional clinic_* inputs', async ({ page }) => {
    await page.goto('/consultation/step-1');
    await expectOnStep(page, 1);

    // Click the "Yes" radio under "Were you referred by a clinic?".
    await pickYesNo(page, 'personal.has_referring_clinic', 'yes');

    // The three inputs become visible.
    await expect(page.locator('#personal\\.clinic_name')).toBeVisible();
    await expect(page.locator('#personal\\.clinic_address')).toBeVisible();
    await expect(page.locator('#personal\\.clinic_phone')).toBeVisible();

    // The wrapping fieldset is also visible and carries its "(optional)"
    // legend so users know it's not required.
    await expect(page.locator('.consultation-clinic-group')).toBeVisible();
    await expect(page.getByText(/Referring clinic \(optional\)/i)).toBeVisible();
  });

  test('Step 1: with the gate Yes and all clinic_* blank, Next advances to Step 2 (optional contract)', async ({
    page,
  }) => {
    await page.goto('/consultation/step-1');
    await expectOnStep(page, 1);

    // Fill all Step-1 required fields with valid values, but leave the
    // clinic_* trio blank.
    await fillStep1Required(page);

    // Open the clinic gate so the optional inputs are mounted...
    await pickYesNo(page, 'personal.has_referring_clinic', 'yes');
    // ...but DO NOT type into them.
    await expect(page.locator('#personal\\.clinic_name')).toBeVisible();
    await expect(page.locator('#personal\\.clinic_name')).toHaveValue('');
    await expect(page.locator('#personal\\.clinic_address')).toHaveValue('');
    await expect(page.locator('#personal\\.clinic_phone')).toHaveValue('');

    // Click Next — must advance to Step 2 (no validation error gating us).
    await clickNext(page);
    await expectOnStep(page, 2);
  });

  test('Step 1: flipping gate Yes -> No clears any text typed into clinic_* (verifies applyRevealClears runtime wiring)', async ({
    page,
  }) => {
    await page.goto('/consultation/step-1');
    await expectOnStep(page, 1);

    // Reveal the inputs and type into clinic_name.
    await pickYesNo(page, 'personal.has_referring_clinic', 'yes');
    const clinicName = page.locator('#personal\\.clinic_name');
    await expect(clinicName).toBeVisible();
    await clinicName.fill('Springfield Dermatology');
    await expect(clinicName).toHaveValue('Springfield Dermatology');

    // Flip gate to No. RevealOnTrigger animates the children out (200ms
    // exit) and then unmounts them; the wizard's onChange runs
    // `applyRevealClears` synchronously and zeroes `clinic_name`.
    await pickYesNo(page, 'personal.has_referring_clinic', 'no');

    // The clinic-group leaves the DOM. Wait for the unmount to settle.
    await expect(page.locator('.consultation-clinic-group')).toHaveCount(0);

    // Flip back to Yes — the input remounts. Because applyRevealClears
    // wiped the value when the gate flipped to No, the remounted input
    // must be empty (NOT "Springfield Dermatology").
    await pickYesNo(page, 'personal.has_referring_clinic', 'yes');
    const clinicNameAfter = page.locator('#personal\\.clinic_name');
    await expect(clinicNameAfter).toBeVisible();
    await expect(clinicNameAfter).toHaveValue('');
  });

  test('Step 2: alcohol section shows "Drinks per week" sub-label and the "1 drink ≈ ..." helper when revealed', async ({
    page,
  }) => {
    await page.goto('/consultation/step-1');
    await expectOnStep(page, 1);
    await fillStep1Required(page);
    await clickNext(page);
    await expectOnStep(page, 2);

    // The alcohol stepper is gated on lifestyle.alcohol === true. Click
    // "Yes" under "Do you drink alcohol?" to reveal it.
    await pickYesNo(page, 'lifestyle.alcohol', 'yes');

    // Sub-label uses the new "Drinks per week" copy (NOT "alcohol units
    // per week"). Anchor on the helper id mounted by Step2Lifestyle so we
    // don't pick up unrelated matches elsewhere on the page.
    const alcoholHelp = page.locator('#lifestyle-alcohol-help');
    await expect(alcoholHelp).toBeVisible();
    await expect(alcoholHelp).toHaveText(
      /1 drink\s*≈\s*12oz beer\s*\/\s*5oz wine\s*\/\s*1\.5oz spirits/i,
    );

    // The new "Drinks per week" sub-label is present and adjacent to the
    // Stepper. Use a sibling-search anchored on the helper to avoid
    // collisions if other "Drinks" copy ever lands on the page.
    const stepperField = page.locator('.consultation-stepper-field').filter({ has: alcoholHelp });
    await expect(stepperField).toBeVisible();
    await expect(stepperField.locator('.consultation-sub-label').first()).toHaveText(
      /Drinks per week/i,
    );

    // Defensive: the legacy "alcohol units per week" copy must NOT
    // appear inside the alcohol stepper field.
    const stepperText = (await stepperField.textContent()) ?? '';
    expect(stepperText).not.toMatch(/units per week/i);

    // The Stepper inside this field renders the new "drinks" suffix so
    // the unit is meaningful next to the number. The suffix is rendered
    // inside `.consultation-stepper-suffix` with a leading space (see
    // `src/shared/ui/forms/Stepper.tsx`), so we anchor on the class and
    // assert the trimmed text equals "drinks".
    const alcoholSuffix = stepperField.locator('.consultation-stepper-suffix').first();
    await expect(alcoholSuffix).toBeVisible();
    expect(((await alcoholSuffix.textContent()) ?? '').trim()).toBe('drinks');
  });

  test('Step 2: cigarettes section shows the pack-equivalence helper ("1 pack = 20 cigarettes") and a "cigarettes" Stepper suffix', async ({
    page,
  }) => {
    await page.goto('/consultation/step-1');
    await expectOnStep(page, 1);
    await fillStep1Required(page);
    await clickNext(page);
    await expectOnStep(page, 2);

    // Reveal the smoke stepper.
    await pickYesNo(page, 'lifestyle.smoke', 'yes');

    // Helper id is `lifestyle-smoke-help` — text contains the
    // pack-equivalence string per the chunk's brief.
    const smokeHelp = page.locator('#lifestyle-smoke-help');
    await expect(smokeHelp).toBeVisible();
    await expect(smokeHelp).toHaveText(/1 pack\s*=\s*20 cigarettes/i);

    // Sub-label still reads "Cigarettes per day" (per the brief: keep
    // the label, add the helper + suffix).
    const stepperField = page.locator('.consultation-stepper-field').filter({ has: smokeHelp });
    await expect(stepperField).toBeVisible();
    await expect(stepperField.locator('.consultation-sub-label').first()).toHaveText(
      /Cigarettes per day/i,
    );

    // Stepper suffix renders "cigarettes" (the unit is meaningful). The
    // suffix is rendered inside `.consultation-stepper-suffix` with a
    // leading space (see `src/shared/ui/forms/Stepper.tsx`), so anchor
    // on the class and assert the trimmed text equals "cigarettes".
    const smokeSuffix = stepperField.locator('.consultation-stepper-suffix').first();
    await expect(smokeSuffix).toBeVisible();
    expect(((await smokeSuffix.textContent()) ?? '').trim()).toBe('cigarettes');
  });
});
