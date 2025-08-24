export type DateParts = { year: number; month: number; day: number; hour: number; minute: number };

export function parseLocalDateTimeString(value: string): DateParts | null {
  // Expecting 'YYYY-MM-DDTHH:mm'
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const [date, time] = value.split('T');
  const [y, m, d] = date.split('-').map((n) => parseInt(n, 10));
  const [hh, mm] = time.split(':').map((n) => parseInt(n, 10));
  return { year: y, month: m, day: d, hour: hh, minute: mm };
}

// Convert a local wall time in a target IANA timeZone into a UTC Date.
// Based on the offset-diff algorithm used by date-fns-tz.
export function zonedTimeToUtc(parts: DateParts, timeZone: string): Date {
  // Start with the same wall-time as if it were UTC
  const utcGuess = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute),
  );

  // Format utcGuess in the target zone to see what wall-time it corresponds to
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const [{ value: mo }, , { value: da }, , { value: ye }, , { value: ho }, , { value: mi }] =
    fmt.formatToParts(utcGuess);

  const asInZone = new Date(
    Date.UTC(
      parseInt(ye, 10),
      parseInt(mo, 10) - 1,
      parseInt(da, 10),
      parseInt(ho, 10),
      parseInt(mi, 10),
    ),
  );

  // The difference between our intended wall-time and the formatted one is the offset to apply
  const diff =
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute) - asInZone.getTime();
  return new Date(utcGuess.getTime() + diff);
}
