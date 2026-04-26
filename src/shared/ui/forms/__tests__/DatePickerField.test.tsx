/**
 * DatePickerField — placeholder test suite + minimal pure-helper coverage.
 *
 * (chunk: spa-consultation-input-overhaul)
 *
 * The pure helpers `dateTripleToDate` and `dateToDateTriple` are the
 * load-bearing wire-format glue between the schema's three string fields
 * (`personal.dob_day` / `dob_month` / `dob_year`) and the picker's
 * `Date | undefined`. Architect adds a tiny smoke check on the pure helpers
 * so a regression in the wire format breaks the build immediately;
 * everything else is `.todo` for the tester pass.
 *
 * TODO(tester): flesh out the React-component cases.
 */

import { describe, expect, it } from 'vitest';
import { dateToDateTriple, dateTripleToDate, EMPTY_DATE_TRIPLE } from '../datePickerField.helpers';

describe('DatePickerField helpers', () => {
  it('dateTripleToDate returns undefined for the empty triple', () => {
    expect(dateTripleToDate(EMPTY_DATE_TRIPLE)).toBeUndefined();
  });

  it('dateToDateTriple round-trips a known UTC date back to zero-padded strings', () => {
    const triple = dateToDateTriple(new Date(Date.UTC(1991, 2, 7)));
    expect(triple).toEqual({ day: '07', month: '03', year: '1991' });
  });

  it('dateTripleToDate rejects invalid calendar dates (Feb 30)', () => {
    expect(dateTripleToDate({ day: '30', month: '02', year: '1990' })).toBeUndefined();
  });
});

describe('DatePickerField (component)', () => {
  it.todo('mounts react-day-picker in mode="single" with year-dropdown navigation');
  it.todo('default visible month is ~30 years before today when value is empty');
  it.todo('emits DateTriple { day, month, year } as zero-padded strings on selection');
  it.todo('initializes from a non-empty DateTriple by computing the matching Date');
  it.todo('clears selection when the parent passes the empty triple');
  it.todo('respects min/maxYear bounds in the year dropdown');
});
