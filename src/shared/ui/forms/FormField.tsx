import * as React from 'react';

export interface FormFieldProps {
  id: string;
  label: string;
  labelHidden?: boolean;
  /**
   * When true, render a visible "*" after the label (in neutral-600) plus a
   * visually-hidden " (required)" string for screen readers. Does not change
   * validation behaviour — that lives in the page-level validator.
   */
  required?: boolean;
  error?: string;
  helpText?: string;
  helpId?: string;
  className?: string;
  children: React.ReactElement;
}

/**
 * Wraps a single form control with label, help text, and error messaging.
 * Injects aria-invalid and aria-describedby onto the child control.
 */
export default function FormField({
  id,
  label,
  labelHidden,
  required,
  error,
  helpText,
  helpId,
  className,
  children,
}: FormFieldProps) {
  const errorId = `${id}-error`;
  const resolvedHelpId = helpId ?? (helpText ? `${id}-help` : undefined);
  const describedBy =
    [resolvedHelpId, error ? errorId : undefined].filter(Boolean).join(' ') || undefined;

  type Augment = {
    id?: string;
    'aria-invalid'?: boolean;
    'aria-describedby'?: string;
  };
  const child = React.cloneElement(children as React.ReactElement<Augment>, {
    id,
    'aria-invalid': !!error || undefined,
    'aria-describedby': describedBy,
  } satisfies Augment);

  return (
    <div className={className}>
      <label htmlFor={id} className={labelHidden ? 'visually-hidden' : undefined}>
        {label}
        {required ? (
          <>
            <span className="required-asterisk" aria-hidden="true">
              *
            </span>
            <span className="visually-hidden"> (required)</span>
          </>
        ) : null}
      </label>
      {child}
      {resolvedHelpId && helpText ? (
        <div id={resolvedHelpId} className="paragraph-small">
          {helpText}
        </div>
      ) : null}
      {error ? (
        <span id={errorId} className="form-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
