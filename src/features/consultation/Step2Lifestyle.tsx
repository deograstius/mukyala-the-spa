/**
 * Step 2 of the consultation wizard — Lifestyle.
 *
 * Source: MD §3.1 (`lifestyle.*`) + §4 + §5 (conditional reveals) + §7.
 *
 * Conditional reveals (MD §5):
 *  - lifestyle.exercise === true   -> show lifestyle.exercise_frequency
 *  - lifestyle.alcohol === true    -> show lifestyle.alcohol_units_per_week
 *  - lifestyle.smoke === true      -> show lifestyle.smoke_per_day
 *  - lifestyle.caffeine === true   -> show lifestyle.caffeine_per_day
 *
 * The clear-on-flip behavior is centralized in `applyRevealClears` (in
 * schema.ts) and applied uniformly by the wizard shell on every onChange.
 */

import ChipSegment from '@shared/ui/forms/ChipSegment';
import FormField from '@shared/ui/forms/FormField';
import InputField from '@shared/ui/forms/InputField';
import RevealOnTrigger from '@shared/ui/forms/RevealOnTrigger';
import Stepper from '@shared/ui/forms/Stepper';
import YesNoField from './YesNoField';
import { isRevealed, type ConsultationDraft } from './schema';

// Chip option lists for Step 2 single-select fields per team_lead NOTES §3.
// The wire format remains `string` (schema unchanged) so chip values are
// submitted as plain strings (e.g. `"low"`, `"3_5_per_week"`,
// `"none_recent"`). Tests live in the tester pass.
const STRESS_LEVEL_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' },
] as const;

const EXERCISE_FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: '3_5_per_week', label: '3–5×/wk' },
  { value: '1_2_per_week', label: '1–2×/wk' },
  { value: 'rarely', label: 'Rarely' },
] as const;

const RECENT_SUN_EXPOSURE_OPTIONS = [
  { value: 'none_recent', label: 'None recently' },
  { value: 'occasional', label: 'Occasional sun' },
  { value: 'regular', label: 'Regular sun' },
  { value: 'sunbeds', label: 'Sunbeds' },
] as const;

export interface Step2LifestyleProps {
  draft: ConsultationDraft;
  onChange: (next: ConsultationDraft) => void;
  errors: Partial<Record<string, string>>;
}

export default function Step2Lifestyle({ draft, onChange, errors }: Step2LifestyleProps) {
  const l = draft.lifestyle;

  function set<K extends keyof ConsultationDraft['lifestyle']>(
    key: K,
    value: ConsultationDraft['lifestyle'][K],
  ) {
    onChange({ ...draft, lifestyle: { ...l, [key]: value } });
  }

  return (
    <div className="consultation-step consultation-step-2">
      <h2 className="display-7 semi-bold">Lifestyle</h2>
      <p className="paragraph-medium">
        All lifestyle questions are optional but help us tailor your plan.
      </p>

      <FormField
        id="lifestyle.occupation"
        label="Occupation"
        error={errors['lifestyle.occupation']}
      >
        <InputField
          name="lifestyle.occupation"
          value={l.occupation}
          onChange={(e) => set('occupation', e.target.value)}
        />
      </FormField>

      {/* Stress level — chip segment (3 options) per NOTES §3. */}
      <ChipSegment
        name="lifestyle.stress_level"
        legend="Stress level"
        options={STRESS_LEVEL_OPTIONS}
        value={l.stress_level}
        onChange={(v) => set('stress_level', v)}
        error={errors['lifestyle.stress_level']}
      />

      <YesNoField
        name="lifestyle.exercise"
        legend="Do you exercise?"
        value={l.exercise}
        onChange={(v) => set('exercise', v)}
        error={errors['lifestyle.exercise']}
      />
      <RevealOnTrigger show={isRevealed('lifestyle.exercise_frequency', draft)}>
        <ChipSegment
          name="lifestyle.exercise_frequency"
          legend="How often?"
          options={EXERCISE_FREQUENCY_OPTIONS}
          value={l.exercise_frequency}
          onChange={(v) => set('exercise_frequency', v)}
          error={errors['lifestyle.exercise_frequency']}
        />
      </RevealOnTrigger>

      <FormField
        id="lifestyle.dietary_restrictions"
        label="Dietary restrictions"
        error={errors['lifestyle.dietary_restrictions']}
      >
        <InputField
          name="lifestyle.dietary_restrictions"
          value={l.dietary_restrictions}
          onChange={(e) => set('dietary_restrictions', e.target.value)}
        />
      </FormField>

      {/* Water — Stepper (range 0–15, default 6) per NOTES §3 / Q4.
          Visible label is rendered alongside the Stepper; the spinbutton
          announces value changes via aria-live. */}
      <div
        className="consultation-stepper-field"
        aria-describedby={
          errors['lifestyle.water_glasses_per_day'] ? 'lifestyle-water-error' : undefined
        }
      >
        <span className="consultation-sub-label">Water</span>
        <span className="paragraph-small" id="lifestyle-water-help">
          Glasses per day
        </span>
        <Stepper
          name="lifestyle.water_glasses_per_day"
          ariaLabel="Glasses of water per day"
          ariaDescribedBy="lifestyle-water-help"
          min={0}
          max={15}
          defaultValue={6}
          suffix="glasses"
          value={l.water_glasses_per_day}
          onChange={(v) => set('water_glasses_per_day', v)}
        />
        {errors['lifestyle.water_glasses_per_day'] ? (
          <span id="lifestyle-water-error" className="form-error" role="alert">
            {errors['lifestyle.water_glasses_per_day']}
          </span>
        ) : null}
      </div>

      <YesNoField
        name="lifestyle.alcohol"
        legend="Do you drink alcohol?"
        value={l.alcohol}
        onChange={(v) => set('alcohol', v)}
        error={errors['lifestyle.alcohol']}
      />
      <RevealOnTrigger show={isRevealed('lifestyle.alcohol_units_per_week', draft)}>
        {/* Copy fix (chunk `consultation-copy-and-clinic-gate-2026-04-26`):
            operator brief (verbatim) — "alcohol units per week is confusing,
            you need to make that more human". Surface "Drinks per week"
            with an explicit "1 drink ≈ ..." helper so the unit is unambiguous.
            Wire format unchanged: `lifestyle.alcohol_units_per_week` is still
            a stringified integer 0–30. The Stepper's suffix ("drinks") and
            the helper text below are UI-only. The helper span carries a
            stable id (`lifestyle-alcohol-help`) for jsdom + a11y assertions. */}
        <div className="consultation-stepper-field">
          <span className="consultation-sub-label">Drinks per week</span>
          <span className="paragraph-small" id="lifestyle-alcohol-help">
            1 drink ≈ 12oz beer / 5oz wine / 1.5oz spirits
          </span>
          <Stepper
            name="lifestyle.alcohol_units_per_week"
            ariaLabel="Drinks per week"
            ariaDescribedBy="lifestyle-alcohol-help"
            min={0}
            max={30}
            defaultValue={0}
            suffix="drinks"
            value={l.alcohol_units_per_week}
            onChange={(v) => set('alcohol_units_per_week', v)}
          />
          {errors['lifestyle.alcohol_units_per_week'] ? (
            <span className="form-error" role="alert">
              {errors['lifestyle.alcohol_units_per_week']}
            </span>
          ) : null}
        </div>
      </RevealOnTrigger>

      <YesNoField
        name="lifestyle.smoke"
        legend="Do you smoke?"
        value={l.smoke}
        onChange={(v) => set('smoke', v)}
        error={errors['lifestyle.smoke']}
      />
      <RevealOnTrigger show={isRevealed('lifestyle.smoke_per_day', draft)}>
        {/* Copy fix (chunk `consultation-copy-and-clinic-gate-2026-04-26`):
            operator brief (verbatim) — "same with cigarettes the units should
            tell you something". The label was already "Cigarettes per day";
            we add an explicit pack-equivalence helper so users converting
            from "packs" know what to enter. Wire format unchanged:
            `lifestyle.smoke_per_day` is still a stringified integer 0–40.
            Range stays at 40 — that's already ~2 packs/day. */}
        <div className="consultation-stepper-field">
          <span className="consultation-sub-label">Cigarettes per day</span>
          <span className="paragraph-small" id="lifestyle-smoke-help">
            Count individual cigarettes (1 pack = 20 cigarettes)
          </span>
          <Stepper
            name="lifestyle.smoke_per_day"
            ariaLabel="Cigarettes per day"
            ariaDescribedBy="lifestyle-smoke-help"
            min={0}
            max={40}
            defaultValue={0}
            suffix="cigarettes"
            value={l.smoke_per_day}
            onChange={(v) => set('smoke_per_day', v)}
          />
          {errors['lifestyle.smoke_per_day'] ? (
            <span className="form-error" role="alert">
              {errors['lifestyle.smoke_per_day']}
            </span>
          ) : null}
        </div>
      </RevealOnTrigger>

      <YesNoField
        name="lifestyle.caffeine"
        legend="Do you drink caffeine?"
        value={l.caffeine}
        onChange={(v) => set('caffeine', v)}
        error={errors['lifestyle.caffeine']}
      />
      <RevealOnTrigger show={isRevealed('lifestyle.caffeine_per_day', draft)}>
        <div className="consultation-stepper-field">
          <span className="consultation-sub-label">Caffeinated drinks per day</span>
          <Stepper
            name="lifestyle.caffeine_per_day"
            ariaLabel="Caffeinated drinks per day"
            min={0}
            max={10}
            defaultValue={0}
            suffix="cups"
            value={l.caffeine_per_day}
            onChange={(v) => set('caffeine_per_day', v)}
          />
          {errors['lifestyle.caffeine_per_day'] ? (
            <span className="form-error" role="alert">
              {errors['lifestyle.caffeine_per_day']}
            </span>
          ) : null}
        </div>
      </RevealOnTrigger>

      {/* Recent sun exposure — chip segment (4 options) per NOTES §3.
          A free-text "Add detail" reveal under the chips is intentionally
          NOT wired here (out of scope for this chunk; flagged in
          BACKLOG for a follow-up if the operator requests). */}
      <ChipSegment
        name="lifestyle.recent_sun_exposure"
        legend="Recent sun or tanning-bed exposure"
        helpText="Last 4 weeks. Skip if none."
        options={RECENT_SUN_EXPOSURE_OPTIONS}
        value={l.recent_sun_exposure}
        onChange={(v) => set('recent_sun_exposure', v)}
        error={errors['lifestyle.recent_sun_exposure']}
      />
    </div>
  );
}
