/**
 * Pure helpers for `DatePickerField`.
 *
 * Lives in its own file (not co-located with the component) because the
 * project's eslint `react-refresh/only-export-components` rule forbids
 * mixing helpers/constants with component exports.
 *
 * (chunk: spa-consultation-input-overhaul)
 *
 * Bug A (consultation-ui-fixes-2026-04-25 follow-up — Bug A: off-by-one
 * date selection in negative-offset zones):
 *   `react-day-picker` emits a local-midnight `Date` when the user picks
 *   a calendar cell. The original UTC-based helpers below
 *   (`dateTripleToDate`, `dateToDateTriple`) read/write via
 *   `getUTC*` / `Date.UTC(...)`. In Pacific Time (UTC-7/-8), local
 *   midnight is the previous day in UTC, so `getUTCDate()` returns the
 *   day BEFORE the day the user clicked. Same problem in reverse on
 *   read-back: a UTC-midnight Date displays as the previous day when
 *   `react-day-picker` decides which cell to highlight in local time.
 *
 *   Fix: store dates as calendar-day strings (no time, no timezone) and
 *   convert through helpers that use *local* time consistently
 *   (`dateToLocalDateTriple` / `localDateTripleToDate`). The wire format
 *   stays exactly the same (`YYYY-MM-DD` for `signature.date`; the three
 *   `personal.dob_*` strings for DOB), so this is a pure bug-fix at the
 *   helper boundary — no schema migration.
 *
 *   The legacy UTC helpers stay exported alongside the new local-time
 *   helpers; `DatePickerField` and the Step 6 signature.date flow now
 *   route exclusively through the local-time helpers below. The UTC
 *   helpers remain available for any non-picker consumer that genuinely
 *   wants UTC semantics.
 */

export interface DateTriple {
  /** Two-digit day-of-month string (e.g. "07"). Empty string means unset. */
  day: string;
  /** Two-digit month string (e.g. "03"). Empty string means unset. */
  month: string;
  /** Four-digit year string (e.g. "1991"). Empty string means unset. */
  year: string;
}

/** Empty default triple. Use when seeding state. */
export const EMPTY_DATE_TRIPLE: DateTriple = { day: '', month: '', year: '' };

/**
 * Convert a DateTriple to a UTC Date. Returns undefined when any field is
 * empty or when the triple does not describe a real calendar date
 * (e.g. Feb 30 -> undefined; Date constructor rollover detected).
 */
export function dateTripleToDate(triple: DateTriple): Date | undefined {
  const { day, month, year } = triple;
  if (!day || !month || !year) return undefined;
  const d = Number.parseInt(day, 10);
  const m = Number.parseInt(month, 10);
  const y = Number.parseInt(year, 10);
  if (!Number.isFinite(d) || !Number.isFinite(m) || !Number.isFinite(y)) return undefined;
  // JS months are 0-indexed.
  const out = new Date(Date.UTC(y, m - 1, d));
  if (out.getUTCFullYear() !== y || out.getUTCMonth() !== m - 1 || out.getUTCDate() !== d) {
    return undefined;
  }
  return out;
}

/** Convert a Date to a DateTriple, zero-padding day/month and 4-padding year. */
export function dateToDateTriple(d: Date | undefined): DateTriple {
  if (!d) return EMPTY_DATE_TRIPLE;
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = String(d.getUTCFullYear()).padStart(4, '0');
  return { day, month, year };
}

/**
 * Convert a DateTriple to an ISO `YYYY-MM-DD` string. Returns an empty
 * string when the triple is empty or describes a non-real calendar date.
 *
 * Used by Step 6 (`signature.date`) which stores a single ISO string in
 * the consultation submit payload, while reusing the same DatePickerField
 * primitive Step 1 uses for DOB.
 */
export function dateTripleToIsoYmd(triple: DateTriple): string {
  const d = dateTripleToDate(triple);
  if (!d) return '';
  const year = String(d.getUTCFullYear()).padStart(4, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse an ISO `YYYY-MM-DD` string into a DateTriple. Returns
 * `EMPTY_DATE_TRIPLE` when the input is empty, malformed, or does not
 * describe a real calendar date.
 */
export function isoYmdToDateTriple(iso: string): DateTriple {
  if (!iso) return EMPTY_DATE_TRIPLE;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return EMPTY_DATE_TRIPLE;
  const triple: DateTriple = { year: match[1], month: match[2], day: match[3] };
  // Round-trip through Date to reject impossible calendar dates (Feb 30, etc.).
  if (!dateTripleToDate(triple)) return EMPTY_DATE_TRIPLE;
  return triple;
}

// ---------------------------------------------------------------------------
// LOCAL-TIME helpers (Bug A fix — see file header).
//
// These intentionally use the local-time `Date` constructor and accessors
// because that's what `react-day-picker` exposes (each calendar cell is
// rendered as `new Date(year, monthIndex, day)`, i.e. local midnight).
//
// Convention: a `DateTriple` represents a CALENDAR DAY (no time, no
// timezone). Going Triple -> Date produces a local-midnight Date solely
// so it can be handed back to react-day-picker's `selected` prop. Going
// Date -> Triple just reads the local Y/M/D off the Date — never UTC.
// ---------------------------------------------------------------------------

/**
 * Returns a local-midnight `Date` for the given calendar-day triple, or
 * `undefined` for an empty or impossible triple (Feb 30, etc.).
 *
 * Why local-midnight: `react-day-picker` constructs each visible day
 * cell as `new Date(year, monthIndex, day)` and then compares against
 * `selected` by exact timestamp. Returning a UTC-midnight Date here
 * causes the highlighted cell to be ONE DAY EARLIER in negative-offset
 * zones (Pacific Time being the operator's). We construct with the
 * non-UTC `Date(y, m - 1, d)` form.
 *
 * Validation: round-trip through the local accessors and reject if the
 * computed Y/M/D don't match the inputs (catches Feb 30 etc., same
 * pattern as `dateTripleToDate`).
 */
export function localDateTripleToDate(triple: DateTriple): Date | undefined {
  const { day, month, year } = triple;
  if (!day || !month || !year) return undefined;
  const d = Number.parseInt(day, 10);
  const m = Number.parseInt(month, 10);
  const y = Number.parseInt(year, 10);
  if (!Number.isFinite(d) || !Number.isFinite(m) || !Number.isFinite(y)) return undefined;
  // JS months are 0-indexed; local-midnight constructor (no UTC).
  const out = new Date(y, m - 1, d);
  if (out.getFullYear() !== y || out.getMonth() !== m - 1 || out.getDate() !== d) {
    return undefined;
  }
  return out;
}

/**
 * Returns a calendar-day triple read from the LOCAL Y/M/D of the given
 * Date. Uses `getFullYear()` / `getMonth()` / `getDate()` — never the
 * `getUTC*` variants. Returns `EMPTY_DATE_TRIPLE` when `d` is
 * `undefined`.
 *
 * Pads day/month to 2 digits and year to 4 (matches existing
 * `dateToDateTriple` formatting so downstream string-equality tests
 * keep passing).
 */
export function dateToLocalDateTriple(d: Date | undefined): DateTriple {
  if (!d) return EMPTY_DATE_TRIPLE;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).padStart(4, '0');
  return { day, month, year };
}

/**
 * Converts a Triple -> ISO `YYYY-MM-DD` without going through a `Date`
 * at all (the pure string path is the most timezone-safe). Rejects
 * impossible calendar dates by validating month/day ranges plus a
 * leap-year-aware Feb day cap.
 *
 * Used by Step 6 `signature.date` so the wire format stays
 * `YYYY-MM-DD` regardless of the user's local timezone.
 */
export function dateTripleToLocalIsoYmd(triple: DateTriple): string {
  const { day, month, year } = triple;
  if (!day || !month || !year) return '';
  const d = Number.parseInt(day, 10);
  const m = Number.parseInt(month, 10);
  const y = Number.parseInt(year, 10);
  if (!Number.isFinite(d) || !Number.isFinite(m) || !Number.isFinite(y)) return '';
  if (m < 1 || m > 12) return '';
  if (d < 1) return '';
  // Days-in-month with leap-year-aware Feb cap.
  const isLeap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const daysInMonth = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (d > daysInMonth[m - 1]) return '';
  const yy = String(y).padStart(4, '0');
  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}
