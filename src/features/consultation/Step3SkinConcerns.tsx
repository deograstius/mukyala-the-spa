/**
 * Step 3 of the consultation wizard — Skin Concerns + Skin Care (combined per MD §7).
 *
 * Source: MD §3.1 (`skin_concerns.*`, `skincare.*`) + §4 + §7.
 * All fields are OPTIONAL per MD §4. No conditional reveals on this step.
 */

import FormField from '@shared/ui/forms/FormField';
import InputField from '@shared/ui/forms/InputField';
import { CheckboxGroup } from './YesNoField';
import {
  SKIN_CONCERN_OPTIONS,
  SKINCARE_PRODUCT_OPTIONS,
  type ConsultationDraft,
  type SkinConcernOption,
  type SkincareProductOption,
} from './schema';

const SKIN_CONCERN_LABELS: Record<SkinConcernOption, string> = {
  acne_or_scarring: 'Acne and/or acne scarring',
  hyperpigmentation: 'Hyperpigmentation',
  redness_rosacea: 'Redness / rosacea',
  improve_texture: 'Improve skin texture',
  sensitivity: 'Skin sensitivity',
  dry_dehydrated: 'Dry, dehydrated skin',
  congestion_blackheads: 'Congestion / blackheads',
  oily_combination: 'Oily, combination, congested skin',
  fine_lines_wrinkles: 'Fine lines, wrinkles, loss of elasticity',
};

const SKINCARE_PRODUCT_LABELS: Record<SkincareProductOption, string> = {
  cleanser: 'Cleanser',
  serum: 'Serum',
  exfoliator: 'Exfoliator',
  moisturizer: 'Moisturizer',
  toner: 'Toner',
  spf: 'SPF',
  mask: 'Mask',
};

export interface Step3SkinConcernsProps {
  draft: ConsultationDraft;
  onChange: (next: ConsultationDraft) => void;
  errors: Partial<Record<string, string>>;
}

export default function Step3SkinConcerns({ draft, onChange, errors }: Step3SkinConcernsProps) {
  const sc = draft.skin_concerns;
  const sk = draft.skincare;

  function setConcerns<K extends keyof ConsultationDraft['skin_concerns']>(
    key: K,
    value: ConsultationDraft['skin_concerns'][K],
  ) {
    onChange({ ...draft, skin_concerns: { ...sc, [key]: value } });
  }

  function setSkincare<K extends keyof ConsultationDraft['skincare']>(
    key: K,
    value: ConsultationDraft['skincare'][K],
  ) {
    onChange({ ...draft, skincare: { ...sk, [key]: value } });
  }

  // Step 3 has no single-selects to convert (multi-select chip checklists
  // already correct per NOTES §4). Operator decision: `skin_concerns.goals`,
  // `skin_concerns.actives_in_use`, `skin_concerns.prior_treatments` are
  // free-text textareas (NOT tag input). Error/help still flow through
  // FormField; the `textarea` element receives the cloneElement-injected
  // `id` / `aria-invalid` / `aria-describedby` props.
  return (
    <div className="consultation-step consultation-step-3">
      <h2 className="display-7 semi-bold">Your skin today</h2>

      <CheckboxGroup
        name="skin_concerns.selected"
        legend="Pick what you'd like us to focus on"
        options={SKIN_CONCERN_OPTIONS.map((value) => ({
          value,
          label: SKIN_CONCERN_LABELS[value],
        }))}
        value={sc.selected}
        onChange={(next) => setConcerns('selected', next as SkinConcernOption[])}
        error={errors['skin_concerns.selected']}
      />

      <FormField
        id="skin_concerns.goals"
        label="Your skin goals"
        error={errors['skin_concerns.goals']}
      >
        <textarea
          name="skin_concerns.goals"
          className="consultation-textarea"
          rows={3}
          placeholder="e.g. clearer pores, less redness, brighter tone"
          value={sc.goals}
          onChange={(e) => setConcerns('goals', e.target.value)}
        />
      </FormField>

      <FormField
        id="skin_concerns.actives_in_use"
        label="Active ingredients in your routine"
        helpText="Benzoyl peroxide, AHAs, BHAs, retinoids — list any you use now."
        error={errors['skin_concerns.actives_in_use']}
      >
        <textarea
          name="skin_concerns.actives_in_use"
          className="consultation-textarea"
          rows={3}
          value={sc.actives_in_use}
          onChange={(e) => setConcerns('actives_in_use', e.target.value)}
        />
      </FormField>

      <FormField
        id="skin_concerns.prior_treatments"
        label="Past treatments"
        helpText="Injectables, fillers, peels, lasers — and roughly when."
        error={errors['skin_concerns.prior_treatments']}
      >
        <textarea
          name="skin_concerns.prior_treatments"
          className="consultation-textarea"
          rows={3}
          value={sc.prior_treatments}
          onChange={(e) => setConcerns('prior_treatments', e.target.value)}
        />
      </FormField>

      <CheckboxGroup
        name="skincare.products_used"
        legend="What's in your current routine?"
        options={SKINCARE_PRODUCT_OPTIONS.map((value) => ({
          value,
          label: SKINCARE_PRODUCT_LABELS[value],
        }))}
        value={sk.products_used}
        onChange={(next) => setSkincare('products_used', next as SkincareProductOption[])}
        error={errors['skincare.products_used']}
      />

      <FormField
        id="skincare.other_products"
        label="Anything else in your routine?"
        error={errors['skincare.other_products']}
      >
        <InputField
          name="skincare.other_products"
          value={sk.other_products}
          onChange={(e) => setSkincare('other_products', e.target.value)}
        />
      </FormField>
    </div>
  );
}
