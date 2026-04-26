/**
 * Step 4 of the consultation wizard — Health.
 *
 * Source: MD §3.1 (`health.*`) + §4 + §5 (reveals) + §7 + §18.2.
 *
 * MD §4: every health.* boolean is REQUIRED. Narrative text fields are
 * OPTIONAL except where conditionally required (MD §5).
 *
 * Conditional reveals (MD §5):
 *  - health.taking_medications === true   -> health.medications_list (REQUIRED while shown)
 *  - health.medication_allergies === true -> health.medication_allergy_type (REQUIRED while shown)
 *  - health.cosmetic_allergies === true   -> health.other_allergies_notes (REQUIRED while shown)
 *  - health.diabetes === true             -> health.diabetes_type (enum: type_1 | type_2)
 *
 * Females-only step gate: rendered as the LAST sub-section (per architect
 * pass + operator default placement) so the user can opt the Step 5 page
 * in/out without leaving the Health page. The gate sets
 * females_only.applicable on the draft.
 */

import ChipSegment from '@shared/ui/forms/ChipSegment';
import FormField from '@shared/ui/forms/FormField';
import InputField from '@shared/ui/forms/InputField';
import RevealOnTrigger from '@shared/ui/forms/RevealOnTrigger';
import { useState } from 'react';
import YesNoField from './YesNoField';
import {
  HEALTH_BOOLEAN_FIELDS,
  isRevealed,
  type ConsultationDraft,
  type DiabetesType,
  type HealthBooleanFieldName,
} from './schema';

const DIABETES_TYPE_CHIPS = [
  { value: 'type_1' as const, label: 'Type 1' },
  { value: 'type_2' as const, label: 'Type 2' },
] as const;

const HEALTH_GROUP_ARE_YOU: ReadonlyArray<{ field: HealthBooleanFieldName; legend: string }> = [
  {
    field: 'health.under_physician_care',
    legend: "Under a physician's care for any medical condition?",
  },
  { field: 'health.being_treated', legend: 'Being treated for any medical condition?' },
  { field: 'health.using_steroids', legend: 'Currently using steroids or steroid cream products?' },
  { field: 'health.taking_medications', legend: 'Taking any medications / natural remedies?' },
];

const HEALTH_GROUP_ALLERGIES: ReadonlyArray<{ field: HealthBooleanFieldName; legend: string }> = [
  { field: 'health.allergies', legend: 'Any allergies?' },
  {
    field: 'health.medication_allergies',
    legend: 'Have you had any allergic reactions to any medications?',
  },
  {
    field: 'health.cosmetic_allergies',
    legend:
      'Have you had any adverse or allergic reactions to cosmetic products, foods, clothing, soaps, shampoos, hair dyes, perfumes, or jewellery?',
  },
];

const HEALTH_GROUP_DO_YOU_HAVE: ReadonlyArray<{ field: HealthBooleanFieldName; legend: string }> = [
  {
    field: 'health.hormonal_imbalance',
    legend: 'Hormonal imbalance (e.g. endometriosis, polycystic ovaries)?',
  },
  { field: 'health.burns_grafted_skin', legend: 'Burns / grafted skin?' },
  { field: 'health.diabetes', legend: 'Diabetes?' },
  { field: 'health.epilepsy', legend: 'Epilepsy?' },
  { field: 'health.kidney_disease', legend: 'Kidney disease?' },
  { field: 'health.shingles', legend: 'Shingles?' },
  { field: 'health.eczema', legend: 'Eczema?' },
  { field: 'health.psoriasis', legend: 'Psoriasis?' },
  { field: 'health.dermatitis', legend: 'Dermatitis?' },
  { field: 'health.thyroid', legend: 'Thyroid condition?' },
  { field: 'health.cold_sores', legend: 'Cold sores?' },
  { field: 'health.keloid_scarring', legend: 'Keloid scar formation?' },
  { field: 'health.hypertrophic_scarring', legend: 'Hypertrophic scar formation?' },
  { field: 'health.asthma', legend: 'Asthma?' },
  { field: 'health.heart_condition', legend: 'A heart condition?' },
  { field: 'health.thrombosis', legend: 'Thrombosis?' },
  { field: 'health.high_blood_pressure', legend: 'High blood pressure?' },
  { field: 'health.metal_implants', legend: 'Metal implants?' },
  {
    field: 'health.tattoos_in_treatment_area',
    legend: 'Tattoos or permanent makeup in the area to be treated?',
  },
  {
    field: 'health.skin_cancer_history',
    legend: 'Have you ever been diagnosed with melanoma or any form of skin cancer?',
  },
  {
    field: 'health.cancer_radiation_history',
    legend: 'Have you ever had cancer with a history of radiation treatments?',
  },
  { field: 'health.current_radiation', legend: 'Do you currently receive radiation treatments?' },
  { field: 'health.haemophilia', legend: 'Haemophilia?' },
];

export interface Step4HealthProps {
  draft: ConsultationDraft;
  onChange: (next: ConsultationDraft) => void;
  errors: Partial<Record<string, string>>;
}

/**
 * "Mark all No" sweep — sets every condition in the conditions group to
 * false. Operator decision (STATE.md): YES, build it. If any conditions
 * are already Yes, surface a small inline confirm noting the exact count
 * that will be reset; otherwise apply immediately (idempotent — re-tapping
 * when everything is already No is a no-op so the UI doesn't flicker).
 *
 * Sweep scope: `HEALTH_GROUP_DO_YOU_HAVE` (the conditions card) per
 * NOTES §5. The Care & Treatment + Allergies cards are NOT swept.
 */
function MarkAllNoButton({
  draft,
  onChange,
}: {
  draft: ConsultationDraft;
  onChange: (next: ConsultationDraft) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const conditionFields = HEALTH_GROUP_DO_YOU_HAVE.map((row) => row.field);

  const yesCount = conditionFields.reduce((acc, path) => {
    const fieldKey = path.split('.')[1] as keyof ConsultationDraft['health'];
    return draft.health[fieldKey] === true ? acc + 1 : acc;
  }, 0);

  // Count of fields that need flipping (null OR true). When zero, the
  // sweep is a no-op and we skip both the confirm prompt and the
  // re-render churn so re-tapping doesn't flicker.
  const needsFlipCount = conditionFields.reduce((acc, path) => {
    const fieldKey = path.split('.')[1] as keyof ConsultationDraft['health'];
    return draft.health[fieldKey] === false ? acc : acc + 1;
  }, 0);

  function applySweep() {
    const nextHealth = { ...draft.health };
    for (const path of conditionFields) {
      const fieldKey = path.split('.')[1] as keyof ConsultationDraft['health'];
      (nextHealth as unknown as Record<string, boolean | null>)[fieldKey] = false;
    }
    onChange({ ...draft, health: nextHealth });
    setConfirming(false);
  }

  function handleClick() {
    if (needsFlipCount === 0) {
      // Idempotent — already all No. Avoid re-emitting an identical draft.
      setConfirming(false);
      return;
    }
    if (yesCount > 0 && !confirming) {
      setConfirming(true);
      return;
    }
    applySweep();
  }

  // Sanity guard so the constant from schema stays referenced (surfaces the
  // dependency if the conditions group is ever trimmed back to the schema list).
  void HEALTH_BOOLEAN_FIELDS;

  return (
    <span className="consultation-mark-all-no-wrap">
      <button
        type="button"
        className="consultation-mark-all-no"
        onClick={handleClick}
        aria-describedby={confirming ? 'consultation-mark-all-no-confirm' : undefined}
      >
        Mark all No
      </button>
      {confirming ? (
        <span
          id="consultation-mark-all-no-confirm"
          className="consultation-mark-all-no-confirm"
          role="alert"
        >
          This will reset {yesCount} answer{yesCount === 1 ? '' : 's'} — undo?
          <button
            type="button"
            className="consultation-mark-all-no consultation-mark-all-no-action"
            onClick={applySweep}
          >
            Confirm
          </button>
          <button
            type="button"
            className="consultation-mark-all-no consultation-mark-all-no-action"
            onClick={() => setConfirming(false)}
          >
            Cancel
          </button>
        </span>
      ) : null}
    </span>
  );
}

export default function Step4Health({ draft, onChange, errors }: Step4HealthProps) {
  const h = draft.health;
  const f = draft.females_only;

  function setHealth<K extends keyof ConsultationDraft['health']>(
    key: K,
    value: ConsultationDraft['health'][K],
  ) {
    onChange({ ...draft, health: { ...h, [key]: value } });
  }

  function setBooleanByPath(path: HealthBooleanFieldName, value: boolean) {
    const field = path.split('.')[1] as keyof ConsultationDraft['health'];
    setHealth(field, value as ConsultationDraft['health'][typeof field]);
  }

  function setApplicable(value: boolean) {
    onChange({ ...draft, females_only: { ...f, applicable: value } });
  }

  // Long-label rows in the conditions grid that should span both columns on
  // desktop (auto-handled via data-long="true" in the consultation CSS block).
  const LONG_LABEL_FIELDS = new Set<HealthBooleanFieldName>([
    'health.cosmetic_allergies',
    'health.skin_cancer_history',
    'health.cancer_radiation_history',
    'health.hormonal_imbalance',
    'health.tattoos_in_treatment_area',
  ]);

  return (
    <div className="consultation-step consultation-step-4">
      {/* MD §18.2 reassurance copy */}
      <p className="consultation-reassurance">
        We ask about your health to keep your skin safe. This information is reviewed only by
        Mukyala&apos;s licensed staff.
      </p>

      <h2 className="display-7 semi-bold">Health</h2>

      <section className="consultation-health-card">
        <h3 className="display-5 semi-bold">Care &amp; treatment</h3>
        <div className="consultation-health-grid">
          {HEALTH_GROUP_ARE_YOU.map(({ field, legend }) => {
            const fieldKey = field.split('.')[1] as keyof ConsultationDraft['health'];
            return (
              <YesNoField
                key={field}
                name={field}
                legend={legend}
                required
                value={h[fieldKey] as boolean | null}
                onChange={(v) => setBooleanByPath(field, v)}
                error={errors[field]}
              />
            );
          })}
        </div>
        <RevealOnTrigger show={isRevealed('health.medications_list', draft)}>
          {/* Operator decision (STATE.md): free-text textarea (NOT tag input). */}
          <FormField
            id="health.medications_list"
            label="Medications and supplements you're taking"
            error={errors['health.medications_list']}
          >
            <textarea
              name="health.medications_list"
              className="consultation-textarea"
              rows={3}
              value={h.medications_list}
              onChange={(e) => setHealth('medications_list', e.target.value)}
            />
          </FormField>
        </RevealOnTrigger>

        <h4 className="display-5 semi-bold consultation-health-subhead">
          Have you used any of these?
        </h4>
        <div className="consultation-health-grid">
          <FormField
            id="health.hydroquinone"
            label="Hydroquinone"
            helpText="If you've used it — roughly when?"
            error={errors['health.hydroquinone']}
          >
            <InputField
              name="health.hydroquinone"
              value={h.hydroquinone}
              onChange={(e) => setHealth('hydroquinone', e.target.value)}
            />
          </FormField>
          <FormField
            id="health.retin_a"
            label="Retin-A"
            helpText="If you've used it — roughly when?"
            error={errors['health.retin_a']}
          >
            <InputField
              name="health.retin_a"
              value={h.retin_a}
              onChange={(e) => setHealth('retin_a', e.target.value)}
            />
          </FormField>
          <FormField
            id="health.accutane"
            label="Accutane / Isotretinoin"
            helpText="If you've used it — roughly when?"
            error={errors['health.accutane']}
          >
            <InputField
              name="health.accutane"
              value={h.accutane}
              onChange={(e) => setHealth('accutane', e.target.value)}
            />
          </FormField>
          <FormField
            id="health.blood_thinners"
            label="Blood thinning medications"
            error={errors['health.blood_thinners']}
          >
            <InputField
              name="health.blood_thinners"
              value={h.blood_thinners}
              onChange={(e) => setHealth('blood_thinners', e.target.value)}
            />
          </FormField>
        </div>
      </section>

      <section className="consultation-health-card">
        <h3 className="display-5 semi-bold">Allergies</h3>
        <div className="consultation-health-grid">
          {HEALTH_GROUP_ALLERGIES.map(({ field, legend }) => {
            const fieldKey = field.split('.')[1] as keyof ConsultationDraft['health'];
            const isLong = LONG_LABEL_FIELDS.has(field);
            return (
              <div key={field} data-long={isLong ? 'true' : undefined}>
                <YesNoField
                  name={field}
                  legend={legend}
                  required
                  value={h[fieldKey] as boolean | null}
                  onChange={(v) => setBooleanByPath(field, v)}
                  error={errors[field]}
                />
                {field === 'health.medication_allergies' ? (
                  <RevealOnTrigger show={isRevealed('health.medication_allergy_type', draft)}>
                    <FormField
                      id="health.medication_allergy_type"
                      label="What type of medication allergy?"
                      error={errors['health.medication_allergy_type']}
                    >
                      <textarea
                        name="health.medication_allergy_type"
                        className="consultation-textarea"
                        rows={3}
                        value={h.medication_allergy_type}
                        onChange={(e) => setHealth('medication_allergy_type', e.target.value)}
                      />
                    </FormField>
                  </RevealOnTrigger>
                ) : null}
                {field === 'health.cosmetic_allergies' ? (
                  <RevealOnTrigger show={isRevealed('health.other_allergies_notes', draft)}>
                    <FormField
                      id="health.other_allergies_notes"
                      label="Other allergies or sensitivities"
                      error={errors['health.other_allergies_notes']}
                    >
                      <textarea
                        name="health.other_allergies_notes"
                        className="consultation-textarea"
                        rows={3}
                        value={h.other_allergies_notes}
                        onChange={(e) => setHealth('other_allergies_notes', e.target.value)}
                      />
                    </FormField>
                  </RevealOnTrigger>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="consultation-health-card">
        <div className="consultation-conditions-header">
          <h3 className="display-5 semi-bold">Conditions</h3>
          <MarkAllNoButton draft={draft} onChange={onChange} />
        </div>
        <div className="consultation-conditions-grid consultation-health-grid">
          {HEALTH_GROUP_DO_YOU_HAVE.map(({ field, legend }) => {
            const fieldKey = field.split('.')[1] as keyof ConsultationDraft['health'];
            const isLong = LONG_LABEL_FIELDS.has(field);
            return (
              <div key={field} data-long={isLong ? 'true' : undefined}>
                <YesNoField
                  name={field}
                  legend={legend}
                  required
                  value={h[fieldKey] as boolean | null}
                  onChange={(v) => setBooleanByPath(field, v)}
                  error={errors[field]}
                />
                {field === 'health.diabetes' ? (
                  <RevealOnTrigger show={isRevealed('health.diabetes_type', draft)}>
                    <ChipSegment<DiabetesType>
                      name="health.diabetes_type"
                      legend="Diabetes type"
                      options={DIABETES_TYPE_CHIPS}
                      value={h.diabetes_type === '' ? null : h.diabetes_type}
                      onChange={(v) => setHealth('diabetes_type', v)}
                      error={errors['health.diabetes_type']}
                    />
                  </RevealOnTrigger>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {/* Females-only opt-in toggle (placement: end of Step 4 per architect default) */}
      <section className="consultation-females-toggle">
        <YesNoField
          name="females_only.applicable"
          legend="Show questions for people who can become pregnant?"
          helpText="Pregnancy, breastfeeding, contraceptives — only relevant for some clients."
          value={f.applicable}
          onChange={(v) => setApplicable(v)}
        />
      </section>
    </div>
  );
}
