/**
 * Local YesNoField helper for the consultation wizard.
 *
 * Renders a boolean Yes/No question as a `<fieldset>` with two radio inputs.
 * Promoting this to `src/shared/ui/forms/YesNoField.tsx` is intentionally
 * deferred to the ui agent (see pm_recommendations.backlog) so the consultation
 * chunk does not balloon into a primitives refactor.
 */

export interface YesNoFieldProps {
  name: string;
  legend: string;
  value: boolean | null;
  onChange: (next: boolean) => void;
  error?: string;
  helpText?: string;
  className?: string;
  disabled?: boolean;
  /**
   * When true, render a visible "*" after the legend plus a visually-hidden
   * " (required)" hint for screen readers. Does not change validation.
   */
  required?: boolean;
  /** Optional `data-long="true"` hint for the Step 4 conditions grid. */
  dataLong?: boolean;
}

export default function YesNoField({
  name,
  legend,
  value,
  onChange,
  error,
  helpText,
  className,
  disabled,
  required,
  dataLong,
}: YesNoFieldProps) {
  const baseId = name.replace(/[^a-zA-Z0-9_-]/g, '-');
  const helpId = helpText ? `${baseId}-help` : undefined;
  const errorId = error ? `${baseId}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined;
  const yesId = `${baseId}-yes`;
  const noId = `${baseId}-no`;
  return (
    <fieldset
      className={className}
      aria-describedby={describedBy}
      data-long={dataLong ? 'true' : undefined}
    >
      <legend className="mg-bottom-8px paragraph-medium semi-bold">
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
      <div className="consultation-yesno-row" role="radiogroup">
        <label htmlFor={yesId} className="consultation-yesno-option">
          <input
            type="radio"
            id={yesId}
            name={name}
            value="yes"
            checked={value === true}
            onChange={() => onChange(true)}
            disabled={disabled}
          />
          <span>Yes</span>
        </label>
        <label htmlFor={noId} className="consultation-yesno-option">
          <input
            type="radio"
            id={noId}
            name={name}
            value="no"
            checked={value === false}
            onChange={() => onChange(false)}
            disabled={disabled}
          />
          <span>No</span>
        </label>
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

/**
 * Local CheckboxGroup helper. Same scope rationale as YesNoField above.
 */
export interface CheckboxGroupOption<T extends string> {
  value: T;
  label: string;
}

export interface CheckboxGroupProps<T extends string> {
  name: string;
  legend: string;
  options: ReadonlyArray<CheckboxGroupOption<T>>;
  value: ReadonlyArray<T>;
  onChange: (next: T[]) => void;
  error?: string;
  className?: string;
}

export function CheckboxGroup<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  error,
  className,
}: CheckboxGroupProps<T>) {
  const baseId = name.replace(/[^a-zA-Z0-9_-]/g, '-');
  const errorId = error ? `${baseId}-error` : undefined;
  function toggle(opt: T) {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  }
  return (
    <fieldset className={className} aria-describedby={errorId}>
      <legend className="mg-bottom-8px display-5 semi-bold">{legend}</legend>
      <div className="consultation-checkbox-list">
        {options.map((opt) => {
          const id = `${baseId}-${opt.value}`;
          return (
            <label key={opt.value} htmlFor={id} className="consultation-checkbox-option">
              <input
                type="checkbox"
                id={id}
                name={name}
                value={opt.value}
                checked={value.includes(opt.value)}
                onChange={() => toggle(opt.value)}
              />
              <span>{opt.label}</span>
            </label>
          );
        })}
      </div>
      {error ? (
        <span id={errorId} className="form-error" role="alert">
          {error}
        </span>
      ) : null}
    </fieldset>
  );
}
