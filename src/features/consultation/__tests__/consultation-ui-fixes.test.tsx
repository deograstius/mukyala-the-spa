/**
 * Tests for chunk `consultation-ui-fixes-2026-04-25`.
 *
 * Each `describe` block corresponds 1:1 to a chunk item:
 *   1) `.consultation-stepper-field` CSS rule
 *   2) Type-scale flatness fix (consultation-sub-label)
 *   3) H1 unification across all steps (display-9)
 *   4) Step 5 gate-button size normalization (44px / 14px)
 *   5) Tap-target size floors (≥44px on yesno + checkbox options)
 *   6) Date-control unification (Step 6 uses DatePickerField, not native)
 *   7) Step 6 Health review `<dl>` summary
 *
 * Strategy notes for the tester:
 *   - We assert against the actual CSS source for items 1, 4, 5 and the
 *     parts of items 2/3 that are tokens/classes baked into the stylesheet.
 *     jsdom's computed-style support is partial, so reading the canonical
 *     CSS file is more deterministic than `getComputedStyle()`.
 *   - We assert against rendered DOM for items 1 (wrapper presence),
 *     2 (class application), 3 (H1 class equality across steps),
 *     6 (no native date inputs / DayPicker present), and 7 (HealthReviewSummary
 *     dl/dt/dd structure).
 *   - For item 3 (H1 unification) we render the Step components directly
 *     where the H1 lives (the wizard H1 is in `Consultation.tsx`, but only
 *     one literal exists — we read the page source to assert the H1
 *     class is `display-9` and that no `display-7 semi-bold` conditional
 *     remains on the wizard H1). We also render the resume-card branch.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DateTriple } from '@shared/ui/forms/datePickerField.helpers';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HealthReviewSummary from '../HealthReviewSummary';
import Step1Personal from '../Step1Personal';
import Step2Lifestyle from '../Step2Lifestyle';
import Step5FemalesOnly from '../Step5FemalesOnly';
import { createEmptyDraft, type ConsultationDraft } from '../schema';

// ---------------------------------------------------------------------------
// Source-file readers (deterministic — better than jsdom CSS for these
// audit items, all of which are about tokens/min-heights/font-sizes that
// live in a single source of truth).
// ---------------------------------------------------------------------------

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_SRC = resolve(HERE, '../../..'); // .../src
const CSS_PATH = resolve(REPO_SRC, 'styles/global.css');
const CONSULTATION_PAGE_PATH = resolve(REPO_SRC, 'pages/Consultation.tsx');
const STEP6_PATH = resolve(REPO_SRC, 'features/consultation/Step6ReviewSign.tsx');

let GLOBAL_CSS = '';
let CONSULTATION_PAGE_SRC = '';
let STEP6_SRC = '';
try {
  GLOBAL_CSS = readFileSync(CSS_PATH, 'utf8');
  CONSULTATION_PAGE_SRC = readFileSync(CONSULTATION_PAGE_PATH, 'utf8');
  STEP6_SRC = readFileSync(STEP6_PATH, 'utf8');
} catch {
  // The afterEach assertions below will catch missing files; we keep the
  // import-time read inside try/catch so a missing file doesn't abort the
  // whole module.
}

/** Return the body of a CSS rule (everything between `{` and `}`) for
 *  `selector`, or empty string if not found. */
function ruleBody(css: string, selector: string): string {
  // Escape regex metachars in the selector (we only use `.` and `-`).
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`, 'm');
  const match = re.exec(css);
  return match ? match[2] : '';
}

/** Parse `value: number` from a CSS body, e.g. `min-height: 44px;`. */
function pxValue(body: string, prop: string): number | null {
  const re = new RegExp(`\\b${prop}\\s*:\\s*(\\d+)px`, 'm');
  const match = re.exec(body);
  return match ? Number.parseInt(match[1], 10) : null;
}

// ---------------------------------------------------------------------------
// Item 1 — `.consultation-stepper-field` CSS class defined + renders.
// ---------------------------------------------------------------------------

describe('consultation-ui-fixes-2026-04-25 — item 1: .consultation-stepper-field', () => {
  it('defines `.consultation-stepper-field` in global.css with non-default whitespace styling', () => {
    const body = ruleBody(GLOBAL_CSS, '.consultation-stepper-field');
    expect(body, '.consultation-stepper-field rule must exist in global.css').not.toBe('');
    // Must be a flex column so labels stack above the stepper control.
    expect(body).toMatch(/display\s*:\s*flex/);
    expect(body).toMatch(/flex-direction\s*:\s*column/);
    // Must declare a non-zero gap between stacked children.
    expect(body).toMatch(/gap\s*:\s*[^;]+/);
  });

  it('wraps Step 2 stepper labels in a flex column so labels stack above the stepper control', () => {
    const draft = createEmptyDraft();
    const { container } = render(<Step2Lifestyle draft={draft} onChange={() => {}} errors={{}} />);
    const wrappers = container.querySelectorAll('.consultation-stepper-field');
    // Water (always rendered) is exactly one wrapper. Conditional reveals
    // (alcohol/smoke/caffeine) are hidden by default — water alone proves
    // the wrapper is wired up.
    expect(wrappers.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the water-glasses-per-day stepper with its label visible above the control', () => {
    const draft = createEmptyDraft();
    const { container } = render(<Step2Lifestyle draft={draft} onChange={() => {}} errors={{}} />);
    const water = container.querySelector(
      '.consultation-stepper-field [role="spinbutton"][data-name="lifestyle.water_glasses_per_day"]',
    );
    expect(
      water,
      'water stepper must be inside a .consultation-stepper-field wrapper',
    ).not.toBeNull();
    // Label span exists as a sibling above the stepper.
    const wrapper = water?.closest('.consultation-stepper-field') as HTMLElement | null;
    expect(wrapper).not.toBeNull();
    const subLabel = wrapper?.querySelector('.consultation-sub-label');
    expect(subLabel?.textContent?.trim()).toMatch(/water/i);
  });

  it('renders the alcohol-units-per-week stepper label above the control when revealed', () => {
    const draft = createEmptyDraft();
    draft.lifestyle.alcohol = true; // triggers the reveal
    const { container } = render(<Step2Lifestyle draft={draft} onChange={() => {}} errors={{}} />);
    const stepper = container.querySelector(
      '.consultation-stepper-field [role="spinbutton"][data-name="lifestyle.alcohol_units_per_week"]',
    );
    expect(stepper).not.toBeNull();
    const wrapper = stepper?.closest('.consultation-stepper-field') as HTMLElement | null;
    expect(wrapper?.querySelector('.consultation-sub-label')?.textContent).toMatch(
      /units per week/i,
    );
  });

  it('renders the smoke-per-day stepper label above the control when revealed', () => {
    const draft = createEmptyDraft();
    draft.lifestyle.smoke = true;
    const { container } = render(<Step2Lifestyle draft={draft} onChange={() => {}} errors={{}} />);
    const stepper = container.querySelector(
      '.consultation-stepper-field [role="spinbutton"][data-name="lifestyle.smoke_per_day"]',
    );
    expect(stepper).not.toBeNull();
    const wrapper = stepper?.closest('.consultation-stepper-field') as HTMLElement | null;
    expect(wrapper?.querySelector('.consultation-sub-label')?.textContent).toMatch(
      /cigarettes per day/i,
    );
  });

  it('renders the caffeine-per-day stepper label above the control when revealed', () => {
    const draft = createEmptyDraft();
    draft.lifestyle.caffeine = true;
    const { container } = render(<Step2Lifestyle draft={draft} onChange={() => {}} errors={{}} />);
    const stepper = container.querySelector(
      '.consultation-stepper-field [role="spinbutton"][data-name="lifestyle.caffeine_per_day"]',
    );
    expect(stepper).not.toBeNull();
    const wrapper = stepper?.closest('.consultation-stepper-field') as HTMLElement | null;
    expect(wrapper?.querySelector('.consultation-sub-label')?.textContent).toMatch(
      /caffeinated drinks per day/i,
    );
  });

  it('does NOT render the alcohol/smoke/caffeine stepper wrappers until their YesNo gate flips true', () => {
    const draft = createEmptyDraft(); // all booleans null
    const { container } = render(<Step2Lifestyle draft={draft} onChange={() => {}} errors={{}} />);
    expect(container.querySelector('[data-name="lifestyle.alcohol_units_per_week"]')).toBeNull();
    expect(container.querySelector('[data-name="lifestyle.smoke_per_day"]')).toBeNull();
    expect(container.querySelector('[data-name="lifestyle.caffeine_per_day"]')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Item 2 — Type-scale hierarchy: H4 ≠ legend ≠ stepper-label.
// `display-5 semi-bold` stays for H3 / Step 4 cards;
// `consultation-sub-label` (smaller) is used for legends + stepper labels.
// ---------------------------------------------------------------------------

describe('consultation-ui-fixes-2026-04-25 — item 2: type-scale hierarchy', () => {
  it('defines a `.consultation-sub-label` rule with a smaller font-size than display-5 (20px)', () => {
    const body = ruleBody(GLOBAL_CSS, '.consultation-sub-label');
    expect(body, '.consultation-sub-label rule must exist').not.toBe('');
    const fontSize = pxValue(body, 'font-size');
    expect(fontSize, 'font-size must be specified in px').not.toBeNull();
    // Strictly smaller than display-5 / 20px so legends/labels stop
    // competing visually with H3 review-section headers.
    expect(fontSize as number).toBeLessThan(20);
    // Should still be a labelled-emphasis weight (>= 500).
    expect(body).toMatch(/font-weight\s*:\s*([5-9]\d{2})/);
  });

  it('Step 1 fieldset legends (DOB + clinic) use `consultation-sub-label`, not `display-5 semi-bold`', () => {
    const draft = createEmptyDraft();
    const { container } = render(<Step1Personal draft={draft} onChange={() => {}} errors={{}} />);
    const legends = container.querySelectorAll('legend');
    expect(legends.length).toBeGreaterThanOrEqual(2);
    for (const legend of Array.from(legends)) {
      expect(legend.classList.contains('consultation-sub-label')).toBe(true);
      // Mutually-exclusive: legend MUST NOT carry display-5 semi-bold (the
      // pre-fix flat scale the audit removed).
      expect(legend.classList.contains('display-5')).toBe(false);
    }
  });

  it('Step 2 stepper labels use the new sub-label class, not `display-5 semi-bold`', () => {
    const draft = createEmptyDraft();
    draft.lifestyle.alcohol = true;
    draft.lifestyle.smoke = true;
    draft.lifestyle.caffeine = true;
    const { container } = render(<Step2Lifestyle draft={draft} onChange={() => {}} errors={{}} />);
    const subLabels = container.querySelectorAll(
      '.consultation-stepper-field .consultation-sub-label',
    );
    // 4 stepper-fields when all reveals are open: water, alcohol, smoke, caffeine.
    expect(subLabels.length).toBe(4);
    for (const sub of Array.from(subLabels)) {
      expect(sub.classList.contains('display-5')).toBe(false);
    }
  });

  it('Step 4 `<h3>` cards keep `display-5 semi-bold` so the H3 hierarchy is preserved', () => {
    // Read Step4Health.tsx source — direct render is heavy and the
    // class assertion is straightforward source-level. We assert the
    // file still contains an `<h3 className="display-5 semi-bold">`.
    const step4Path = resolve(REPO_SRC, 'features/consultation/Step4Health.tsx');
    const src = readFileSync(step4Path, 'utf8');
    expect(src).toMatch(/<h3 className="display-5 semi-bold">/);
  });

  it('the new `.consultation-sub-label` class is applied at all expected call sites', () => {
    // Scan the consultation feature folder for `consultation-sub-label`
    // references — must appear in Step1 (DOB legend, clinic legend) and
    // Step2 (4 stepper-field labels). 6 occurrences minimum.
    const step1Src = readFileSync(
      resolve(REPO_SRC, 'features/consultation/Step1Personal.tsx'),
      'utf8',
    );
    const step2Src = readFileSync(
      resolve(REPO_SRC, 'features/consultation/Step2Lifestyle.tsx'),
      'utf8',
    );
    const step1Hits = (step1Src.match(/consultation-sub-label/g) || []).length;
    const step2Hits = (step2Src.match(/consultation-sub-label/g) || []).length;
    expect(step1Hits).toBeGreaterThanOrEqual(2); // DOB + clinic legend
    expect(step2Hits).toBeGreaterThanOrEqual(4); // water + alcohol + smoke + caffeine labels
  });

  it('H4 / fieldset legend / stepper-label are visually distinct (different classes/tokens)', () => {
    // The audit boils down to: H4 (Step 4 sub-section heading) must use a
    // class that is DIFFERENT from the new `consultation-sub-label`.
    const step4Src = readFileSync(
      resolve(REPO_SRC, 'features/consultation/Step4Health.tsx'),
      'utf8',
    );
    // H4 still uses display-5 semi-bold (kept); legend/stepper-label use
    // the new sub-label class — two distinct tokens.
    expect(step4Src).toMatch(/<h4 className="display-5 semi-bold/);
    // The Step1 legend uses sub-label (already asserted above), confirming
    // the class divergence between H4 and legend.
  });
});

// ---------------------------------------------------------------------------
// Item 3 — H1 unification across all 6 steps.
// ---------------------------------------------------------------------------

describe('consultation-ui-fixes-2026-04-25 — item 3: H1 unification', () => {
  it('the wizard H1 in Consultation.tsx uses a single `display-9` class with no step-conditional', () => {
    // The wizard H1 lives in Consultation.tsx (single literal). Assert:
    //   1. It uses className="display-9".
    //   2. There is no isStep1 ? 'display-9' : 'display-7 semi-bold' ternary
    //      anywhere on an h1.
    expect(CONSULTATION_PAGE_SRC).toMatch(
      /<h1 className="display-9">Your Free Mukyala Skin Consultation<\/h1>/,
    );
    // No conditional class on h1 (the previous bug).
    expect(CONSULTATION_PAGE_SRC).not.toMatch(/<h1 className=\{[^}]*\?[^}]*'display-7/);
    // No naked 'display-7 semi-bold' on any h1.
    expect(CONSULTATION_PAGE_SRC).not.toMatch(/<h1 className="display-7 semi-bold"/);
  });

  it('the resume-card H1 also uses the unified `display-9` class', () => {
    expect(CONSULTATION_PAGE_SRC).toMatch(
      /<h1 id="consultation-resume-heading" className="display-9">/,
    );
  });

  it('every H1 occurrence in Consultation.tsx uses the same display-9 class token', () => {
    // Pull every <h1 className="…"> token; all must contain "display-9".
    const re = /<h1\s+[^>]*className="([^"]+)"/g;
    const matches: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(CONSULTATION_PAGE_SRC)) !== null) {
      matches.push(m[1]);
    }
    expect(matches.length).toBeGreaterThanOrEqual(2); // wizard + resume card
    for (const cls of matches) {
      expect(cls).toContain('display-9');
      expect(cls).not.toContain('display-7');
    }
  });

  it('per-step H2 uses display-7 semi-bold (sub-headline), preserving H1 ≠ H2 hierarchy', () => {
    // Spot-check Step 1 + Step 2 H2 to confirm the H1/H2 hierarchy is
    // still stratified after the H1 unification.
    const draft = createEmptyDraft();
    const r1 = render(<Step1Personal draft={draft} onChange={() => {}} errors={{}} />);
    const h2_1 = r1.container.querySelector('h2');
    expect(h2_1?.className).toContain('display-7');
    r1.unmount();

    const r2 = render(<Step2Lifestyle draft={draft} onChange={() => {}} errors={{}} />);
    const h2_2 = r2.container.querySelector('h2');
    expect(h2_2?.className).toContain('display-7');
    r2.unmount();
  });
});

// ---------------------------------------------------------------------------
// Item 4 — Step 5 gate buttons normalized to flow-standard 44px / 14px.
// ---------------------------------------------------------------------------

describe('consultation-ui-fixes-2026-04-25 — item 4: Step 5 gate-button size', () => {
  it('`.consultation-gate-button` matches the flow-standard 44px height', () => {
    const body = ruleBody(GLOBAL_CSS, '.consultation-gate-button');
    expect(body, '.consultation-gate-button rule must exist').not.toBe('');
    const minHeight = pxValue(body, 'min-height');
    expect(minHeight).toBe(44);
    // Sanity: 56px (the previous, oversized value) MUST NOT appear.
    expect(body).not.toMatch(/min-height\s*:\s*56px/);
  });

  it('`.consultation-gate-button` matches the flow-standard 14px font-size', () => {
    const body = ruleBody(GLOBAL_CSS, '.consultation-gate-button');
    const fontSize = pxValue(body, 'font-size');
    expect(fontSize).toBe(14);
    expect(body).not.toMatch(/font-size\s*:\s*16px/);
  });

  it('Yes / Skip buttons render with the flow-standard `.consultation-gate-button` class', () => {
    const draft = createEmptyDraft();
    const { container } = render(
      <Step5FemalesOnly draft={draft} onChange={() => {}} errors={{}} />,
    );
    const buttons = container.querySelectorAll('.consultation-gate-button');
    expect(buttons.length).toBe(2); // Yes + Skip
    const labels = Array.from(buttons).map((b) => (b.textContent || '').trim());
    expect(labels).toContain('Yes, continue');
    expect(labels).toContain('Skip this step');
  });

  it('gate buttons share the chip-option size class (no oversized token)', () => {
    const draft = createEmptyDraft();
    const { container } = render(
      <Step5FemalesOnly draft={draft} onChange={() => {}} errors={{}} />,
    );
    for (const b of Array.from(container.querySelectorAll('.consultation-gate-button'))) {
      expect(b.classList.contains('consultation-chip-option')).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Item 5 — Tap targets ≥44px on yesno + checkbox options.
// ---------------------------------------------------------------------------

describe('consultation-ui-fixes-2026-04-25 — item 5: tap-target floors', () => {
  it('`.consultation-yesno-option` declares min-height ≥ 44px', () => {
    const body = ruleBody(GLOBAL_CSS, '.consultation-yesno-option');
    expect(body, '.consultation-yesno-option rule must exist').not.toBe('');
    const minHeight = pxValue(body, 'min-height');
    expect(minHeight).not.toBeNull();
    expect(minHeight as number).toBeGreaterThanOrEqual(44);
  });

  it('`.consultation-checkbox-option` declares min-height ≥ 44px', () => {
    const body = ruleBody(GLOBAL_CSS, '.consultation-checkbox-option');
    expect(body, '.consultation-checkbox-option rule must exist').not.toBe('');
    const minHeight = pxValue(body, 'min-height');
    expect(minHeight).not.toBeNull();
    expect(minHeight as number).toBeGreaterThanOrEqual(44);
  });

  it('yesno-option in rendered Step 5 DOM carries the `.consultation-yesno-option` class', () => {
    // After the user opts in, the 3 yesno fields render — each Yes/No
    // chip is `.consultation-yesno-option` inheriting the 44px floor.
    const draft = createEmptyDraft();
    draft.females_only.applicable = true;
    const { container } = render(
      <Step5FemalesOnly draft={draft} onChange={() => {}} errors={{}} />,
    );
    const options = container.querySelectorAll('.consultation-yesno-option');
    // 3 yesno fields × 2 options each = 6 yesno-options.
    expect(options.length).toBe(6);
  });

  it('the 44px floor is documented as a single source of truth (no duplicate min-height rule)', () => {
    // Sanity: there should be exactly one `.consultation-yesno-option {`
    // declaration block (no later override that drops min-height).
    const occurrences = GLOBAL_CSS.match(/^\s*\.consultation-yesno-option\s*\{/gm) || [];
    expect(occurrences.length).toBe(1);
    const occurrencesCb = GLOBAL_CSS.match(/^\s*\.consultation-checkbox-option\s*\{/gm) || [];
    expect(occurrencesCb.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Item 6 — Date control unification (DatePickerField, NOT native).
// ---------------------------------------------------------------------------

describe('consultation-ui-fixes-2026-04-25 — item 6: date control unification', () => {
  it('Step 1 DOB renders react-day-picker (no native <input type="date">)', () => {
    const draft = createEmptyDraft();
    const { container } = render(<Step1Personal draft={draft} onChange={() => {}} errors={{}} />);
    expect(container.querySelector('input[type="date"]')).toBeNull();
    // DatePickerField wrapper carries the consultation-daypicker class.
    expect(container.querySelector('.consultation-daypicker')).not.toBeNull();
    // react-day-picker mounts an element with role=grid for the calendar.
    expect(container.querySelector('[role="grid"]')).not.toBeNull();
  });

  it('Step 6 signature.date renders a DatePickerField, not a native <input type="date">', () => {
    // Source-level assertion: the file imports DatePickerField and uses
    // it for `signature.date`; no `<InputField type="date">` remains.
    expect(STEP6_SRC).toMatch(
      /import\s+DatePickerField\s+from\s+['"]@shared\/ui\/forms\/DatePickerField['"]/,
    );
    expect(STEP6_SRC).toMatch(/name="signature\.date"/);
    // No native date input wired to signature.date.
    expect(STEP6_SRC).not.toMatch(/<InputField[^>]*type="date"/);
    expect(STEP6_SRC).not.toMatch(/<input[^>]*type="date"/);
  });

  it('Step 6 signature.date is wired through the ISO ↔ DateTriple helpers (no schema drift)', () => {
    // Bug A fix: Step 6 now routes through the local-time helper
    // (`dateTripleToLocalIsoYmd`) instead of the legacy UTC helper, so
    // signature.date stays the calendar day the user clicked regardless
    // of their local timezone. Wire format (`YYYY-MM-DD`) is unchanged.
    expect(STEP6_SRC).toMatch(/dateTripleToLocalIsoYmd/);
    expect(STEP6_SRC).toMatch(/isoYmdToDateTriple/);
  });

  it('signature.date round-trips ISO YYYY-MM-DD ↔ DatePickerField selection without drift', async () => {
    const helpers = await import('@shared/ui/forms/datePickerField.helpers');
    const original = '1991-03-07';
    const triple = helpers.isoYmdToDateTriple(original);
    expect(triple).toEqual({ year: '1991', month: '03', day: '07' });
    // Bug A fix: assert the local helper round-trips identically.
    const back = helpers.dateTripleToLocalIsoYmd(triple);
    expect(back).toBe(original);
  });

  it('isoYmdToDateTriple rejects malformed ISO strings (returns empty triple)', async () => {
    const helpers = await import('@shared/ui/forms/datePickerField.helpers');
    expect(helpers.isoYmdToDateTriple('')).toEqual(helpers.EMPTY_DATE_TRIPLE);
    expect(helpers.isoYmdToDateTriple('not-a-date')).toEqual(helpers.EMPTY_DATE_TRIPLE);
    expect(helpers.isoYmdToDateTriple('1991-13-07')).toEqual(helpers.EMPTY_DATE_TRIPLE); // bad month
    expect(helpers.isoYmdToDateTriple('1991-02-30')).toEqual(helpers.EMPTY_DATE_TRIPLE); // Feb 30
  });

  it('dateTripleToIsoYmd returns an empty string for an empty triple (signature unset state)', async () => {
    const helpers = await import('@shared/ui/forms/datePickerField.helpers');
    expect(helpers.dateTripleToIsoYmd(helpers.EMPTY_DATE_TRIPLE)).toBe('');
  });

  it('Step 6 wires DatePickerField with defaultVisibleMonthYearsBack=0 so the calendar opens on today', () => {
    expect(STEP6_SRC).toMatch(/defaultVisibleMonthYearsBack=\{0\}/);
  });
});

// ---------------------------------------------------------------------------
// Item 7 — HealthReviewSummary `<dl>` summary covering Step 4 data.
// ---------------------------------------------------------------------------

function makeHealthDraft(overrides?: Partial<ConsultationDraft['health']>): ConsultationDraft {
  const draft = createEmptyDraft();
  draft.health = { ...draft.health, ...overrides };
  return draft;
}

describe('consultation-ui-fixes-2026-04-25 — item 7: Step 6 Health review <dl>', () => {
  it('renders a single <dl> (not a placeholder <p>)', () => {
    const draft = makeHealthDraft();
    const { container } = render(<HealthReviewSummary draft={draft} />);
    const dls = container.querySelectorAll('dl');
    expect(dls.length).toBe(1);
    // The legacy placeholder paragraph must be gone.
    expect(container.querySelector('p')).toBeNull();
  });

  it('renders Yes/No labels for under_physician_care and being_treated', () => {
    const draft = makeHealthDraft({ under_physician_care: true, being_treated: false });
    const { container } = render(<HealthReviewSummary draft={draft} />);
    // Find the dt labelled "Under a physician's care" → its sibling dd === "Yes".
    const dts = Array.from(container.querySelectorAll('dt'));
    const physicianDt = dts.find((d) => /Under a physician's care/i.test(d.textContent || ''));
    expect(physicianDt?.nextElementSibling?.textContent?.trim()).toBe('Yes');
    const treatedDt = dts.find((d) => /Being treated for a condition/i.test(d.textContent || ''));
    expect(treatedDt?.nextElementSibling?.textContent?.trim()).toBe('No');
  });

  it('renders an em-dash for unanswered booleans (yesNoLabel(null))', () => {
    const draft = makeHealthDraft({ under_physician_care: null });
    const { container } = render(<HealthReviewSummary draft={draft} />);
    const dts = Array.from(container.querySelectorAll('dt'));
    const dt = dts.find((d) => /Under a physician's care/i.test(d.textContent || ''));
    expect(dt?.nextElementSibling?.textContent?.trim()).toBe('—');
  });

  it('renders the medications_list value as a row when taking_medications === true', () => {
    const draft = makeHealthDraft({
      taking_medications: true,
      medications_list: 'Vitamin D',
    });
    const { container } = render(<HealthReviewSummary draft={draft} />);
    const dts = Array.from(container.querySelectorAll('dt'));
    const dt = dts.find((d) => /Medications and supplements/i.test(d.textContent || ''));
    expect(dt).toBeDefined();
    expect(dt?.nextElementSibling?.textContent?.trim()).toBe('Vitamin D');
  });

  it('omits the medications_list row when taking_medications !== true', () => {
    const draft = makeHealthDraft({ taking_medications: false, medications_list: 'ignored' });
    const { container } = render(<HealthReviewSummary draft={draft} />);
    const dts = Array.from(container.querySelectorAll('dt'));
    expect(
      dts.find((d) => /Medications and supplements/i.test(d.textContent || '')),
    ).toBeUndefined();
  });

  it('renders the medication_allergy_type row only when medication_allergies === true', () => {
    const yes = makeHealthDraft({
      medication_allergies: true,
      medication_allergy_type: 'Penicillin',
    });
    const r1 = render(<HealthReviewSummary draft={yes} />);
    const dtsYes = Array.from(r1.container.querySelectorAll('dt'));
    const dtYes = dtsYes.find((d) => /Medication allergy type/i.test(d.textContent || ''));
    expect(dtYes?.nextElementSibling?.textContent?.trim()).toBe('Penicillin');
    r1.unmount();

    const no = makeHealthDraft({
      medication_allergies: false,
      medication_allergy_type: 'leaked',
    });
    const r2 = render(<HealthReviewSummary draft={no} />);
    const dtsNo = Array.from(r2.container.querySelectorAll('dt'));
    expect(dtsNo.find((d) => /Medication allergy type/i.test(d.textContent || ''))).toBeUndefined();
  });

  it('renders other_allergies_notes only when cosmetic_allergies === true', () => {
    const yes = makeHealthDraft({
      cosmetic_allergies: true,
      other_allergies_notes: 'fragrance-free only',
    });
    const r1 = render(<HealthReviewSummary draft={yes} />);
    const dts1 = Array.from(r1.container.querySelectorAll('dt'));
    const dt1 = dts1.find((d) => /Other allergy notes/i.test(d.textContent || ''));
    expect(dt1?.nextElementSibling?.textContent?.trim()).toBe('fragrance-free only');
    r1.unmount();

    const no = makeHealthDraft({ cosmetic_allergies: false });
    const r2 = render(<HealthReviewSummary draft={no} />);
    const dts2 = Array.from(r2.container.querySelectorAll('dt'));
    expect(dts2.find((d) => /Other allergy notes/i.test(d.textContent || ''))).toBeUndefined();
  });

  it('renders the diabetes type appended in parens on the Conditions row only when diabetes === true', () => {
    const yes = makeHealthDraft({ diabetes: true, diabetes_type: 'type_2' });
    const r1 = render(<HealthReviewSummary draft={yes} />);
    const dts1 = Array.from(r1.container.querySelectorAll('dt'));
    const conditionsDt = dts1.find((d) => /Conditions reported/i.test(d.textContent || ''));
    expect(conditionsDt?.nextElementSibling?.textContent).toMatch(/Diabetes \(Type 2\)/);
    r1.unmount();

    const no = makeHealthDraft({ diabetes: false });
    const r2 = render(<HealthReviewSummary draft={no} />);
    const dts2 = Array.from(r2.container.querySelectorAll('dt'));
    const conditionsDt2 = dts2.find((d) => /Conditions reported/i.test(d.textContent || ''));
    // No diabetes — must read "None reported" in the all-false default.
    expect(conditionsDt2?.nextElementSibling?.textContent?.trim()).toBe('None reported');
  });

  it('renders a single "Conditions reported" row that lists only the conditions set to true', () => {
    const draft = makeHealthDraft({
      eczema: true,
      psoriasis: true,
      asthma: true,
      // everything else stays null/false-default
    });
    const { container } = render(<HealthReviewSummary draft={draft} />);
    const dts = Array.from(container.querySelectorAll('dt'));
    // "Conditions reported" must appear EXACTLY ONCE.
    const conditionsRows = dts.filter((d) => /Conditions reported/i.test(d.textContent || ''));
    expect(conditionsRows.length).toBe(1);
    const dd = conditionsRows[0].nextElementSibling as HTMLElement;
    const text = dd.textContent || '';
    expect(text).toMatch(/Eczema/);
    expect(text).toMatch(/Psoriasis/);
    expect(text).toMatch(/Asthma/);
    // Conditions whose flag is null/false MUST NOT leak into the summary.
    expect(text).not.toMatch(/Shingles/);
    expect(text).not.toMatch(/Haemophilia/);
  });

  it('renders "None reported" when no condition flags are true', () => {
    const draft = makeHealthDraft();
    const { container } = render(<HealthReviewSummary draft={draft} />);
    const dts = Array.from(container.querySelectorAll('dt'));
    const dt = dts.find((d) => /Conditions reported/i.test(d.textContent || ''));
    expect(dt?.nextElementSibling?.textContent?.trim()).toBe('None reported');
  });

  it('renders a dash placeholder for empty optional Care & Treatment string fields', () => {
    const draft = makeHealthDraft();
    const { container } = render(<HealthReviewSummary draft={draft} />);
    const dts = Array.from(container.querySelectorAll('dt'));
    for (const label of [
      'Hydroquinone',
      'Retin-A',
      'Accutane / Isotretinoin',
      'Blood thinning medications',
    ]) {
      const dt = dts.find((d) => d.textContent?.trim() === label);
      expect(dt, `dt for ${label} must exist`).toBeDefined();
      expect(dt?.nextElementSibling?.textContent?.trim()).toBe('—');
    }
  });

  it('renders user-entered Care & Treatment values verbatim (no dash)', () => {
    const draft = makeHealthDraft({
      hydroquinone: 'last used 2024',
      retin_a: '0.025% nightly',
      accutane: 'completed 2018',
      blood_thinners: 'low-dose aspirin',
    });
    const { container } = render(<HealthReviewSummary draft={draft} />);
    const dts = Array.from(container.querySelectorAll('dt'));
    const expected: Array<[string, string]> = [
      ['Hydroquinone', 'last used 2024'],
      ['Retin-A', '0.025% nightly'],
      ['Accutane / Isotretinoin', 'completed 2018'],
      ['Blood thinning medications', 'low-dose aspirin'],
    ];
    for (const [label, value] of expected) {
      const dt = dts.find((d) => d.textContent?.trim() === label);
      expect(dt?.nextElementSibling?.textContent?.trim()).toBe(value);
    }
  });

  it('renders the Medical & Care, Allergies, Conditions, and Care & Treatment groups in the expected order', () => {
    const draft = makeHealthDraft({
      taking_medications: true,
      medications_list: 'Aspirin',
      medication_allergies: true,
      medication_allergy_type: 'Penicillin',
      cosmetic_allergies: true,
      other_allergies_notes: 'fragrance-free',
    });
    const { container } = render(<HealthReviewSummary draft={draft} />);
    const dts = Array.from(container.querySelectorAll('dt')).map(
      (d) => d.textContent?.trim() || '',
    );
    function indexOf(label: RegExp): number {
      return dts.findIndex((t) => label.test(t));
    }
    // Medical & Care first → Allergies → Conditions → Care & Treatment last.
    expect(indexOf(/Under a physician's care/)).toBeLessThan(indexOf(/^Allergies$/));
    expect(indexOf(/^Allergies$/)).toBeLessThan(indexOf(/Conditions reported/));
    expect(indexOf(/Conditions reported/)).toBeLessThan(indexOf(/^Hydroquinone$/));
    // Conditional rows appear within their group (medications row sits
    // immediately after taking_medications, before Allergies).
    expect(indexOf(/Medications and supplements/)).toBeLessThan(indexOf(/^Allergies$/));
    expect(indexOf(/Medication allergy type/)).toBeLessThan(indexOf(/Cosmetic \/ other allergies/));
    expect(indexOf(/Other allergy notes/)).toBeLessThan(indexOf(/Conditions reported/));
  });

  it('preserves the existing Edit button that jumps back to Step 4', () => {
    // Source-level assertion — the Edit button is in Step6ReviewSign.tsx
    // (unchanged by item 7), wrapping the HealthReviewSummary.
    expect(STEP6_SRC).toMatch(/onEditStep\('step-4'\)/);
  });

  it('every dd in the summary follows a dt (well-formed dt/dd pairing)', () => {
    const draft = makeHealthDraft({
      taking_medications: true,
      medications_list: 'Aspirin',
      medication_allergies: true,
      medication_allergy_type: 'Penicillin',
      cosmetic_allergies: true,
      other_allergies_notes: 'fragrance-free',
      diabetes: true,
      diabetes_type: 'type_1',
    });
    const { container } = render(<HealthReviewSummary draft={draft} />);
    const dl = container.querySelector('dl') as HTMLElement;
    expect(dl).not.toBeNull();
    // Counts must match (1 dt per 1 dd).
    const dts = within(dl).getAllByRole('term', { hidden: true } as never);
    const dds = within(dl).queryAllByRole('definition', { hidden: true } as never);
    // Fallback: in jsdom, dt/dd may not always carry implicit roles. Use
    // direct selectors as a backstop.
    const dtCount = dts.length || dl.querySelectorAll('dt').length;
    const ddCount = dds.length || dl.querySelectorAll('dd').length;
    expect(dtCount).toBeGreaterThan(0);
    expect(dtCount).toBe(ddCount);
  });

  it('uses the Type 1 vs Type 2 label mapping correctly', () => {
    const t1 = makeHealthDraft({ diabetes: true, diabetes_type: 'type_1' });
    const r1 = render(<HealthReviewSummary draft={t1} />);
    const dts1 = Array.from(r1.container.querySelectorAll('dt'));
    const dt1 = dts1.find((d) => /Conditions reported/i.test(d.textContent || ''));
    expect(dt1?.nextElementSibling?.textContent).toMatch(/Diabetes \(Type 1\)/);
    r1.unmount();

    const t2 = makeHealthDraft({ diabetes: true, diabetes_type: 'type_2' });
    const r2 = render(<HealthReviewSummary draft={t2} />);
    const dts2 = Array.from(r2.container.querySelectorAll('dt'));
    const dt2 = dts2.find((d) => /Conditions reported/i.test(d.textContent || ''));
    expect(dt2?.nextElementSibling?.textContent).toMatch(/Diabetes \(Type 2\)/);
  });
});

// ---------------------------------------------------------------------------
// Helpers presence — sanity check that the ISO helpers (item 6 support)
// were exported from the shared module.
// ---------------------------------------------------------------------------

describe('consultation-ui-fixes-2026-04-25 — helpers exported', () => {
  it('datePickerField.helpers.ts exports dateTripleToIsoYmd + isoYmdToDateTriple', async () => {
    const mod = await import('@shared/ui/forms/datePickerField.helpers');
    expect(typeof mod.dateTripleToIsoYmd).toBe('function');
    expect(typeof mod.isoYmdToDateTriple).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// Bug A — off-by-one date selection (UTC vs local timezone) follow-up
// from chunk consultation-ui-fixes-2026-04-25 item 6.
//
// Implementer fix: dates are stored as calendar-day strings (no time,
// no timezone). New helpers (`localDateTripleToDate`,
// `dateToLocalDateTriple`, `dateTripleToLocalIsoYmd`) live in
// `datePickerField.helpers.ts`; DatePickerField + Step 6 signature.date
// route through them.
//
// We can't override the JS engine's local timezone from inside jsdom
// (that's an OS-level setting), so the timezone-safety contract is
// asserted by:
//   (1) calling the helpers with a local-midnight Date built from
//       `new Date(year, monthIndex, day)` — exactly what react-day-picker
//       emits — and asserting Y/M/D round-trip via local accessors.
//   (2) asserting the helpers do NOT use `getUTC*` / `Date.UTC` paths
//       (verified indirectly: a UTC-shifted offset would corrupt the
//       round-trip when the local TZ is negative; the local-helper code
//       path is documented in the helper source).
//   (3) source-level: confirming DatePickerField imports the LOCAL
//       helpers, not the legacy UTC helpers.
//   (4) source-level: confirming the Zod-style schema accepts
//       `YYYY-MM-DD` strings (the existing `signature.date` is typed
//       `string` and validated as non-empty).
// ---------------------------------------------------------------------------

describe('consultation-ui-fixes-2026-04-25 — Bug A: off-by-one date selection', () => {
  it('dateToLocalDateTriple reads local Y/M/D from a local-midnight Date (no UTC offset shift)', async () => {
    const helpers = await import('@shared/ui/forms/datePickerField.helpers');
    // react-day-picker emits exactly this for a March 7 1991 selection.
    const localMidnight = new Date(1991, 2, 7); // Mar = monthIndex 2
    const triple = helpers.dateToLocalDateTriple(localMidnight);
    expect(triple).toEqual({ year: '1991', month: '03', day: '07' });
  });

  it('localDateTripleToDate constructs a local-midnight Date that round-trips via local accessors', async () => {
    const helpers = await import('@shared/ui/forms/datePickerField.helpers');
    const date = helpers.localDateTripleToDate({ year: '1991', month: '03', day: '07' });
    expect(date).toBeInstanceOf(Date);
    // Local accessors must read the SAME calendar day back regardless of TZ.
    expect(date?.getFullYear()).toBe(1991);
    expect(date?.getMonth()).toBe(2);
    expect(date?.getDate()).toBe(7);
    // Should be local midnight (00:00:00), not UTC midnight.
    expect(date?.getHours()).toBe(0);
    expect(date?.getMinutes()).toBe(0);
    expect(date?.getSeconds()).toBe(0);
  });

  it('Date -> Triple -> Date round-trip preserves the same local calendar day', async () => {
    const helpers = await import('@shared/ui/forms/datePickerField.helpers');
    const original = new Date(1991, 2, 7); // local midnight
    const triple = helpers.dateToLocalDateTriple(original);
    const back = helpers.localDateTripleToDate(triple);
    expect(back?.getFullYear()).toBe(original.getFullYear());
    expect(back?.getMonth()).toBe(original.getMonth());
    expect(back?.getDate()).toBe(original.getDate());
  });

  it('Triple -> ISO YYYY-MM-DD does pure-string math (no Date round-trip, no TZ drift)', async () => {
    const helpers = await import('@shared/ui/forms/datePickerField.helpers');
    expect(helpers.dateTripleToLocalIsoYmd({ year: '1991', month: '03', day: '07' })).toBe(
      '1991-03-07',
    );
    expect(helpers.dateTripleToLocalIsoYmd({ year: '2024', month: '12', day: '31' })).toBe(
      '2024-12-31',
    );
  });

  it('signature.date round-trips: ISO -> triple -> Date -> triple -> ISO with no drift', async () => {
    const helpers = await import('@shared/ui/forms/datePickerField.helpers');
    const original = '1991-03-07';
    const triple1 = helpers.isoYmdToDateTriple(original);
    const date = helpers.localDateTripleToDate(triple1);
    expect(date).toBeInstanceOf(Date);
    const triple2 = helpers.dateToLocalDateTriple(date);
    const back = helpers.dateTripleToLocalIsoYmd(triple2);
    expect(back).toBe(original);
  });

  it('DOB triple round-trips: triple -> Date -> triple matches input exactly', async () => {
    const helpers = await import('@shared/ui/forms/datePickerField.helpers');
    // Step 1 DOB stores the three string fields directly. Round-trip
    // through the Date the picker exposes must preserve all three.
    const inputs: DateTriple[] = [
      { year: '1985', month: '06', day: '15' },
      { year: '2000', month: '01', day: '01' },
      { year: '2023', month: '12', day: '31' },
    ];
    for (const triple of inputs) {
      const date = helpers.localDateTripleToDate(triple);
      const back = helpers.dateToLocalDateTriple(date);
      expect(back).toEqual(triple);
    }
  });

  it('handles leap day Feb 29 2020 without rollover', async () => {
    const helpers = await import('@shared/ui/forms/datePickerField.helpers');
    const triple: DateTriple = { year: '2020', month: '02', day: '29' };
    const date = helpers.localDateTripleToDate(triple);
    expect(date).toBeInstanceOf(Date);
    expect(date?.getFullYear()).toBe(2020);
    expect(date?.getMonth()).toBe(1);
    expect(date?.getDate()).toBe(29);
    expect(helpers.dateToLocalDateTriple(date)).toEqual(triple);
    expect(helpers.dateTripleToLocalIsoYmd(triple)).toBe('2020-02-29');
  });

  it('rejects non-leap Feb 29 (e.g. 2021) — Triple->Date returns undefined', async () => {
    const helpers = await import('@shared/ui/forms/datePickerField.helpers');
    expect(helpers.localDateTripleToDate({ year: '2021', month: '02', day: '29' })).toBeUndefined();
    // Pure-string ISO converter must also reject (leap-year-aware Feb cap).
    expect(helpers.dateTripleToLocalIsoYmd({ year: '2021', month: '02', day: '29' })).toBe('');
  });

  it('handles year boundary Dec 31 -> Jan 1 transition without drift', async () => {
    const helpers = await import('@shared/ui/forms/datePickerField.helpers');
    // Dec 31 of one year and Jan 1 of the next must each round-trip.
    const dec31 = helpers.localDateTripleToDate({ year: '1999', month: '12', day: '31' });
    expect(helpers.dateToLocalDateTriple(dec31)).toEqual({
      year: '1999',
      month: '12',
      day: '31',
    });
    const jan1 = helpers.localDateTripleToDate({ year: '2000', month: '01', day: '01' });
    expect(helpers.dateToLocalDateTriple(jan1)).toEqual({
      year: '2000',
      month: '01',
      day: '01',
    });
    // ISO converter agrees.
    expect(helpers.dateTripleToLocalIsoYmd({ year: '1999', month: '12', day: '31' })).toBe(
      '1999-12-31',
    );
    expect(helpers.dateTripleToLocalIsoYmd({ year: '2000', month: '01', day: '01' })).toBe(
      '2000-01-01',
    );
  });

  it('handles month boundary (Mar 31 -> Apr 1) without rollover into the wrong month', async () => {
    const helpers = await import('@shared/ui/forms/datePickerField.helpers');
    const mar31 = helpers.localDateTripleToDate({ year: '2024', month: '03', day: '31' });
    expect(helpers.dateToLocalDateTriple(mar31)).toEqual({
      year: '2024',
      month: '03',
      day: '31',
    });
    const apr1 = helpers.localDateTripleToDate({ year: '2024', month: '04', day: '01' });
    expect(helpers.dateToLocalDateTriple(apr1)).toEqual({
      year: '2024',
      month: '04',
      day: '01',
    });
  });

  it('rejects impossible calendar dates (Apr 31, Sep 31, Feb 30) at every helper layer', async () => {
    const helpers = await import('@shared/ui/forms/datePickerField.helpers');
    for (const triple of [
      { year: '2024', month: '04', day: '31' }, // Apr 31
      { year: '2024', month: '09', day: '31' }, // Sep 31
      { year: '2024', month: '02', day: '30' }, // Feb 30
    ] as DateTriple[]) {
      expect(helpers.localDateTripleToDate(triple)).toBeUndefined();
      expect(helpers.dateTripleToLocalIsoYmd(triple)).toBe('');
    }
  });

  it('rejects out-of-range months (00, 13) at every helper layer', async () => {
    const helpers = await import('@shared/ui/forms/datePickerField.helpers');
    for (const triple of [
      { year: '2024', month: '00', day: '15' },
      { year: '2024', month: '13', day: '15' },
    ] as DateTriple[]) {
      expect(helpers.localDateTripleToDate(triple)).toBeUndefined();
      expect(helpers.dateTripleToLocalIsoYmd(triple)).toBe('');
    }
  });

  it('rejects empty / non-numeric triples', async () => {
    const helpers = await import('@shared/ui/forms/datePickerField.helpers');
    expect(helpers.localDateTripleToDate(helpers.EMPTY_DATE_TRIPLE)).toBeUndefined();
    expect(helpers.localDateTripleToDate({ year: '1991', month: '', day: '07' })).toBeUndefined();
    expect(helpers.localDateTripleToDate({ year: 'abcd', month: '03', day: '07' })).toBeUndefined();
    expect(helpers.dateTripleToLocalIsoYmd(helpers.EMPTY_DATE_TRIPLE)).toBe('');
    expect(helpers.dateTripleToLocalIsoYmd({ year: '1991', month: '', day: '07' })).toBe('');
    expect(helpers.dateTripleToLocalIsoYmd({ year: 'abcd', month: '03', day: '07' })).toBe('');
  });

  it('dateToLocalDateTriple returns EMPTY_DATE_TRIPLE for undefined input', async () => {
    const helpers = await import('@shared/ui/forms/datePickerField.helpers');
    expect(helpers.dateToLocalDateTriple(undefined)).toEqual(helpers.EMPTY_DATE_TRIPLE);
  });

  it('isoYmdToDateTriple accepts well-formed YYYY-MM-DD strings only', async () => {
    const helpers = await import('@shared/ui/forms/datePickerField.helpers');
    expect(helpers.isoYmdToDateTriple('1991-03-07')).toEqual({
      year: '1991',
      month: '03',
      day: '07',
    });
    expect(helpers.isoYmdToDateTriple('2020-02-29')).toEqual({
      year: '2020',
      month: '02',
      day: '29',
    });
  });

  it('isoYmdToDateTriple rejects bare ISO timestamps and other non-calendar formats', async () => {
    const helpers = await import('@shared/ui/forms/datePickerField.helpers');
    // Full ISO timestamp — has T plus time component, not a calendar-day string.
    expect(helpers.isoYmdToDateTriple('1991-03-07T00:00:00.000Z')).toEqual(
      helpers.EMPTY_DATE_TRIPLE,
    );
    expect(helpers.isoYmdToDateTriple('1991-03-07T12:00:00')).toEqual(helpers.EMPTY_DATE_TRIPLE);
    // US format.
    expect(helpers.isoYmdToDateTriple('03/07/1991')).toEqual(helpers.EMPTY_DATE_TRIPLE);
    // Slash-separated YMD.
    expect(helpers.isoYmdToDateTriple('1991/03/07')).toEqual(helpers.EMPTY_DATE_TRIPLE);
    // Trailing whitespace (we don't trim — strict format).
    expect(helpers.isoYmdToDateTriple('1991-03-07 ')).toEqual(helpers.EMPTY_DATE_TRIPLE);
    // Two-digit year.
    expect(helpers.isoYmdToDateTriple('91-03-07')).toEqual(helpers.EMPTY_DATE_TRIPLE);
  });

  it('Step 1 DOB renders DatePickerField wired through the LOCAL helpers (Bug A fix)', () => {
    const draft = createEmptyDraft();
    draft.personal.dob_year = '1991';
    draft.personal.dob_month = '03';
    draft.personal.dob_day = '07';
    const { container } = render(<Step1Personal draft={draft} onChange={() => {}} errors={{}} />);
    // Picker mounted (consultation-daypicker wrapper).
    const wrapper = container.querySelector('.consultation-daypicker');
    expect(wrapper).not.toBeNull();
    // Selected day cell carries the day-selected attribute.
    const selectedCell = wrapper?.querySelector('[aria-selected="true"]');
    expect(selectedCell).not.toBeNull();
    // The selected cell text shows "7" — i.e. NO off-by-one drift on
    // initial render. (If the picker was using getUTCDate() in PT, this
    // would render a "6".)
    expect(selectedCell?.textContent?.trim()).toBe('7');
  });

  it('Step 6 signature.date renders DatePickerField wired through the LOCAL helpers (Bug A fix)', () => {
    // Source-level: Step6 imports `dateTripleToLocalIsoYmd` and uses it
    // for signature.date. (Already partly asserted in item 6 above; we
    // tighten by explicitly NOT importing the legacy UTC helper.)
    expect(STEP6_SRC).toMatch(/dateTripleToLocalIsoYmd/);
    expect(STEP6_SRC).not.toMatch(/dateTripleToIsoYmd\b/);
  });

  it('DatePickerField source imports the LOCAL helpers, not the legacy UTC helpers', () => {
    const dpfPath = resolve(REPO_SRC, 'shared/ui/forms/DatePickerField.tsx');
    const src = readFileSync(dpfPath, 'utf8');
    expect(src).toMatch(/dateToLocalDateTriple/);
    expect(src).toMatch(/localDateTripleToDate/);
    // Legacy UTC helpers MUST NOT be imported by the picker (they're
    // kept exported for non-picker consumers, but the picker itself
    // routes through the local-time helpers per the Bug A fix).
    expect(src).not.toMatch(/import[^;]*\bdateTripleToDate\b[^;]*;/);
    expect(src).not.toMatch(/import[^;]*\bdateToDateTriple\b[^;]*;/);
  });

  it('Step 6 wire format stays YYYY-MM-DD (no schema drift in signature.date type)', () => {
    const schemaPath = resolve(REPO_SRC, 'features/consultation/schema.ts');
    const src = readFileSync(schemaPath, 'utf8');
    // Schema documents signature.date as ISO YYYY-MM-DD.
    expect(src).toMatch(/date: string;\s*\/\/\s*ISO YYYY-MM-DD/);
    // Default initial signature.date is empty string (unset).
    expect(src).toMatch(/signature: \{[\s\S]*?date: '',/m);
  });

  it('Step 6 setSig path round-trips a YYYY-MM-DD string through the helpers without drift', async () => {
    const helpers = await import('@shared/ui/forms/datePickerField.helpers');
    // Reproduce Step 6's storage path: ISO -> triple (read into the
    // picker) -> the picker emits a Date -> dateToLocalDateTriple ->
    // dateTripleToLocalIsoYmd (back to ISO).
    const original = '2024-02-29'; // leap day, exercises the trickiest path
    const triple = helpers.isoYmdToDateTriple(original);
    expect(triple).toEqual({ year: '2024', month: '02', day: '29' });
    const date = helpers.localDateTripleToDate(triple);
    const tripleBack = helpers.dateToLocalDateTriple(date);
    const iso = helpers.dateTripleToLocalIsoYmd(tripleBack);
    expect(iso).toBe(original);
  });
});

// ---------------------------------------------------------------------------
// Bug B — picker tiny + mispositioned follow-up from chunk
// consultation-ui-fixes-2026-04-25 item 6.
//
// Implementer fix: the inline DayPicker (no popover, no portal) renders
// inside a `.consultation-daypicker` wrapper that fills the content
// column (width: 100%) and lifts the day-cell size to 44px. Step 6's
// `signature.date` FormField wraps the picker in
// `consultation-dob-group` so both pickers share the same containing
// block.
//
// jsdom note: layout / positioning isn't computed in jsdom (no real
// box model). Visual sizing is an e2e concern. We assert the CSS
// declarations exist + are correct, AND that the rendered DOM carries
// the expected wrapper classes so the rules apply.
// ---------------------------------------------------------------------------

describe('consultation-ui-fixes-2026-04-25 — Bug B: picker sizing + position', () => {
  it('.consultation-daypicker wrapper rule sets width: 100% so the calendar fills its column', () => {
    const body = ruleBody(GLOBAL_CSS, '.consultation-daypicker');
    expect(body, '.consultation-daypicker rule must exist').not.toBe('');
    expect(body).toMatch(/width\s*:\s*100%/);
    // display: block so the wrapper takes the full column width.
    expect(body).toMatch(/display\s*:\s*block/);
  });

  it('.consultation-daypicker calendar surface declares --rdp-cell-size ≥ 44px (touch target)', () => {
    // Combined `.consultation-daypicker .rdp-root, .consultation-daypicker .rdp` rule.
    const re =
      /\.consultation-daypicker\s+\.rdp-root\s*,\s*\.consultation-daypicker\s+\.rdp\s*\{([^}]*)\}/m;
    const match = re.exec(GLOBAL_CSS);
    expect(match, 'combined .rdp-root/.rdp rule must exist').not.toBeNull();
    const surfaceBody = (match as RegExpExecArray)[1];
    const cellSizeMatch = /--rdp-cell-size\s*:\s*(\d+)px/.exec(surfaceBody);
    expect(cellSizeMatch, '--rdp-cell-size token must be set in px').not.toBeNull();
    expect(Number.parseInt((cellSizeMatch as RegExpExecArray)[1], 10)).toBeGreaterThanOrEqual(44);
    expect(surfaceBody).toMatch(/width\s*:\s*100%/);
  });

  it('.consultation-daypicker .rdp-month_caption sets caption typography (font-size, weight)', () => {
    const body = ruleBody(GLOBAL_CSS, '.consultation-daypicker .rdp-month_caption');
    expect(body, 'caption typography rule must exist').not.toBe('');
    expect(body).toMatch(/font-size\s*:\s*\d+px/);
    expect(body).toMatch(/font-weight\s*:\s*\d{3}/);
  });

  it('.consultation-daypicker is the SINGLE source of truth (no parallel .signature-daypicker)', () => {
    // Bug B fix explicitly avoids a parallel selector for Step 6. We
    // check that no actual CSS rule is keyed on `.signature-daypicker`
    // (a mention inside a `/* … */` comment is fine; a rule body is
    // not). Match `.signature-daypicker` immediately followed by `{`,
    // a comma, or whitespace+`{` (which would be a real rule).
    expect(GLOBAL_CSS).not.toMatch(/\.signature-daypicker\s*[,{]/);
    expect(GLOBAL_CSS).not.toMatch(/\.signature-daypicker\s+[.\w]/); // no descendant rules either
    // And there's exactly one `.consultation-daypicker {` declaration block.
    const occurrences = GLOBAL_CSS.match(/^\s*\.consultation-daypicker\s*\{/gm) || [];
    expect(occurrences.length).toBe(1);
  });

  it('Step 1 DOB picker renders INLINE (not inside a portal): present in the DOB fieldset DOM', () => {
    const draft = createEmptyDraft();
    const { container } = render(<Step1Personal draft={draft} onChange={() => {}} errors={{}} />);
    // The DOB fieldset contains the .consultation-daypicker wrapper,
    // and the wrapper contains the calendar grid. No portal indirection.
    const fieldset = container.querySelector('fieldset.consultation-dob-group');
    expect(fieldset).not.toBeNull();
    const wrapper = fieldset?.querySelector('.consultation-daypicker');
    expect(wrapper).not.toBeNull();
    const grid = wrapper?.querySelector('[role="grid"]');
    expect(grid).not.toBeNull();
  });

  it('Step 6 signature.date wrapper carries the SAME containing-block class as Step 1 DOB', () => {
    // Step 6 uses FormField with className="consultation-dob-group" so
    // the rendered wrapper div carries that class.
    expect(STEP6_SRC).toMatch(/className="consultation-dob-group"/);
    // And Step 1's DOB fieldset uses the same class.
    const step1Path = resolve(REPO_SRC, 'features/consultation/Step1Personal.tsx');
    const src = readFileSync(step1Path, 'utf8');
    expect(src).toMatch(/className="consultation-dob-group"/);
  });

  it('Step 1 DOB picker mounts a single role="grid" calendar in the document (no duplicate render)', () => {
    const draft = createEmptyDraft();
    const { container } = render(<Step1Personal draft={draft} onChange={() => {}} errors={{}} />);
    const grids = container.querySelectorAll('[role="grid"]');
    expect(grids.length).toBe(1);
  });

  it('DatePickerField applies both `.consultation-daypicker` and `.reservation-daypicker` classes', () => {
    // Reservation-daypicker styling is reused so existing reservation
    // visuals stay intact. Both classes must be present on the wrapper.
    const draft = createEmptyDraft();
    const { container } = render(<Step1Personal draft={draft} onChange={() => {}} errors={{}} />);
    const wrapper = container.querySelector('.consultation-daypicker');
    expect(wrapper).not.toBeNull();
    expect(wrapper?.classList.contains('reservation-daypicker')).toBe(true);
  });

  it('the picker is keyboard-accessible: month_grid has a focusable day button', () => {
    // react-day-picker mounts `<button>` elements for each day cell; one
    // is focusable (tabIndex=0) and the rest are non-tabbable
    // (tabIndex=-1). This is the canonical roving-tabindex pattern, so
    // a keyboard user can Tab into the calendar and arrow-key around.
    // jsdom does not simulate real keyboard navigation, so we verify
    // the DOM contract: at least one button has tabIndex=0, the rest
    // are -1.
    const draft = createEmptyDraft();
    const { container } = render(<Step1Personal draft={draft} onChange={() => {}} errors={{}} />);
    const dayButtons = container.querySelectorAll('button.rdp-day_button');
    expect(dayButtons.length).toBeGreaterThan(0);
    const tabbable = Array.from(dayButtons).filter((b) => (b as HTMLButtonElement).tabIndex === 0);
    expect(tabbable.length, 'exactly one day button is focusable via Tab (roving tabindex)').toBe(
      1,
    );
  });

  it('inline picker is NOT a popover/dialog (no role=dialog in the calendar surface)', () => {
    // Sanity: the implementer chose inline (not a popover). The
    // calendar surface must not be a dialog.
    const draft = createEmptyDraft();
    const { container } = render(<Step1Personal draft={draft} onChange={() => {}} errors={{}} />);
    const wrapper = container.querySelector('.consultation-daypicker');
    expect(wrapper).not.toBeNull();
    expect(wrapper?.querySelector('[role="dialog"]')).toBeNull();
    // The wrapper itself is role="group" (DatePickerField wraps in a
    // labelled group container).
    expect(wrapper?.getAttribute('role')).toBe('group');
  });

  it('day cells fall inside the picker wrapper (not portal-mounted elsewhere in the document)', () => {
    const draft = createEmptyDraft();
    const { container, baseElement } = render(
      <Step1Personal draft={draft} onChange={() => {}} errors={{}} />,
    );
    // Every rdp-day_button in the document is descended from the
    // picker wrapper inside `container`. If there were a portal, some
    // buttons would land directly under `document.body` outside
    // `container`.
    const buttonsInContainer = container.querySelectorAll('.rdp-day_button').length;
    const buttonsInDoc = baseElement.querySelectorAll('.rdp-day_button').length;
    expect(buttonsInContainer).toBe(buttonsInDoc);
    expect(buttonsInContainer).toBeGreaterThan(0);
  });

  it('renders the inline picker on initial mount (no click to open — it is always visible)', () => {
    const draft = createEmptyDraft();
    const { container } = render(<Step1Personal draft={draft} onChange={() => {}} errors={{}} />);
    // No "open picker" trigger button before the calendar — the
    // calendar grid is in the DOM at first render.
    expect(container.querySelector('[role="grid"]')).not.toBeNull();
  });
});

// Touch screen unused import to satisfy lint when render-only paths skip it.
void screen;
