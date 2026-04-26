/**
 * ChipSegment — single-select chip group primitive.
 *
 * Mirrors the `.reservation-time-slot` / `.consultation-yesno-option`
 * styling so the consultation form reads as a chip-first, "no visible
 * radio dots" UI per the team_lead NOTES
 * (`/Users/deokalule/projects/NOTES/team_lead/2026-04-25-consultation-input-patterns.md`).
 *
 * Renders an accessible `<fieldset>` with one native
 * `<input type="radio">` per option (visually replaced with a chip via the
 * `.consultation-chip-segment` CSS rule). The native radios stay in the
 * DOM so screen readers announce the group correctly and so the browser
 * provides Arrow-key focus traversal + Space/Enter selection for free
 * (radio inputs sharing a `name` attribute).
 */

export interface ChipSegmentOption<T extends string> {
  value: T;
  label: string;
  /** Optional helper string shown only to screen readers. */
  srHint?: string;
  disabled?: boolean;
}

export interface ChipSegmentProps<T extends string> {
  /** Form-name for the underlying radio inputs (must be unique per group). */
  name: string;
  legend: string;
  /** Hide legend visually but keep it for screen readers. */
  legendHidden?: boolean;
  options: ReadonlyArray<ChipSegmentOption<T>>;
  value: T | '' | null;
  onChange: (next: T) => void;
  error?: string;
  helpText?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  /**
   * When set, the segment renders chips one per row (mobile-style stacked).
   * Default is wrap-flow horizontal.
   */
  layout?: 'wrap' | 'stacked';
}

export default function ChipSegment<T extends string>({
  name,
  legend,
  legendHidden,
  options,
  value,
  onChange,
  error,
  helpText,
  required,
  className,
  disabled,
  layout = 'wrap',
}: ChipSegmentProps<T>) {
  const baseId = name.replace(/[^a-zA-Z0-9_-]/g, '-');
  const helpId = helpText ? `${baseId}-help` : undefined;
  const errorId = error ? `${baseId}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <fieldset
      className={className ? `consultation-chip-segment ${className}` : 'consultation-chip-segment'}
      data-layout={layout}
      aria-describedby={describedBy}
      disabled={disabled || undefined}
    >
      <legend
        className={legendHidden ? 'visually-hidden' : 'mg-bottom-8px paragraph-medium semi-bold'}
      >
        {legend}
        {required ? (
          <>
            <span className="required-asterisk" aria-hidden="true">
              *
            </span>
            <span className="visually-hidden"> (required)</span>
          </>
        ) : null}
      </legend>
      <div className="consultation-chip-segment-row" role="radiogroup">
        {options.map((opt) => {
          const id = `${baseId}-${opt.value}`;
          return (
            <label key={opt.value} htmlFor={id} className="consultation-chip-option">
              <input
                type="radio"
                id={id}
                name={name}
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                disabled={disabled || opt.disabled}
              />
              <span>{opt.label}</span>
              {opt.srHint ? <span className="visually-hidden"> {opt.srHint}</span> : null}
            </label>
          );
        })}
      </div>
      {helpId && helpText ? (
        <div id={helpId} className="paragraph-small">
          {helpText}
        </div>
      ) : null}
      {error ? (
        <span id={errorId} className="form-error" role="alert">
          {error}
        </span>
      ) : null}
    </fieldset>
  );
}
