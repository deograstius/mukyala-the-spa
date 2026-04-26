/**
 * DatePickerField — single date picker built on `react-day-picker`.
 *
 * Replaces the 3-cell DOB row (`personal.dob_day` / `dob_month` /
 * `dob_year`) with a single calendar + year-dropdown navigation per
 * team_lead NOTES §2.
 *
 * Wire-format note (CRITICAL — schema is canonical):
 *   The consultation schema stores DOB as three string fields:
 *     personal.dob_day, personal.dob_month, personal.dob_year
 *   This component holds an internal `Date | undefined` derived from the
 *   incoming triple, and emits the same triple via `onChange` after
 *   converting through the pure helpers in `./datePickerField.helpers`.
 *
 *   DO NOT change the schema. The submit transformer
 *   (`flattenDraftForSubmit`) keeps emitting the three string fields.
 *
 * Validation:
 *   - The picker disables future dates (operator decision: enforce only
 *     "not in the future"; do NOT enforce a 13-year minimum since the MD
 *     spec doesn't require it).
 *   - Invalid calendar dates are unrepresentable because the calendar UI
 *     only exposes real dates.
 *
 * Visible-month default:
 *   - When `value` is empty, the calendar opens on `now − defaultVisibleMonthYearsBack`
 *     years (cohort-aware default per NOTES §2; the consultation step
 *     passes `30`).
 *   - Year-dropdown navigation enabled (`captionLayout="dropdown"`) with
 *     `startMonth=Jan minYear` and `endMonth=current month` so future
 *     years are not selectable.
 */

import { useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import {
  dateToLocalDateTriple,
  localDateTripleToDate,
  type DateTriple,
} from './datePickerField.helpers';

export type { DateTriple } from './datePickerField.helpers';

export interface DatePickerFieldProps {
  name: string;
  /** ARIA label for the picker (FormField provides the visible label). */
  ariaLabel?: string;
  value: DateTriple;
  onChange: (next: DateTriple) => void;
  /** Visible-month default when value is empty. Defaults to ~30y back. */
  defaultVisibleMonthYearsBack?: number;
  /** Minimum selectable year. Defaults to 1900. */
  minYear?: number;
  /** Maximum selectable year. Defaults to current year. */
  maxYear?: number;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

export default function DatePickerField({
  name,
  ariaLabel,
  value,
  onChange,
  defaultVisibleMonthYearsBack = 30,
  minYear = 1900,
  maxYear,
  disabled,
  className,
  required,
}: DatePickerFieldProps) {
  // Bug A fix: read/build all bounds via local-time accessors so the
  // "no future dates" gate, min/max month bounds, and the highlighted
  // selection all align with what react-day-picker renders (local
  // midnight per cell).
  const today = useMemo(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  }, []);

  const resolvedMaxYear = maxYear ?? today.getFullYear();
  const startMonth = useMemo(() => new Date(minYear, 0, 1), [minYear]);
  const endMonth = useMemo(
    () => new Date(resolvedMaxYear, today.getMonth(), 1),
    [resolvedMaxYear, today],
  );

  const selected = useMemo(() => localDateTripleToDate(value), [value]);
  const defaultMonth = useMemo(() => {
    if (selected) return selected;
    return new Date(today.getFullYear() - defaultVisibleMonthYearsBack, today.getMonth(), 1);
  }, [selected, today, defaultVisibleMonthYearsBack]);

  function handleSelect(next: Date | undefined) {
    if (disabled) return;
    onChange(dateToLocalDateTriple(next));
  }

  return (
    <div
      className={
        className
          ? `consultation-daypicker reservation-daypicker ${className}`
          : 'consultation-daypicker reservation-daypicker'
      }
      role="group"
      aria-label={ariaLabel ?? name}
      aria-required={required || undefined}
      aria-disabled={disabled || undefined}
      data-name={name}
    >
      <DayPicker
        mode="single"
        captionLayout="dropdown"
        selected={selected}
        defaultMonth={defaultMonth}
        startMonth={startMonth}
        endMonth={endMonth}
        disabled={(d) => {
          // Disallow future dates (operator decision: enforce only
          // "not in the future"; min year is bounded by startMonth).
          // Use local-time accessors — react-day-picker emits local
          // midnight per cell, and `today` above is also local
          // midnight, so direct timestamp comparison is correct.
          const ymd = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          return ymd.getTime() > today.getTime();
        }}
        onSelect={handleSelect}
      />
    </div>
  );
}
