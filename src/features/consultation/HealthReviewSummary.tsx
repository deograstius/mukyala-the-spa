/**
 * HealthReviewSummary — Step 6 Review section for Step 4 Health answers.
 *
 * Renders a `<dl>` mirroring the data shape entered in Step 4
 * (`Step4Health.tsx`) so users can verify their health answers before
 * signing. Visual style matches the sibling review sections in
 * `Step6ReviewSign.tsx` (existing `.consultation-review-section dl`).
 *
 * Grouping:
 *   1) Medical & Care — under_physician_care, being_treated,
 *      using_steroids, taking_medications [+ medications_list when true]
 *   2) Allergies — allergies, medication_allergies
 *      [+ medication_allergy_type when true], cosmetic_allergies
 *      [+ other_allergies_notes when true]
 *   3) Conditions — single "Conditions reported" row listing only the
 *      conditions whose value === true (filters the 23 condition flags
 *      down to a comma-separated list). Diabetes type is appended in
 *      parentheses when diabetes === true.
 *   4) Care & Treatment — the 4 optional string fields (hydroquinone,
 *      retin_a, accutane, blood_thinners). Empty values render as "—".
 *
 * Helpers `yesNoLabel` and `textOrDash` are duplicated locally (4 lines
 * each) from `Step6ReviewSign.tsx` to keep this component self-contained
 * without an out-of-scope refactor.
 */

import type { ConsultationDraft } from './schema';

export interface HealthReviewSummaryProps {
  draft: ConsultationDraft;
}

function yesNoLabel(value: boolean | null): string {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return '—';
}

function textOrDash(value: string): string {
  return value.trim() ? value : '—';
}

/**
 * Ordered list of the 23 condition fields rendered in the Step 4
 * "Conditions" card. Order mirrors `HEALTH_GROUP_DO_YOU_HAVE` in
 * `Step4Health.tsx` so the review reads the same direction as the
 * Step 4 answers.
 */
const CONDITION_FIELDS: ReadonlyArray<{
  key: keyof ConsultationDraft['health'];
  label: string;
}> = [
  { key: 'hormonal_imbalance', label: 'Hormonal imbalance' },
  { key: 'burns_grafted_skin', label: 'Burns / grafted skin' },
  { key: 'diabetes', label: 'Diabetes' },
  { key: 'epilepsy', label: 'Epilepsy' },
  { key: 'kidney_disease', label: 'Kidney disease' },
  { key: 'shingles', label: 'Shingles' },
  { key: 'eczema', label: 'Eczema' },
  { key: 'psoriasis', label: 'Psoriasis' },
  { key: 'dermatitis', label: 'Dermatitis' },
  { key: 'thyroid', label: 'Thyroid condition' },
  { key: 'cold_sores', label: 'Cold sores' },
  { key: 'keloid_scarring', label: 'Keloid scar formation' },
  { key: 'hypertrophic_scarring', label: 'Hypertrophic scar formation' },
  { key: 'asthma', label: 'Asthma' },
  { key: 'heart_condition', label: 'Heart condition' },
  { key: 'thrombosis', label: 'Thrombosis' },
  { key: 'high_blood_pressure', label: 'High blood pressure' },
  { key: 'metal_implants', label: 'Metal implants' },
  { key: 'tattoos_in_treatment_area', label: 'Tattoos in treatment area' },
  { key: 'skin_cancer_history', label: 'Skin cancer history' },
  { key: 'cancer_radiation_history', label: 'Cancer / radiation history' },
  { key: 'current_radiation', label: 'Currently receiving radiation' },
  { key: 'haemophilia', label: 'Haemophilia' },
];

function formatDiabetesType(value: ConsultationDraft['health']['diabetes_type']): string {
  if (value === 'type_1') return 'Type 1';
  if (value === 'type_2') return 'Type 2';
  return '';
}

export default function HealthReviewSummary({ draft }: HealthReviewSummaryProps) {
  const h = draft.health;

  const reportedConditions = CONDITION_FIELDS.filter((row) => h[row.key] === true).map((row) => {
    if (row.key === 'diabetes') {
      const t = formatDiabetesType(h.diabetes_type);
      return t ? `${row.label} (${t})` : row.label;
    }
    return row.label;
  });

  return (
    <dl>
      <dt>Under a physician&apos;s care</dt>
      <dd>{yesNoLabel(h.under_physician_care)}</dd>
      <dt>Being treated for a condition</dt>
      <dd>{yesNoLabel(h.being_treated)}</dd>
      <dt>Using steroids</dt>
      <dd>{yesNoLabel(h.using_steroids)}</dd>
      <dt>Taking medications</dt>
      <dd>{yesNoLabel(h.taking_medications)}</dd>
      {h.taking_medications === true ? (
        <>
          <dt>Medications and supplements</dt>
          <dd>{textOrDash(h.medications_list)}</dd>
        </>
      ) : null}

      <dt>Allergies</dt>
      <dd>{yesNoLabel(h.allergies)}</dd>
      <dt>Medication allergies</dt>
      <dd>{yesNoLabel(h.medication_allergies)}</dd>
      {h.medication_allergies === true ? (
        <>
          <dt>Medication allergy type</dt>
          <dd>{textOrDash(h.medication_allergy_type)}</dd>
        </>
      ) : null}
      <dt>Cosmetic / other allergies</dt>
      <dd>{yesNoLabel(h.cosmetic_allergies)}</dd>
      {h.cosmetic_allergies === true ? (
        <>
          <dt>Other allergy notes</dt>
          <dd>{textOrDash(h.other_allergies_notes)}</dd>
        </>
      ) : null}

      <dt>Conditions reported</dt>
      <dd>{reportedConditions.length ? reportedConditions.join(', ') : 'None reported'}</dd>

      <dt>Hydroquinone</dt>
      <dd>{textOrDash(h.hydroquinone)}</dd>
      <dt>Retin-A</dt>
      <dd>{textOrDash(h.retin_a)}</dd>
      <dt>Accutane / Isotretinoin</dt>
      <dd>{textOrDash(h.accutane)}</dd>
      <dt>Blood thinning medications</dt>
      <dd>{textOrDash(h.blood_thinners)}</dd>
    </dl>
  );
}
