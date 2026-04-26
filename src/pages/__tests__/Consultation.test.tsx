/**
 * Consultation wizard test placeholders for chunk `spa-consultation-form-v1`.
 *
 * Architect intentionally leaves only `it.todo` markers — the tester stage
 * fills these in once the implementer wires real field-level behavior.
 *
 * Why this file exists:
 *   - Pin the test surface so the tester knows which behaviors must be
 *     covered without re-deriving them from the spec.
 *   - Stay non-failing in CI right now (it.todo never executes a body).
 */

import { describe, it } from 'vitest';

describe('Consultation wizard (Form 1 / intake)', () => {
  // Tester stage implements these. All references are MD §
  // section numbers in `mukyala-client-forms-MASTER.md`.

  it.todo('renders Step 1 by default at /consultation/step-1 (MD §7)');

  it.todo('shows the Step 1 positioning headline + subhead + trust badges (MD §18.1)');

  it.todo('disables Next on Step 1 until all required personal fields validate (MD §4)');

  it.todo(
    'reveals lifestyle.exercise_frequency when lifestyle.exercise === true and clears it on flip-false (MD §5)',
  );

  it.todo('reveals lifestyle.alcohol_units_per_week when lifestyle.alcohol === true (MD §5)');

  it.todo('reveals lifestyle.smoke_per_day when lifestyle.smoke === true (MD §5)');

  it.todo('reveals lifestyle.caffeine_per_day when lifestyle.caffeine === true (MD §5)');

  it.todo('reveals health.medications_list when health.taking_medications === true (MD §5)');

  it.todo(
    'reveals health.medication_allergy_type when health.medication_allergies === true (MD §5)',
  );

  it.todo('reveals health.other_allergies_notes when health.cosmetic_allergies === true (MD §5)');

  it.todo(
    'reveals health.diabetes_type when health.diabetes === true and validates type_1|type_2 (MD §5)',
  );

  it.todo('requires every health.* boolean before Next on Step 4 (MD §4)');

  it.todo(
    'skips Step 5 seamlessly when females_only.applicable !== true and labels it "Skipped" in the progress indicator (MD §7)',
  );

  it.todo('shows females_only.* fields when females_only.applicable === true (MD §5)');

  it.todo(
    'renders the Step 4 reassurance copy "We ask about your health to keep your skin safe..." (MD §18.2)',
  );

  it.todo(
    'renders the Step 6 reassurance copy "Your signature confirms the info above is accurate. It does not authorize any treatment or charge." (MD §18.2)',
  );

  it.todo(
    'submit button reads exactly "Send My Consultation Request" (operator-confirmed copy + MD §18.3)',
  );

  it.todo(
    'requires signature.print_name + signature.attested === true + signature.date before submit (MD §6, §9)',
  );

  it.todo(
    'POSTs to /v1/consultations with form_id=intake, payload, signatures: [{ method: "typed", ... }] (MD §11)',
  );

  it.todo(
    'on 200 success swaps to SuccessPanel with submission_id reference number and clears the localStorage draft (MD §16, §19.1)',
  );

  it.todo(
    'success panel SLA copy reads "We\'ll respond within 2 business days." (operator-confirmed)',
  );

  it.todo('success panel renders the 3-step "What happens next" expectation list (MD §18.4)');

  it.todo(
    'persists in-progress draft to localStorage under mukyala.forms.draft.intake.<client_session_id> debounced 500ms (MD §8)',
  );

  it.todo(
    'on remount with a saved draft within 30-day TTL prompts "Resume your saved draft from <relative-time>?" (MD §8)',
  );

  it.todo('expires drafts older than 30 days on load (MD §8)');

  it.todo('browser-back moves between steps without losing draft state (MD §7)');

  it.todo(
    'deep link to /consultation/step-N with unmet prerequisites redirects to earliest incomplete step (MD §7)',
  );

  it.todo(
    'emits consultation_form_view, consultation_step_advance, consultation_field_completed, consultation_submit_clicked, consultation_submit_succeeded telemetry without leaking field values (MD §17)',
  );

  it.todo('does NOT render an 18+ gate (operator scope decision)');

  it.todo(
    'does NOT render a photo upload (operator scope decision; photo flow is Form 2 staff-only)',
  );

  it.todo(
    'does NOT render a marketing-opt-in checkbox (the form itself is the opt-in for the prognosis email)',
  );
});
