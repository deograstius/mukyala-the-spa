/**
 * Step 6 of the consultation wizard — Review & Sign.
 *
 * Source: MD §3.1 (`signature.*`) + §4 + §7 + §9 + §18 + §19.
 *
 * Operator decisions baked in for v1:
 *   - Signature variant: TYPED + ATTEST (no canvas, no third-party e-sign).
 *   - Submit button copy: "Send My Consultation Request" (MD §18.3).
 *   - SLA copy: "We'll respond within 2 business days." (chunk pin).
 *   - 3-step "What happens next" (MD §18.4) directly below the submit button.
 *
 * Scope discipline: NO photo upload, NO 18+ gate, NO marketing-opt-in.
 */

import DatePickerField from '@shared/ui/forms/DatePickerField';
import FormField from '@shared/ui/forms/FormField';
import InputField from '@shared/ui/forms/InputField';
// Bug A fix: use the local-time helpers so signature.date stays the
// calendar day the user actually clicked, regardless of their local
// timezone. `dateTripleToLocalIsoYmd` does pure string math (no Date
// round-trip), `isoYmdToDateTriple` is already pure-string and stays.
import {
  dateTripleToLocalIsoYmd,
  isoYmdToDateTriple,
} from '@shared/ui/forms/datePickerField.helpers';
import * as React from 'react';
import HealthReviewSummary from './HealthReviewSummary';
import {
  CONSULTATION_SLA_BUSINESS_DAYS,
  isRevealed,
  SKIN_CONCERN_OPTIONS,
  SKINCARE_PRODUCT_OPTIONS,
  type ConsultationDraft,
  type ConsultationStepId,
} from './schema';

export interface Step6ReviewSignProps {
  draft: ConsultationDraft;
  onChange: (next: ConsultationDraft) => void;
  errors: Partial<Record<string, string>>;
  onSubmit: () => void;
  onEditStep: (step: ConsultationStepId) => void;
  isSubmitting: boolean;
  submitError?: string | null;
}

function yesNoLabel(value: boolean | null): string {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return '—';
}

function textOrDash(value: string): string {
  return value.trim() ? value : '—';
}

function formatDob(year: string, month: string, day: string): string {
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const d = parseInt(day, 10);
  if (
    !Number.isFinite(y) ||
    !Number.isFinite(m) ||
    !Number.isFinite(d) ||
    y < 1900 ||
    m < 1 ||
    m > 12 ||
    d < 1 ||
    d > 31
  ) {
    return '—';
  }
  // Use UTC to avoid off-by-one when the local TZ shifts the date.
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export default function Step6ReviewSign({
  draft,
  onChange,
  errors,
  onSubmit,
  onEditStep,
  isSubmitting,
  submitError,
}: Step6ReviewSignProps) {
  const sig = draft.signature;
  const showFemales = isRevealed('females_only.step', draft);

  function setSig<K extends keyof ConsultationDraft['signature']>(
    key: K,
    value: ConsultationDraft['signature'][K],
  ) {
    onChange({ ...draft, signature: { ...sig, [key]: value } });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    onSubmit();
  }

  return (
    <form className="consultation-step consultation-step-6" onSubmit={handleSubmit} noValidate>
      <h2 className="display-7 semi-bold">Review and sign</h2>

      {/* MD §18.2 reassurance copy */}
      <p className="consultation-reassurance">
        Your signature confirms the info above is accurate. It does not authorize any treatment or
        charge.
      </p>

      {/* Review summary — section by section */}
      <section className="consultation-review-section">
        <header className="consultation-review-section-header">
          <h3 className="display-5 semi-bold">Personal information</h3>
          <button type="button" className="button-secondary" onClick={() => onEditStep('step-1')}>
            Edit
          </button>
        </header>
        <dl>
          <dt>Name</dt>
          <dd>{textOrDash(draft.personal.client_name)}</dd>
          <dt>Email</dt>
          <dd>{textOrDash(draft.personal.email)}</dd>
          <dt>Phone</dt>
          <dd>{textOrDash(draft.personal.phone)}</dd>
          <dt>Home address</dt>
          <dd>{textOrDash(draft.personal.home_address)}</dd>
          <dt>Date of birth</dt>
          <dd>
            {formatDob(draft.personal.dob_year, draft.personal.dob_month, draft.personal.dob_day)}
          </dd>
          <dt>Referred by a clinic</dt>
          <dd>{yesNoLabel(draft.personal.has_referring_clinic)}</dd>
          {isRevealed('personal.referring_clinic_group', draft) ? (
            <>
              <dt>Clinic name</dt>
              <dd>{textOrDash(draft.personal.clinic_name)}</dd>
              <dt>Clinic address</dt>
              <dd>{textOrDash(draft.personal.clinic_address)}</dd>
              <dt>Clinic phone</dt>
              <dd>{textOrDash(draft.personal.clinic_phone)}</dd>
            </>
          ) : null}
        </dl>
      </section>

      <section className="consultation-review-section">
        <header className="consultation-review-section-header">
          <h3 className="display-5 semi-bold">Lifestyle</h3>
          <button type="button" className="button-secondary" onClick={() => onEditStep('step-2')}>
            Edit
          </button>
        </header>
        <dl>
          <dt>Occupation</dt>
          <dd>{textOrDash(draft.lifestyle.occupation)}</dd>
          <dt>Stress level</dt>
          <dd>{textOrDash(draft.lifestyle.stress_level)}</dd>
          <dt>Exercise</dt>
          <dd>
            {yesNoLabel(draft.lifestyle.exercise)}
            {draft.lifestyle.exercise === true
              ? ` — ${textOrDash(draft.lifestyle.exercise_frequency)}`
              : ''}
          </dd>
          <dt>Alcohol</dt>
          <dd>
            {yesNoLabel(draft.lifestyle.alcohol)}
            {draft.lifestyle.alcohol === true
              ? ` — ${textOrDash(draft.lifestyle.alcohol_units_per_week)} drinks/week`
              : ''}
          </dd>
          <dt>Smoke</dt>
          <dd>
            {yesNoLabel(draft.lifestyle.smoke)}
            {draft.lifestyle.smoke === true
              ? ` — ${textOrDash(draft.lifestyle.smoke_per_day)}/day`
              : ''}
          </dd>
          <dt>Caffeine</dt>
          <dd>
            {yesNoLabel(draft.lifestyle.caffeine)}
            {draft.lifestyle.caffeine === true
              ? ` — ${textOrDash(draft.lifestyle.caffeine_per_day)}/day`
              : ''}
          </dd>
        </dl>
      </section>

      <section className="consultation-review-section">
        <header className="consultation-review-section-header">
          <h3 className="display-5 semi-bold">Skin concerns &amp; care</h3>
          <button type="button" className="button-secondary" onClick={() => onEditStep('step-3')}>
            Edit
          </button>
        </header>
        <dl>
          <dt>Skin concerns</dt>
          <dd>
            {draft.skin_concerns.selected.length
              ? draft.skin_concerns.selected
                  .filter((v) => SKIN_CONCERN_OPTIONS.includes(v))
                  .join(', ')
              : '—'}
          </dd>
          <dt>Goals</dt>
          <dd>{textOrDash(draft.skin_concerns.goals)}</dd>
          <dt>Products in routine</dt>
          <dd>
            {draft.skincare.products_used.length
              ? draft.skincare.products_used
                  .filter((v) => SKINCARE_PRODUCT_OPTIONS.includes(v))
                  .join(', ')
              : '—'}
          </dd>
        </dl>
      </section>

      <section className="consultation-review-section">
        <header className="consultation-review-section-header">
          <h3 className="display-5 semi-bold">Health</h3>
          <button type="button" className="button-secondary" onClick={() => onEditStep('step-4')}>
            Edit
          </button>
        </header>
        <HealthReviewSummary draft={draft} />
      </section>

      {showFemales ? (
        <section className="consultation-review-section">
          <header className="consultation-review-section-header">
            <h3 className="display-5 semi-bold">Pregnancy questions</h3>
            <button type="button" className="button-secondary" onClick={() => onEditStep('step-5')}>
              Edit
            </button>
          </header>
          <dl>
            <dt>Pregnant</dt>
            <dd>{yesNoLabel(draft.females_only.pregnant)}</dd>
            <dt>Breastfeeding</dt>
            <dd>{yesNoLabel(draft.females_only.breastfeeding)}</dd>
            <dt>Taking contraceptives</dt>
            <dd>{yesNoLabel(draft.females_only.contraceptives)}</dd>
          </dl>
        </section>
      ) : null}

      {/* Signature block — typed + attest variant (operator decision for v1) */}
      <section className="consultation-signature">
        <h3 className="display-5 semi-bold">Signature</h3>
        <FormField
          id="signature.print_name"
          label="Type your full name"
          required
          error={errors['signature.print_name']}
        >
          <InputField
            name="signature.print_name"
            autoComplete="name"
            value={sig.print_name}
            onChange={(e) => setSig('print_name', e.target.value)}
          />
        </FormField>

        {/* Bug B fix: pass `consultation-dob-group` as the FormField
            wrapper className so Step 6's signature.date sits inside the
            same containing-block pattern Step 1 DOB uses (full content
            column, vertical rhythm). Combined with the
            `.consultation-daypicker` width/cell-size rule in
            global.css, both pickers now render at identical width and
            visually feel like the same control. */}
        <FormField
          id="signature.date"
          label="Date"
          required
          error={errors['signature.date']}
          className="consultation-dob-group"
        >
          <DatePickerField
            name="signature.date"
            ariaLabel="Signature date"
            required
            value={isoYmdToDateTriple(sig.date)}
            onChange={(next) => setSig('date', dateTripleToLocalIsoYmd(next))}
            defaultVisibleMonthYearsBack={0}
          />
        </FormField>

        <fieldset
          className="consultation-attest"
          aria-describedby={errors['signature.attested'] ? 'signature.attested-error' : undefined}
        >
          <label htmlFor="signature.attested" className="consultation-attest-label">
            <input
              id="signature.attested"
              name="signature.attested"
              type="checkbox"
              checked={sig.attested}
              required
              aria-required="true"
              onChange={(e) => setSig('attested', e.target.checked)}
            />
            <span>
              By checking this box and typing my name, I agree this is my electronic signature and I
              consent to electronic records.
              <span className="required-asterisk" aria-hidden="true">
                *
              </span>
              <span className="visually-hidden"> (required)</span>
            </span>
          </label>
          {errors['signature.attested'] ? (
            <span id="signature.attested-error" className="form-error" role="alert">
              {errors['signature.attested']}
            </span>
          ) : null}
        </fieldset>
      </section>

      {submitError ? (
        <div className="form-error consultation-submit-error" role="alert">
          {submitError}
        </div>
      ) : null}

      <div className="consultation-submit-row">
        <button
          type="submit"
          className="button-primary w-button"
          data-cta-id="consultation-submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Sending…' : 'Send My Consultation Request'}
        </button>
      </div>

      {/* MD §18.4 below-CTA expectation setter */}
      <div className="consultation-expectation" aria-label="What happens next">
        <p className="paragraph-medium semi-bold">What happens next:</p>
        <ol className="consultation-expectation-list">
          <li>We review your information (1–{CONSULTATION_SLA_BUSINESS_DAYS} business days).</li>
          <li>You receive a personalized skin assessment by email.</li>
          <li>If you like the recommendations, you can book — or not. Your call.</li>
        </ol>
      </div>
    </form>
  );
}
