# Shared Components Overview

Brief reference for common, reusable components and patterns. Keep visuals consistent with existing Webflow classes and prefer these primitives over ad‑hoc markup.

## Layout

- Section: Semantic wrapper for sections. Props: `as`, `className`.
- Container: Standard content width wrapper. Props: `as`, `className`.
- Grid: Minimal wrapper that forwards classes (e.g., `grid-2-columns`).
- List / ListItem: Accessible list structure for grids and collections.
- DetailLayout: Two-column detail page shell with slots: `media`, `title`, `meta`, `description`, `actions`.

## Cards

- ImageCardMedia: Consistent image wrapper for cards (wrapper, overlay, image classes).
- MediaCard: Generic media tile with optional price and actions.
  - Props: `title`, `href`, `priceCents?`, `image*`, class hooks for wrapper/image/overlay/content/title, `rightElement` slot.
  - Use for both products and services to remove duplication.
- OverlayCardLink: Image link with overlay + icon + label (used by Community).
  - Props: `href`, `iconSrc`, `imageSrc(, srcSet, sizes)`, `alt`, `hiddenMobile?`, `label`.

## UI

- Button / ButtonLink: Standard button styles; `variant` (primary|white|link), `size` (md|large).
- ResponsiveImage: `<img>` wrapper with sensible defaults (`loading`, `decoding`).
- SectionHeader: Left-title/right-actions header block for sections.
- Price: Renders currency from `cents` using `utils/currency`.
- Reveal: Scroll-reveal wrappers powered by Framer Motion.
  - `Reveal`: Animates children from slight translateY + opacity 0 to natural position with opacity 1 when scrolled into view.
    - Props: `distance=40` (px), `duration=0.6` (s), `delay=0` (s), `once=true`, `amount=0.2` (viewport intersection).
    - Respects prefers-reduced-motion: renders without animation.
  - `RevealStagger`: Convenience component that applies small incremental delays to a list of children.
    - Props: `interval=0.06` (s), `startDelay=0` (s), plus optional `distance`, `duration`, `once`, `amount` forwarded to each child.
  - Usage:

    ```tsx
    import Reveal, { RevealStagger } from '@shared/ui/Reveal';

    <Reveal>
      <h2 className="display-9 text-center">Featured products</h2>
    </Reveal>

    <RevealStagger>
      {items.map((it) => (
        <Card key={it.id} {...it} />
      ))}
    </RevealStagger>
    ```

## Accessibility

- Dialog: Accessible modal overlay (Escape to close, focus trap, scroll lock). Props: `open`, `onClose`, `ariaLabel`/`ariaLabelledBy`, `panelSelector`, `stayMountedOnClose`.
- SlideOver: Dialog-based side panel with slide in/out + overlay fade.
  - Props: `side`, `width`, `panelAs`, `panelClassName`, `panelStyle`.
- LiveRegion: Visually hidden polite/assertive status region for cart or form updates.

## Forms

- FormField: Wraps a single control, renders label/help/error. Injects `aria-invalid` + `aria-describedby`.
- InputField / SelectField / DateTimeField / PhoneInput: Basic controls with standard classes.
- ChipSegment: Single-select chip group built on native `<input type="radio">` inside a `<fieldset>`. Visual style mirrors `.consultation-yesno-option` / `.reservation-time-slot`. Each chip has a `min-height: 44px` tap target (WCAG AA / iOS HIG).

  ```tsx
  import ChipSegment from '@shared/ui/forms/ChipSegment';

  <ChipSegment
    legend="Skin type"
    name="lifestyle.skin_type"
    value={draft.lifestyle.skin_type}
    options={[
      { label: 'Dry', value: 'dry' },
      { label: 'Oily', value: 'oily' },
    ]}
    onChange={(v) => onChange({ ...draft, lifestyle: { ...draft.lifestyle, skin_type: v } })}
  />;
  ```

- Stepper: Bounded numeric input rendered as `[−] value [+]`. Emits/accepts a stringified integer to keep wire formats stable. `±` buttons are ≥44px tap targets via `.consultation-stepper-button`. Keyboard: Arrow keys ±step, Home/End jump to min/max. Wrap each Stepper in a `.consultation-stepper-field` block (label spans stacked above the control with consistent vertical rhythm). Optional `ariaDescribedBy` merges with the internal SR-only help id so visible helper-text spans wire up to screen readers.

  ```tsx
  import Stepper from '@shared/ui/forms/Stepper';

  <Stepper
    id="lifestyle.water_glasses_per_day"
    label="Water"
    min={0}
    max={20}
    step={1}
    value={draft.lifestyle.water_glasses_per_day}
    onChange={(v) =>
      onChange({ ...draft, lifestyle: { ...draft.lifestyle, water_glasses_per_day: v } })
    }
    ariaDescribedBy="lifestyle-water-help"
  />;
  ```

- DatePickerField: Single-date picker built on `react-day-picker` with year-dropdown navigation. Renders **inline** (not as a popover/dialog) — the calendar grid mounts directly into the surrounding form flow, so there is no `role="dialog"` and no portal. Holds a `Date | undefined` internally and emits a `{day, month, year}` string triple via the **local-time** helpers in `datePickerField.helpers.ts` (`localDateTripleToDate` / `dateToLocalDateTriple`); never via the legacy UTC accessors. Future dates are auto-disabled. Used for both Consultation Step 1 DOB and Step 6 signature.date — replaces the prior 3-cell DOB row and the native `<input type="date">` on Step 6.
  - Calendar-day-string wire format: dates are persisted as plain `YYYY-MM-DD` calendar-day strings (signature.date) or as the three `personal.dob_*` strings (DOB). No `Date` objects, no UTC round-trip, no time component. Use `dateTripleToLocalIsoYmd` (pure string math, no `Date`) to render the ISO form for `signature.date`. The local-time helpers exist to avoid a Pacific Time off-by-one regression where `getUTC*` accessors against a local-midnight Date returned the previous calendar day.
  - Inline-not-popover layout parity: both Step 1 DOB and Step 6 signature.date wrap the picker in `.consultation-dob-group` (containing-block parity) and rely on `.consultation-daypicker` as the single source of truth for sizing (`width: 100%`, `--rdp-cell-size: 44px`, `table-layout: fixed` grid). Do not nest a DatePickerField inside a popover/dialog — the inline pattern is required for the size/position guarantees the e2e suite pins.

  ```tsx
  import DatePickerField from '@shared/ui/forms/DatePickerField';

  <DatePickerField
    name="personal.dob"
    label="Date of birth"
    value={{
      day: draft.personal.dob_day,
      month: draft.personal.dob_month,
      year: draft.personal.dob_year,
    }}
    onChange={(triple) => onChange({ ...draft, personal: { ...draft.personal, ...triple } })}
  />;
  ```

- RevealOnTrigger: Animates conditional reveal fields in/out when `show` flips (200 ms slide+fade, respects `prefers-reduced-motion`). Children unmount after the exit animation.
  - Yes/No gate pattern: pair `YesNoField` with `RevealOnTrigger` to keep an optional sub-block invisible until the user opts in. Step 1's referring-clinic block (`personal.has_referring_clinic` -> `.consultation-clinic-group` with the three `personal.clinic_*` fields) is the canonical example. Even when revealed the gated fields stay optional (omit `required`, do not list in `REQUIRED_FIELDS_BY_STEP`). When the gate flips back to No, `applyRevealClears` (centralized in `src/features/consultation/schema.ts`, invoked by `Consultation.tsx`'s `onChangeDraft`) zeroes the gated values before unmount so stale input never reaches the wire payload.

  ```tsx
  import RevealOnTrigger from '@shared/ui/forms/RevealOnTrigger';

  <YesNoField id="personal.has_referring_clinic" label="Referred by a clinic?" value={f.has_referring_clinic} onChange={...} />
  <RevealOnTrigger show={f.has_referring_clinic === true}>
    <fieldset className="consultation-clinic-group">{/* clinic_name / address / phone */}</fieldset>
  </RevealOnTrigger>
  ```

### Form validation focus utility

- `scrollAndFocusFirstError` (`src/utils/scrollAndFocusFirstError.ts`): Resolves the first invalid field by dotted-path id, scrolls it into view, and focuses it. Fires from Consultation `handleNext` (per-step Next), `handleSubmit` (whole-form re-validation on Step 6), and a post-navigation `useEffect` that runs after `goToStep` commits when a submit failure points to an earlier step. Resolution chain matches the dotted-path `id` mounted by `FormField` / `YesNoField` / `CheckboxGroup`, with a `[data-name]` fallback for `DatePickerField` DOB sub-paths. Smooth-scroll honors `prefers-reduced-motion`; sticky-banner offset is auto-computed from `.consultation-validation-banner` when present. The visible error state remains the existing `<span class="form-error" role="alert">` plus `aria-invalid="true"` on the control (no red outline on the control itself; see `tokens.css` opt-out).

### Consultation typography rungs

Three classes are intentional rungs in the consultation flow type-scale; do not collapse them:

- `.display-9` — Step 1 hero H1 (and the unified consultation H1 across Steps 2–6).
- `.display-7 semi-bold` — per-step H2.
- `.display-5 semi-bold` — H3 (review-section headers, Step 4 condition cards).
- `.consultation-sub-label` (14 px / 600) — fieldset legends + Stepper labels in Step 1 / Step 2. Sits one rung below `display-5 semi-bold` so legends/labels stop competing with section headers.

### Consultation tap-target floors

`.consultation-gate-button`, `.consultation-yesno-option`, `.consultation-checkbox-option`, and `.consultation-chip-option` all share the flow-standard `min-height: 44px` floor (WCAG AA / iOS HIG). Padding (8 px / 12–16 px) is preserved so the floor doesn't read as cramped.

### HealthReviewSummary

Renders the Step 6 review `<dl>` mirroring the Step 4 Health data shape. Lives at `src/features/consultation/HealthReviewSummary.tsx` and inherits `.consultation-review-section dl` grid styling. Groups: Medical & Care, Allergies, Conditions reported (filtered to truthy condition flags), Care & Treatment.

## Utilities & Tokens

- tokens.css: Colors, spacing, radii, z‑index, animations, helpers.
  - Aspect: `.aspect-square` for 1:1 media wrappers.
  - Animations: slide/fade utility classes for overlays/panels.
  - Community: `.social-media-feed---image-overlay` slightly visible by default; brightens on hover.

## Data & Pricing

- Products and services store prices as integers (`priceCents`).
- Render with `Price`; do not compute with formatted strings.
