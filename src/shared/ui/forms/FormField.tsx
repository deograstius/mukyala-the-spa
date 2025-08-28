import * as React from 'react';

export interface FormFieldProps {
  id: string;
  label: string;
  labelHidden?: boolean;
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

  const child = React.cloneElement(children, {
    id,
    'aria-invalid': !!error || undefined,
    'aria-describedby': describedBy,
  });

  return (
    <div className={className}>
      <label htmlFor={id} className={labelHidden ? 'visually-hidden' : undefined}>
        {label}
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
