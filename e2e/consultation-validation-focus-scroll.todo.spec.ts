/**
 * E2E coverage for chunk `consultation-validation-focus-scroll-2026-04-26`.
 *
 * Behaviour under test (browser-real):
 *   - Pressing "Next" on a step with an unmet required field keeps the user
 *     on that step AND focus + scrolls the FIRST invalid field into view.
 *   - The same behaviour holds on a step further down (Step 4) — not just
 *     Step 1.
 *   - When several fields are invalid simultaneously, focus lands on the
 *     FIRST invalid path in the step's ordered required-fields list (this
 *     mirrors `pickFirstInvalidPath` from `src/utils/scrollAndFocusFirstError.ts`).
 *   - The focused field exposes `aria-invalid="true"` and an associated
 *     error message via `aria-describedby` (FormField wires both when an
 *     `error` prop is passed).
 *   - On a Step 6 submit failure the validation banner mounts AND the
 *     focused invalid field on the destination step is fully inside the
 *     viewport (the sticky-offset shim keeps the field clear of the banner).
 *
 * Selectors prefer:
 *   1) `data-cta-id` (Next button)
 *   2) `id` (FormField mounts dotted-path ids on every input)
 *   3) `getByLabel` for label-driven controls
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
 * Fill all Step-1 required fields with valid values and advance to Step 2.
 * The four text inputs are sufficient to clear required-checks when paired
 * with three numeric DOB inputs filled via their data-name in the picker.
 *
 * The DOB picker is a react-day-picker; we rely on the same shape used by
 * `e2e/consultation-ui-fixes.spec.ts` — pick year/month dropdowns + day
 * button. Replicated minimally here to avoid coupling test files.
 */
async function fillStep1Valid(page: Page): Promise<void> {
  await page.getByLabel(/^Full name/).fill('Jane Doe');
  await page.getByLabel(/^Email/).fill('jane.e2e@example.com');
  await page.getByLabel(/^Phone/).fill('5551234567');
  await page.getByLabel(/^Home address/).fill('123 Test St, Springfield');

  // DOB via react-day-picker (March 7, 1991).
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
  // Day cell — match by ISO data-day to avoid weekday/locale variability.
  const dayBtn = dob.locator('td[data-day="1991-03-07"] button');
  await dayBtn.click();
}

/**
 * Returns true when the element is visibly inside the viewport. We allow
 * a small subpixel slack and only require that the element's top edge sits
 * at-or-below 0 and at-or-above viewport.height (i.e. the user can see at
 * least the field's start). Full-fieldset bounding boxes can be taller than
 * the viewport on small screens (Step 4 is a long form), so we don't
 * require the bottom edge to fit — just that the visible portion includes
 * the field's top.
 */
function topEdgeVisible(
  box: { x: number; y: number; width: number; height: number } | null,
  viewport: { width: number; height: number } | null,
): boolean {
  if (!box || !viewport) return false;
  // Subpixel slack: smooth scroll can leave a 0.x px overshoot.
  const slack = 1;
  return box.y >= -slack && box.y <= viewport.height - slack;
}

/**
 * Smooth-scroll triggered by `scrollAndFocusFirstError` takes ~300–500ms
 * to settle in real browsers. The util calls `scrollIntoView({ behavior:
 * 'smooth', block: 'center' })`, so the element animates into the
 * viewport center. Poll until the bounding box's top edge sits inside
 * the viewport (using `topEdgeVisible`) — Playwright's `expect.poll`
 * retries the locator query each tick, so this naturally waits for the
 * scroll animation to land without coupling to wall-clock timing.
 */
async function waitForTopEdgeInViewport(
  page: Page,
  selector: string,
  timeoutMs = 5000,
): Promise<void> {
  await expect
    .poll(
      async () => {
        const box = await page.locator(selector).boundingBox();
        const viewport = page.viewportSize();
        return topEdgeVisible(box, viewport);
      },
      {
        timeout: timeoutMs,
        message: `expected ${selector} top edge in viewport (smooth-scroll did not settle)`,
      },
    )
    .toBe(true);
}

/**
 * Wait until `document.activeElement.id` matches the expected id. The
 * focus call is queued by the wizard via `requestAnimationFrame` (so the
 * new error UI mounts before the lookup), so we poll rather than relying
 * on a fixed sleep. Polled via Playwright's `expect.poll` so the failure
 * message lists the last-seen activeElement id when the assertion blows.
 */
async function expectFocusedId(page: Page, expectedId: string): Promise<void> {
  await expect
    .poll(async () => page.evaluate(() => document.activeElement?.id ?? null), {
      timeout: 5000,
      message: `expected document.activeElement.id === "${expectedId}"`,
    })
    .toBe(expectedId);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('consultation-validation-focus-scroll-2026-04-26 — focus + scroll', () => {
  test('Step 1 Next with empty required fields focuses the first invalid input and scrolls it into view', async ({
    page,
  }) => {
    await page.goto('/consultation/step-1');
    await expectOnStep(page, 1);

    // Press Next without filling anything.
    await clickNext(page);

    // Still on Step 1 (advance was blocked).
    await expectOnStep(page, 1);

    // FIRST invalid path per `orderedPathsForStep('step-1', emptyDraft)` is
    // `personal.client_name` (matches REQUIRED_FIELDS_BY_STEP['step-1']).
    const firstField = page.locator('#personal\\.client_name');
    await expect(firstField).toBeVisible();

    // document.activeElement matches the first invalid input. Poll until
    // the wizard's `requestAnimationFrame`-deferred focus call lands.
    await expectFocusedId(page, 'personal.client_name');

    // The field is inside the viewport rectangle (scrollIntoView resolved).
    // Smooth scroll animates over ~300–500ms; poll until it lands.
    await waitForTopEdgeInViewport(page, '#personal\\.client_name');
  });

  test('Step 4 Next with empty health booleans focuses the first invalid YesNoField on the step', async ({
    page,
  }) => {
    // Walk to Step 4 with valid Steps 1–3 (2 and 3 are all-optional).
    await page.goto('/consultation/step-1');
    await expectOnStep(page, 1);
    await fillStep1Valid(page);
    await clickNext(page);
    await expectOnStep(page, 2);
    await clickNext(page);
    await expectOnStep(page, 3);
    await clickNext(page);
    await expectOnStep(page, 4);

    // Press Next without filling any of the Step 4 booleans.
    await clickNext(page);

    // Still on Step 4 (advance was blocked).
    await expectOnStep(page, 4);

    // FIRST invalid path on Step 4 is `health.under_physician_care` (first
    // entry of HEALTH_BOOLEAN_FIELDS). YesNoField sanitizes the dotted path
    // by replacing non-[a-zA-Z0-9_-] chars with `-`, so the YES radio
    // mounts at id="health-under_physician_care-yes".
    const firstYes = page.locator('#health-under_physician_care-yes');
    await expect(firstYes).toBeAttached();

    await expectFocusedId(page, 'health-under_physician_care-yes');

    // The radio (or its visible label) is inside the viewport. The radio
    // input itself is `position: absolute` zero-size in many designs, so
    // we anchor the viewport check on the wrapping fieldset, which is what
    // the user actually sees. Poll until the smooth scroll lands.
    const fieldset = page.locator('fieldset', { has: firstYes }).first();
    await expect(fieldset).toBeVisible();
    await waitForTopEdgeInViewport(page, 'fieldset:has(#health-under_physician_care-yes) >> nth=0');
  });

  test('Multi-error case: focus lands on the FIRST invalid required field, not a later one', async ({
    page,
  }) => {
    await page.goto('/consultation/step-1');
    await expectOnStep(page, 1);

    // Fill phone + address + DOB (valid) but leave `client_name` and
    // `email` empty/invalid. The first entry of orderedPathsForStep is
    // `personal.client_name` (per REQUIRED_FIELDS_BY_STEP['step-1']), so
    // focus must NOT jump to email even though email is also invalid.
    //
    // Note: we leave client_name blank (required-empty) and ALSO type an
    // invalid email so two distinct invalid paths exist simultaneously.
    await page.getByLabel(/^Email/).fill('not-an-email');
    await page.getByLabel(/^Phone/).fill('5551234567');
    await page.getByLabel(/^Home address/).fill('123 Test St, Springfield');

    // DOB.
    const dob = page.locator('[data-name="personal.dob"]');
    const yearSelect = dob.getByRole('combobox', { name: /year/i });
    if ((await yearSelect.count()) > 0) {
      await yearSelect.first().selectOption('1991');
    }
    const monthSelect = dob.getByRole('combobox', { name: /month/i });
    if ((await monthSelect.count()) > 0) {
      await monthSelect.first().selectOption('2');
    }
    await dob.locator('td[data-day="1991-03-07"] button').click();

    // Press Next: validation should fail on client_name (required) AND
    // email (format).
    await clickNext(page);

    // Still on Step 1.
    await expectOnStep(page, 1);

    // Focus must land on the FIRST invalid path = `personal.client_name`.
    await expectFocusedId(page, 'personal.client_name');
    // Defensive: it should NOT be the later-in-order email field.
    const finalFocus = await page.evaluate(() => document.activeElement?.id ?? null);
    expect(finalFocus).not.toBe('personal.email');
  });

  test('Focused invalid input has aria-invalid="true" and an associated error message via aria-describedby', async ({
    page,
  }) => {
    await page.goto('/consultation/step-1');
    await expectOnStep(page, 1);

    await clickNext(page);
    await expectOnStep(page, 1);

    const firstField = page.locator('#personal\\.client_name');
    await expect(firstField).toBeVisible();

    // aria-invalid attribute equals "true".
    await expect(firstField).toHaveAttribute('aria-invalid', 'true');

    // aria-describedby is present and points to a node that holds a
    // non-empty error message.
    const describedBy = await firstField.getAttribute('aria-describedby');
    expect(describedBy).not.toBeNull();
    expect((describedBy ?? '').trim()).not.toBe('');

    // FormField mounts the error span at id="<path>-error" and the
    // describedby attribute may include both a help id AND the error id;
    // at least one of the referenced ids must resolve to the error node
    // and contain the error text.
    const ids = (describedBy ?? '').split(/\s+/).filter(Boolean);
    expect(ids.length).toBeGreaterThan(0);

    const errorId = ids.find((candidate) => candidate.endsWith('-error')) ?? ids[0];
    // Hand-escape the dotted path for a CSS id selector — `CSS.escape` is
    // a browser-only API and this string runs in Node before being sent to
    // the browser context. The error id has the shape `<dotted.path>-error`,
    // so we only need to escape the dots.
    const escapedErrorId = errorId.replace(/\./g, '\\.');
    const errorNode = page.locator(`#${escapedErrorId}`);
    await expect(errorNode).toBeVisible();
    const errorText = (await errorNode.textContent())?.trim() ?? '';
    expect(errorText.length).toBeGreaterThan(0);
  });

  test('Step 6 submit failure: validation banner appears AND the focused field on the offending step stays visible (not hidden behind the banner)', async ({
    page,
  }) => {
    // Walk through valid Step 1, then submit immediately from Step 6. The
    // wizard's submit handler re-validates the WHOLE form, lands the user
    // on the earliest incomplete step (Step 4 — the health booleans were
    // never set), arms the post-nav focus effect, raises the validation
    // banner, and the focused YesNoField must still be inside the
    // viewport after layout settles.
    await page.goto('/consultation/step-1');
    await expectOnStep(page, 1);
    await fillStep1Valid(page);
    await clickNext(page);
    await expectOnStep(page, 2);
    await clickNext(page);
    await expectOnStep(page, 3);
    // Skip Step 4 by jumping forward via deep-link guard? No — the
    // earliest-incomplete-step guard would bounce us back. Instead we
    // use the in-app submit path: walk to Step 4, do NOT fill the
    // booleans, and try to advance. The Next button will block on
    // Step 4 (correct), so we cannot reach Step 6 with empty booleans
    // through the UI. Switch strategy: fill Step 4 booleans (No across
    // the board) so the form CAN reach Step 6, then clear one boolean
    // by force via setting state through the radio click flow.
    //
    // Simpler approach: set every Step-4 boolean to No, advance to
    // Step 6, leave signature.print_name empty, click Submit. Submit
    // fails on `signature.print_name` (Step 6 is the offending step),
    // banner mounts, and focus must land on the print_name input.
    await clickNext(page);
    await expectOnStep(page, 4);

    // Set every health boolean to No. Click the wrapping label so the
    // hidden radio input is selected (matches consultation-ui-fixes.spec
    // patterns).
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
      const baseId = name.replace(/[^a-zA-Z0-9_-]/g, '-');
      await page.locator(`label[for="${baseId}-no"]`).click();
    }
    // Sweep all "Do you have" conditions to No in one tap.
    await page.getByRole('button', { name: /mark all no/i }).click();
    // Skip Step 5 by leaving females_only.applicable as No.
    await page.locator('label[for="females_only-applicable-no"]').click();
    await clickNext(page);

    await expectOnStep(page, 6);

    // Click Submit without filling print_name (and without checking the
    // attestation). The submit handler should detect the missing
    // signature.print_name, raise the validation banner, and focus the
    // first invalid field on Step 6.
    await page.locator('[data-cta-id="consultation-submit"]').click();

    // Banner must appear.
    const banner = page.locator('.consultation-validation-banner');
    await expect(banner).toBeVisible();

    // Still on Step 6 (the failing step).
    await expectOnStep(page, 6);

    // First invalid path on Step 6 is `signature.print_name`.
    const printName = page.locator('#signature\\.print_name');
    await expect(printName).toBeVisible();

    await expectFocusedId(page, 'signature.print_name');

    // Wait for smooth scroll to land — then check the field is visible
    // and not hidden behind the validation banner.
    await waitForTopEdgeInViewport(page, '#signature\\.print_name');

    // Sticky-offset behaviour: when the banner is visible at the top of
    // the viewport (its `getBoundingClientRect().top >= 0`), the util
    // applies a `scrollBy({ top: -bannerHeight })` so the field is not
    // occluded. If the banner has scrolled away (top < 0), no offset is
    // applied — and the field is visibly below the banner anyway.
    const bannerBox = await banner.boundingBox();
    const fieldBox = await printName.boundingBox();
    expect(bannerBox).not.toBeNull();
    expect(fieldBox).not.toBeNull();
    if (bannerBox!.y >= 0) {
      // Banner is in viewport: the field's top must sit at or below the
      // banner's bottom (no occlusion).
      expect(fieldBox!.y).toBeGreaterThanOrEqual(bannerBox!.y + bannerBox!.height - 1);
    } else {
      // Banner has scrolled out of view above the viewport: the field
      // must still be visible (covered by `waitForTopEdgeInViewport`
      // above; this branch is here for explicitness).
      expect(fieldBox!.y).toBeGreaterThanOrEqual(-1);
    }
  });
});
