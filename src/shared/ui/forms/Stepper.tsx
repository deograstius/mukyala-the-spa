/**
 * Stepper — bounded numeric input rendered as `[−] value [+]`.
 *
 * Replaces native numeric inputs in Step 2 (water/alcohol/smoke/caffeine
 * counts) per team_lead NOTES §4 (Q4 / decision rules cheat-sheet).
 *
 * The wire format for these fields is a numeric STRING (see
 * `ConsultationDraft.lifestyle.*_per_*: string`). The stepper accepts/emits
 * a string to keep the schema unchanged — it parses to int internally for
 * arithmetic but emits `String(clamped)` back via `onChange`.
 *
 * Touch targets: minus / plus buttons are each ≥44px on each side
 * (`.consultation-stepper-button`).
 *
 * Keyboard:
 *   - ArrowUp / ArrowRight → increment by `step`
 *   - ArrowDown / ArrowLeft → decrement by `step`
 *   - Home → set to `min`
 *   - End → set to `max`
 *
 * ARIA: outer wrapper carries `role="spinbutton"` with
 * `aria-valuenow/min/max`. The value display is wrapped in `<output
 * aria-live="polite">` so screen readers announce changes.
 */

import { useId, useRef, type KeyboardEvent } from 'react';

export interface StepperProps {
  name: string;
  /** ARIA label for the spinbutton group (visible label is rendered by the caller). */
  ariaLabel?: string;
  /** Stringified integer value (matches schema). */
  value: string;
  onChange: (next: string) => void;
  min: number;
  max: number;
  /** Default value used when value is empty and user taps + or − for the first time. */
  defaultValue?: number;
  step?: number;
  /** Suffix shown after the value (e.g. "glasses", "cups"). */
  suffix?: string;
  disabled?: boolean;
  className?: string;
  /** When provided, surfaces a help string for SR users. */
  helpText?: string;
}

export default function Stepper({
  name,
  ariaLabel,
  value,
  onChange,
  min,
  max,
  defaultValue,
  step = 1,
  suffix,
  disabled,
  className,
  helpText,
}: StepperProps) {
  const reactId = useId();
  const helpId = helpText ? `${reactId}-help` : undefined;
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const parsed = value === '' ? null : Number.parseInt(value, 10);
  const fallback = defaultValue ?? min;
  const current = parsed !== null && Number.isFinite(parsed) ? parsed : fallback;

  function clamp(n: number): number {
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  function emit(n: number) {
    if (disabled) return;
    onChange(String(clamp(n)));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;
    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowRight':
        event.preventDefault();
        emit(current + step);
        break;
      case 'ArrowDown':
      case 'ArrowLeft':
        event.preventDefault();
        emit(current - step);
        break;
      case 'Home':
        event.preventDefault();
        emit(min);
        break;
      case 'End':
        event.preventDefault();
        emit(max);
        break;
      default:
        break;
    }
  }

  return (
    <div
      ref={wrapperRef}
      className={className ? `consultation-stepper ${className}` : 'consultation-stepper'}
      role="spinbutton"
      aria-label={ariaLabel ?? name}
      aria-valuenow={current}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-disabled={disabled || undefined}
      aria-describedby={helpId}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      data-name={name}
    >
      <button
        type="button"
        className="consultation-stepper-button"
        aria-label={`Decrease ${ariaLabel ?? name}`}
        disabled={disabled || current <= min}
        onClick={() => emit(current - step)}
        tabIndex={-1}
      >
        −
      </button>
      <output className="consultation-stepper-value" aria-live="polite">
        {value === '' ? fallback : current}
        {suffix ? <span className="consultation-stepper-suffix"> {suffix}</span> : null}
      </output>
      <button
        type="button"
        className="consultation-stepper-button"
        aria-label={`Increase ${ariaLabel ?? name}`}
        disabled={disabled || current >= max}
        onClick={() => emit(current + step)}
        tabIndex={-1}
      >
        +
      </button>
      {helpText ? (
        <span id={helpId} className="visually-hidden">
          {helpText}
        </span>
      ) : null}
    </div>
  );
}
