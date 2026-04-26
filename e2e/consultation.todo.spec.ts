/**
 * E2E placeholders for the consultation wizard (Form 1 / `intake`),
 * chunk `spa-consultation-form-v1`.
 *
 * Architect-only stubs: every test is `.fixme` so Playwright reports them
 * as expected to fail / skipped without breaking CI. The e2e agent fills
 * in real assertions once the implementer wires field-level behavior.
 *
 * Naming: `*.todo.spec.ts` mirrors the existing pattern
 *         (e.g. `manage-notifications-compliance.todo.spec.ts`).
 */

import { test } from '@playwright/test';

test.describe('Consultation wizard — happy path (TODO)', () => {
  test.fixme('navigates /consultation → /consultation/step-1', async () => {
    // TODO(architect): e2e agent visits /consultation and asserts redirect
    // to /consultation/step-1 + presence of the Step 1 headline copy
    // ("Your Free Mukyala Skin Consultation", MD §18.1).
  });

  test.fixme(
    'fills Step 1 → Step 6, signs typed-name + attest, and submits successfully',
    async () => {
      // TODO(architect): e2e agent walks the full 6-step happy path with
      // females_only.applicable = false (so Step 5 is skipped) using a
      // mocked /v1/consultations endpoint that returns
      // { submission_id: "sub_e2e_test", received_at: <iso> }.
      //
      // Assertions to cover:
      //   - Submit button copy reads "Send My Consultation Request" (MD §18.3).
      //   - Success panel shows submission_id and the SLA copy "We'll respond
      //     within 2 business days." (operator-confirmed copy + MD §19.1).
      //   - localStorage `mukyala.forms.draft.intake.*` is cleared on success.
    },
  );

  test.fixme(
    'reveals lifestyle / health conditional fields and clears them on flip-false',
    async () => {
      // TODO(architect): e2e covers MD §5 reveals end-to-end (visible state
      // change in the DOM + value cleared after flipping the predicate).
    },
  );

  test.fixme('shows resume-draft prompt on second visit within 30-day TTL', async () => {
    // TODO(architect): seed localStorage with a draft, reload, assert the
    // prompt copy "Resume your saved draft from ..." (MD §8).
  });

  test.fixme(
    'deep-linking to /consultation/step-4 with empty draft redirects to step-1',
    async () => {
      // TODO(architect): MD §7 — direct nav to a future step with unmet
      // prerequisites must redirect to the earliest incomplete step.
    },
  );
});
