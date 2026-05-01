/**
 * Step 5 of the consultation wizard — Females-only.
 *
 * Source: MD §3.1 (`females_only.*`) + §5 + §7.
 *
 * Entire step is gated by `females_only.applicable === true` (MD §5).
 * The wizard shell short-circuits step-5 when the gate is false; this
 * component therefore assumes it is mounted only when applicable === true.
 *
 * Inclusivity decision (per team_lead NOTES §5): NO hard gender field.
 * The `applicable` toggle on Step 4 is opt-in only.
 *
 * MD §4 does not list these as required at intake, so v1 treats them as
 * optional once the step is shown (operator confirm captured in
 * pm_recommendations).
 */

import RevealOnTrigger from '@shared/ui/forms/RevealOnTrigger';
import YesNoField from './YesNoField';
import { applyRevealClears, type ConsultationDraft } from './schema';

export interface Step5FemalesOnlyProps {
  draft: ConsultationDraft;
  onChange: (next: ConsultationDraft) => void;
  errors: Partial<Record<string, string>>;
  /**
   * Fired AFTER the gate is set to `applicable === false` via the
   * "Skip this step" button. The wizard shell uses this to silently
   * advance to Step 6 without forcing the user to click Next
   * (chunk `spa-consultation-pre-release-2026-05-01`). The
   * "Yes, continue" path stays manual: the user fills the revealed
   * fields and presses Next as before.
   */
  onSkip?: () => void;
}

export default function Step5FemalesOnly({
  draft,
  onChange,
  errors,
  onSkip,
}: Step5FemalesOnlyProps) {
  const f = draft.females_only;

  function set<K extends keyof ConsultationDraft['females_only']>(
    key: K,
    value: ConsultationDraft['females_only'][K],
  ) {
    onChange({ ...draft, females_only: { ...f, [key]: value } });
  }

  // Operator decision (STATE.md): two large gate buttons sharing the row,
  // exact copy "Yes, continue" / "Skip this step". Tapping Skip silently
  // sets `females_only.applicable = false` AND fires `onSkip` so the
  // wizard auto-advances to Step 6 without a second tap (chunk
  // `spa-consultation-pre-release-2026-05-01`). "Yes, continue" only
  // flips the gate — the user must still fill the revealed fields and
  // press Next.
  function applyGate(applicable: boolean) {
    const next = {
      ...draft,
      females_only: { ...f, applicable },
    };
    // Clear dependent values when gate flips false (centralized helper).
    onChange(applyRevealClears(draft, next));
    if (applicable === false && onSkip) {
      onSkip();
    }
  }

  return (
    <div className="consultation-step consultation-step-5">
      <h2 className="display-7 semi-bold">If you can become pregnant</h2>
      <p className="paragraph-medium">
        Some treatments have specific considerations for clients who are pregnant, breastfeeding, or
        on hormonal contraceptives. Would you like to share?
      </p>

      {/* Gate buttons — two large chip-styled pills sharing the row.
          Exact operator copy: "Yes, continue" / "Skip this step". */}
      <div
        className="consultation-chip-segment-row consultation-gate-row"
        role="group"
        aria-label="Continue or skip this section"
      >
        <button
          type="button"
          className="consultation-chip-option consultation-gate-button consultation-gate-yes"
          aria-pressed={f.applicable === true}
          onClick={() => applyGate(true)}
        >
          Yes, continue
        </button>
        <button
          type="button"
          className="consultation-chip-option consultation-gate-button consultation-gate-skip"
          aria-pressed={f.applicable === false}
          onClick={() => applyGate(false)}
        >
          Skip this step
        </button>
      </div>

      <RevealOnTrigger show={f.applicable === true}>
        <YesNoField
          name="females_only.pregnant"
          legend="Are you pregnant?"
          value={f.pregnant}
          onChange={(v) => set('pregnant', v)}
          error={errors['females_only.pregnant']}
        />
        <YesNoField
          name="females_only.breastfeeding"
          legend="Are you breastfeeding?"
          value={f.breastfeeding}
          onChange={(v) => set('breastfeeding', v)}
          error={errors['females_only.breastfeeding']}
        />
        <YesNoField
          name="females_only.contraceptives"
          legend="Are you taking contraceptives?"
          value={f.contraceptives}
          onChange={(v) => set('contraceptives', v)}
          error={errors['females_only.contraceptives']}
        />
      </RevealOnTrigger>
    </div>
  );
}
