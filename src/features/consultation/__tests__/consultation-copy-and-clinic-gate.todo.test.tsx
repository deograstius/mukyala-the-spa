/**
 * Tests for chunk `consultation-copy-and-clinic-gate-2026-04-26`.
 *
 * Tester pass — promoted from architect's `it.todo`/`test.todo` placeholders to
 * real assertions. The file name is kept as `*.todo.test.tsx` to match the
 * conveyor's existing pattern (architect stubs → tester promotes).
 *
 * Coverage map (3 chunk items × the operator's verbatim brief):
 *
 *   1) Step 1 referring-clinic gate
 *      - The clinic_* inputs MUST NOT be in the DOM until the user answers
 *        "Yes" to "Were you referred by a clinic?" (default: hidden).
 *      - Even when revealed, the three clinic_* inputs are OPTIONAL: the
 *        REQUIRED_FIELDS_BY_STEP['step-1'] list does NOT include them, and
 *        the rendered inputs carry no `required` attribute.
 *      - Toggling the gate Yes -> No clears any text the user typed in the
 *        clinic_* fields (verifies applyRevealClears wiring).
 *
 *   2) Step 2 alcohol copy
 *      - The visible label is "Drinks per week" (NOT the legacy "Units per
 *        week").
 *      - The helper "1 drink ≈ 12oz beer / 5oz wine / 1.5oz spirits" is
 *        rendered next to the stepper.
 *      - The Stepper still emits stringified integers (wire format unchanged).
 *
 *   3) Step 2 cigarettes copy
 *      - A "1 pack = 20 cigarettes" helper is rendered directly below the
 *        "Cigarettes per day" label.
 *      - The Stepper suffix is "cigarettes" (so the value reads e.g.
 *        "5 cigarettes" — meaningful unit).
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, test } from 'vitest';
import Step1Personal from '../Step1Personal';
import Step2Lifestyle from '../Step2Lifestyle';
import {
  applyRevealClears,
  CONDITIONAL_REVEALS,
  createEmptyDraft,
  flattenDraftForSubmit,
  isRevealed,
  PERSONAL_FIELDS,
  REQUIRED_FIELDS_BY_STEP,
  type ConsultationDraft,
} from '../schema';

// ---------------------------------------------------------------------------
// Stateful harness — applies applyRevealClears the way Consultation.tsx does
// (see pages/Consultation.tsx::handleDraftChange). This lets us drive the
// Step1Personal component end-to-end without spinning up the full wizard.
// ---------------------------------------------------------------------------

function Step1Harness({ initial }: { initial?: ConsultationDraft } = {}) {
  const [draft, setDraft] = useState<ConsultationDraft>(initial ?? createEmptyDraft());
  return (
    <Step1Personal
      draft={draft}
      onChange={(next) => setDraft((prev) => applyRevealClears(prev, next))}
      errors={{}}
    />
  );
}

// ---------------------------------------------------------------------------
// Item 1 — referring-clinic gate behaviour
// ---------------------------------------------------------------------------

describe('Step 1 referring-clinic gate', () => {
  it('hides the clinic_name / clinic_address / clinic_phone inputs by default (gate is null)', () => {
    const { container } = render(<Step1Harness />);
    expect(container.querySelector('[name="personal.clinic_name"]')).toBeNull();
    expect(container.querySelector('[name="personal.clinic_address"]')).toBeNull();
    expect(container.querySelector('[name="personal.clinic_phone"]')).toBeNull();
    // The Yes/No gate itself MUST be visible.
    expect(screen.getByText(/were you referred by a clinic\?/i)).toBeTruthy();
  });

  it('reveals all three clinic_* inputs after the user answers "Yes" to "Were you referred by a clinic?"', () => {
    const { container } = render(<Step1Harness />);
    // Click the Yes radio for the gate (id is `personal-has_referring_clinic-yes`).
    const yes = container.querySelector(
      'input[name="personal.has_referring_clinic"][value="yes"]',
    ) as HTMLInputElement | null;
    expect(yes, 'Yes radio for the clinic gate must be present').not.toBeNull();
    fireEvent.click(yes!);

    expect(container.querySelector('[name="personal.clinic_name"]')).not.toBeNull();
    expect(container.querySelector('[name="personal.clinic_address"]')).not.toBeNull();
    expect(container.querySelector('[name="personal.clinic_phone"]')).not.toBeNull();
  });

  it('keeps the clinic_* inputs hidden after the user answers "No" (and they were never visible)', () => {
    const { container } = render(<Step1Harness />);
    const no = container.querySelector(
      'input[name="personal.has_referring_clinic"][value="no"]',
    ) as HTMLInputElement | null;
    expect(no).not.toBeNull();
    fireEvent.click(no!);

    expect(container.querySelector('[name="personal.clinic_name"]')).toBeNull();
    expect(container.querySelector('[name="personal.clinic_address"]')).toBeNull();
    expect(container.querySelector('[name="personal.clinic_phone"]')).toBeNull();
  });

  it('marks revealed clinic_* inputs as OPTIONAL (no required attribute, not in REQUIRED_FIELDS_BY_STEP)', () => {
    // 1. Schema-level invariant: the static required-field map for step-1 must
    //    NOT include any clinic_* path. (The has_referring_clinic gate must
    //    also stay out — it is UI-only.)
    for (const required of REQUIRED_FIELDS_BY_STEP['step-1']) {
      expect(required).not.toMatch(/^personal\.clinic_/);
      expect(required).not.toBe('personal.has_referring_clinic');
    }

    // 2. Rendered DOM: when the gate is Yes, the three clinic_* inputs must
    //    not carry the HTML `required` attribute (optional per MD §4).
    const initial = createEmptyDraft();
    initial.personal.has_referring_clinic = true;
    const { container } = render(<Step1Harness initial={initial} />);
    for (const name of [
      'personal.clinic_name',
      'personal.clinic_address',
      'personal.clinic_phone',
    ]) {
      const el = container.querySelector(`[name="${name}"]`) as HTMLInputElement | null;
      expect(el, `${name} must render when gate=true`).not.toBeNull();
      expect(el!.required).toBe(false);
      expect(el!.hasAttribute('required')).toBe(false);
    }
  });

  it('clears clinic_name / clinic_address / clinic_phone when the user flips the gate Yes -> No (applyRevealClears wiring)', () => {
    const { container } = render(<Step1Harness />);
    // Open the gate.
    fireEvent.click(
      container.querySelector('input[name="personal.has_referring_clinic"][value="yes"]')!,
    );

    // Type into the now-revealed clinic_* fields.
    const nameInput = container.querySelector('[name="personal.clinic_name"]') as HTMLInputElement;
    const addrInput = container.querySelector(
      '[name="personal.clinic_address"]',
    ) as HTMLInputElement;
    const phoneInput = container.querySelector(
      '[name="personal.clinic_phone"]',
    ) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Acme Derm Clinic' } });
    fireEvent.change(addrInput, { target: { value: '1 Main St' } });
    fireEvent.change(phoneInput, { target: { value: '5551234567' } });

    expect(
      (container.querySelector('[name="personal.clinic_name"]') as HTMLInputElement).value,
    ).toBe('Acme Derm Clinic');

    // Flip the gate to No — applyRevealClears (wired into the harness's
    // onChange) must zero the three clinic_* values. The reveal animation
    // unmounts after EXIT_MS (~200ms); the values themselves clear
    // immediately, so we verify by re-opening the gate and confirming the
    // inputs come back EMPTY.
    fireEvent.click(
      container.querySelector('input[name="personal.has_referring_clinic"][value="no"]')!,
    );
    fireEvent.click(
      container.querySelector('input[name="personal.has_referring_clinic"][value="yes"]')!,
    );

    expect(
      (container.querySelector('[name="personal.clinic_name"]') as HTMLInputElement).value,
    ).toBe('');
    expect(
      (container.querySelector('[name="personal.clinic_address"]') as HTMLInputElement).value,
    ).toBe('');
    expect(
      (container.querySelector('[name="personal.clinic_phone"]') as HTMLInputElement).value,
    ).toBe('');
  });

  it('does NOT include personal.has_referring_clinic in flattenDraftForSubmit output (wire format unchanged)', () => {
    const draft = createEmptyDraft();
    draft.personal.has_referring_clinic = true;
    draft.personal.clinic_name = 'Visible Clinic';
    const wire = flattenDraftForSubmit(draft);

    // The UI-only gate must NOT leak into the wire payload.
    expect(Object.prototype.hasOwnProperty.call(wire, 'personal.has_referring_clinic')).toBe(false);
    // PERSONAL_FIELDS itself excludes the gate.
    expect(PERSONAL_FIELDS as readonly string[]).not.toContain('personal.has_referring_clinic');
    // The three optional clinic_* fields ARE on the wire (they always have
    // been; the gate only controls UI visibility).
    expect(wire['personal.clinic_name']).toBe('Visible Clinic');
    expect(wire['personal.clinic_address']).toBe('');
    expect(wire['personal.clinic_phone']).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Item 2 — alcohol copy + helper
// ---------------------------------------------------------------------------

describe('Step 2 alcohol — human copy', () => {
  it('renders the visible label "Drinks per week" (not "Units per week") when the alcohol gate is Yes', () => {
    const draft = createEmptyDraft();
    draft.lifestyle.alcohol = true;
    const { container } = render(<Step2Lifestyle draft={draft} onChange={() => {}} errors={{}} />);

    const stepper = container.querySelector(
      '[role="spinbutton"][data-name="lifestyle.alcohol_units_per_week"]',
    );
    expect(stepper).not.toBeNull();
    const wrapper = stepper!.closest('.consultation-stepper-field') as HTMLElement;
    const subLabel = wrapper.querySelector('.consultation-sub-label');
    expect(subLabel?.textContent?.trim()).toBe('Drinks per week');
    // Negative assertion: the legacy "Units per week" copy must be gone.
    expect(subLabel?.textContent ?? '').not.toMatch(/units per week/i);
    // Spinbutton aria-label also reflects the new copy.
    expect((stepper as HTMLElement).getAttribute('aria-label')).toBe('Drinks per week');
  });

  it('renders the helper text "1 drink ≈ 12oz beer / 5oz wine / 1.5oz spirits" alongside the stepper', () => {
    const draft = createEmptyDraft();
    draft.lifestyle.alcohol = true;
    const { container } = render(<Step2Lifestyle draft={draft} onChange={() => {}} errors={{}} />);

    const stepper = container.querySelector(
      '[role="spinbutton"][data-name="lifestyle.alcohol_units_per_week"]',
    )!;
    const wrapper = stepper.closest('.consultation-stepper-field') as HTMLElement;
    const helper = within(wrapper).getByText(
      /1 drink\s*≈\s*12oz beer\s*\/\s*5oz wine\s*\/\s*1\.5oz spirits/i,
    );
    expect(helper).toBeTruthy();
    // And the stepper carries a "drinks" suffix so the value reads e.g.
    // "5 drinks" — meaningful unit.
    expect(within(wrapper).getByText('drinks')).toBeTruthy();
  });

  it('keeps the wire field name lifestyle.alcohol_units_per_week and stringified-int value contract intact', () => {
    // Wire-format invariant: the field name must remain in LIFESTYLE_FIELDS
    // and flattenDraftForSubmit must round-trip the stringified int.
    const draft = createEmptyDraft();
    draft.lifestyle.alcohol = true;
    draft.lifestyle.alcohol_units_per_week = '7';
    const wire = flattenDraftForSubmit(draft);
    expect(wire['lifestyle.alcohol_units_per_week']).toBe('7');
    expect(typeof wire['lifestyle.alcohol_units_per_week']).toBe('string');

    // And the rendered stepper still emits a stringified int via onChange.
    let captured: ConsultationDraft | null = null;
    const { container } = render(
      <Step2Lifestyle
        draft={draft}
        onChange={(next) => {
          captured = next;
        }}
        errors={{}}
      />,
    );
    const plus = container.querySelector(
      '[data-name="lifestyle.alcohol_units_per_week"] button[aria-label^="Increase"]',
    ) as HTMLButtonElement;
    expect(plus).not.toBeNull();
    fireEvent.click(plus);
    expect(captured).not.toBeNull();
    expect(typeof captured!.lifestyle.alcohol_units_per_week).toBe('string');
    expect(captured!.lifestyle.alcohol_units_per_week).toBe('8'); // 7 + 1
  });
});

// ---------------------------------------------------------------------------
// Item 3 — cigarettes copy + helper
// ---------------------------------------------------------------------------

describe('Step 2 cigarettes — meaningful unit', () => {
  it('renders the helper text explaining the unit ("1 pack = 20 cigarettes")', () => {
    const draft = createEmptyDraft();
    draft.lifestyle.smoke = true;
    const { container } = render(<Step2Lifestyle draft={draft} onChange={() => {}} errors={{}} />);

    const stepper = container.querySelector(
      '[role="spinbutton"][data-name="lifestyle.smoke_per_day"]',
    )!;
    const wrapper = stepper.closest('.consultation-stepper-field') as HTMLElement;

    // The visible label is unchanged ("Cigarettes per day").
    const subLabel = wrapper.querySelector('.consultation-sub-label');
    expect(subLabel?.textContent?.trim()).toBe('Cigarettes per day');

    // The new pack-equivalence helper is rendered next to the stepper.
    const helper = within(wrapper).getByText(/1 pack\s*=\s*20 cigarettes/i);
    expect(helper).toBeTruthy();
  });

  it('renders the Stepper with suffix "cigarettes" so the value reads e.g. "5 cigarettes"', () => {
    const draft = createEmptyDraft();
    draft.lifestyle.smoke = true;
    draft.lifestyle.smoke_per_day = '5';
    const { container } = render(<Step2Lifestyle draft={draft} onChange={() => {}} errors={{}} />);

    const stepper = container.querySelector(
      '[role="spinbutton"][data-name="lifestyle.smoke_per_day"]',
    ) as HTMLElement;
    expect(stepper).not.toBeNull();
    // The value display includes "5" plus the suffix "cigarettes".
    const output = stepper.querySelector('output');
    expect(output).not.toBeNull();
    expect(output!.textContent ?? '').toMatch(/5/);
    expect(output!.textContent ?? '').toMatch(/cigarettes/i);
    // aria-label on the spinbutton remains "Cigarettes per day".
    expect(stepper.getAttribute('aria-label')).toBe('Cigarettes per day');
  });
});

// ---------------------------------------------------------------------------
// Cross-cutting suite-level invariants.
// ---------------------------------------------------------------------------

describe('schema invariants for the chunk', () => {
  test('CONDITIONAL_REVEALS["personal.referring_clinic_group"] is true iff personal.has_referring_clinic === true', () => {
    const predicate = CONDITIONAL_REVEALS['personal.referring_clinic_group'];
    expect(predicate).toBeTypeOf('function');

    const draft = createEmptyDraft();

    // null (default) -> hidden
    draft.personal.has_referring_clinic = null;
    expect(predicate(draft)).toBe(false);
    expect(isRevealed('personal.referring_clinic_group', draft)).toBe(false);

    // false -> hidden
    draft.personal.has_referring_clinic = false;
    expect(predicate(draft)).toBe(false);
    expect(isRevealed('personal.referring_clinic_group', draft)).toBe(false);

    // true -> visible (and ONLY true)
    draft.personal.has_referring_clinic = true;
    expect(predicate(draft)).toBe(true);
    expect(isRevealed('personal.referring_clinic_group', draft)).toBe(true);
  });

  test('applyRevealClears zeroes clinic_name/address/phone when personal.has_referring_clinic flips true -> false', () => {
    const prev = createEmptyDraft();
    prev.personal.has_referring_clinic = true;
    prev.personal.clinic_name = 'Visible Clinic';
    prev.personal.clinic_address = '1 Main St';
    prev.personal.clinic_phone = '5551234567';

    const next: ConsultationDraft = {
      ...prev,
      personal: {
        ...prev.personal,
        has_referring_clinic: false,
        // Hostile-input case: the next draft still carries text in the
        // clinic_* fields. applyRevealClears must zero them.
      },
    };

    const cleared = applyRevealClears(prev, next);
    expect(cleared.personal.clinic_name).toBe('');
    expect(cleared.personal.clinic_address).toBe('');
    expect(cleared.personal.clinic_phone).toBe('');
    // The gate itself is preserved (so the form remembers the user said no).
    expect(cleared.personal.has_referring_clinic).toBe(false);
  });

  test('applyRevealClears does NOT clear clinic_* on no-op (gate stays true)', () => {
    const prev = createEmptyDraft();
    prev.personal.has_referring_clinic = true;
    prev.personal.clinic_name = 'Keep Me';

    const next: ConsultationDraft = {
      ...prev,
      personal: {
        ...prev.personal,
        clinic_address: '123 New Address',
      },
    };

    const out = applyRevealClears(prev, next);
    expect(out.personal.clinic_name).toBe('Keep Me');
    expect(out.personal.clinic_address).toBe('123 New Address');
  });

  test('copy items 2 and 3 do not change REQUIRED_FIELDS_BY_STEP["step-2"] (still empty base set)', () => {
    expect(REQUIRED_FIELDS_BY_STEP['step-2']).toEqual([]);
  });
});
