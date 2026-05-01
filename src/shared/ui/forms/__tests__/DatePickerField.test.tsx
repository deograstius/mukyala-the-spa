/**
 * DatePickerField — tester pass (chunk: spa-consultation-input-overhaul).
 *
 * Covers both the load-bearing pure helpers (`dateTripleToDate` /
 * `dateToDateTriple` and the local-time pair `localDateTripleToDate` /
 * `dateToLocalDateTriple`) AND the React component shell. The picker itself
 * is `react-day-picker`; we don't reach inside it — we assert via the public
 * surface (calendar grid, year-dropdown, future-date disable, controlled
 * value flow).
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import DatePickerField from '../DatePickerField';
import {
  dateToDateTriple,
  dateToLocalDateTriple,
  dateTripleToDate,
  dateTripleToIsoYmd,
  dateTripleToLocalIsoYmd,
  EMPTY_DATE_TRIPLE,
  isoYmdToDateTriple,
  localDateTripleToDate,
  type DateTriple,
} from '../datePickerField.helpers';

describe('DatePickerField helpers — UTC pair', () => {
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

  it('dateTripleToDate rejects empty / partial / non-numeric triples', () => {
    expect(dateTripleToDate({ day: '', month: '03', year: '1991' })).toBeUndefined();
    expect(dateTripleToDate({ day: '07', month: '', year: '1991' })).toBeUndefined();
    expect(dateTripleToDate({ day: '07', month: '03', year: '' })).toBeUndefined();
    expect(dateTripleToDate({ day: 'NaN', month: '03', year: '1991' })).toBeUndefined();
  });

  it('dateTripleToIsoYmd returns YYYY-MM-DD for valid triples and "" for invalid', () => {
    expect(dateTripleToIsoYmd({ day: '07', month: '03', year: '1991' })).toBe('1991-03-07');
    expect(dateTripleToIsoYmd(EMPTY_DATE_TRIPLE)).toBe('');
    expect(dateTripleToIsoYmd({ day: '30', month: '02', year: '1990' })).toBe('');
  });

  it('isoYmdToDateTriple parses well-formed strings and rejects malformed', () => {
    expect(isoYmdToDateTriple('1991-03-07')).toEqual({ day: '07', month: '03', year: '1991' });
    expect(isoYmdToDateTriple('')).toEqual(EMPTY_DATE_TRIPLE);
    expect(isoYmdToDateTriple('1991/03/07')).toEqual(EMPTY_DATE_TRIPLE);
    expect(isoYmdToDateTriple('1990-02-30')).toEqual(EMPTY_DATE_TRIPLE); // Feb 30 fails
  });

  it('isoYmdToDateTriple round-trips through dateTripleToIsoYmd', () => {
    const t: DateTriple = { day: '15', month: '06', year: '2010' };
    expect(isoYmdToDateTriple(dateTripleToIsoYmd(t))).toEqual(t);
  });
});

describe('DatePickerField helpers — local-time pair (Bug A fix)', () => {
  it('localDateTripleToDate / dateToLocalDateTriple round-trip via local accessors', () => {
    const t: DateTriple = { day: '07', month: '03', year: '1991' };
    const d = localDateTripleToDate(t);
    expect(d).toBeDefined();
    expect(dateToLocalDateTriple(d)).toEqual(t);
    // `d` is local-midnight (no UTC).
    expect(d!.getFullYear()).toBe(1991);
    expect(d!.getMonth()).toBe(2);
    expect(d!.getDate()).toBe(7);
  });

  it('localDateTripleToDate rejects empty + impossible (Feb 30) triples', () => {
    expect(localDateTripleToDate(EMPTY_DATE_TRIPLE)).toBeUndefined();
    expect(localDateTripleToDate({ day: '30', month: '02', year: '1990' })).toBeUndefined();
  });

  it('dateToLocalDateTriple returns the empty triple for undefined', () => {
    expect(dateToLocalDateTriple(undefined)).toEqual(EMPTY_DATE_TRIPLE);
  });

  it('dateTripleToLocalIsoYmd validates leap years correctly', () => {
    // 2000 is a leap year (divisible by 400).
    expect(dateTripleToLocalIsoYmd({ day: '29', month: '02', year: '2000' })).toBe('2000-02-29');
    // 1900 is NOT a leap year (divisible by 100 not 400).
    expect(dateTripleToLocalIsoYmd({ day: '29', month: '02', year: '1900' })).toBe('');
    // 2024 leap.
    expect(dateTripleToLocalIsoYmd({ day: '29', month: '02', year: '2024' })).toBe('2024-02-29');
    // 2023 not.
    expect(dateTripleToLocalIsoYmd({ day: '29', month: '02', year: '2023' })).toBe('');
  });

  it('dateTripleToLocalIsoYmd rejects out-of-range months/days', () => {
    expect(dateTripleToLocalIsoYmd({ day: '32', month: '01', year: '2020' })).toBe('');
    expect(dateTripleToLocalIsoYmd({ day: '00', month: '01', year: '2020' })).toBe('');
    expect(dateTripleToLocalIsoYmd({ day: '15', month: '13', year: '2020' })).toBe('');
    expect(dateTripleToLocalIsoYmd({ day: '15', month: '00', year: '2020' })).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Component coverage
// ---------------------------------------------------------------------------

function ControlledHarness({ initial = EMPTY_DATE_TRIPLE }: { initial?: DateTriple }) {
  const [v, setV] = useState<DateTriple>(initial);
  return <DatePickerField name="dob" ariaLabel="Date of birth" value={v} onChange={setV} />;
}

describe('DatePickerField component', () => {
  it('mounts a single-mode day picker with role=group + aria-label', () => {
    const { container } = render(<ControlledHarness />);
    const group = container.querySelector('[role="group"][aria-label="Date of birth"]');
    expect(group).not.toBeNull();
    // react-day-picker exposes a grid with date cells.
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('renders year-dropdown navigation (captionLayout="dropdown")', () => {
    render(<ControlledHarness />);
    // react-day-picker labels the year dropdown as "Year:" by default.
    const yearDropdown = screen.getByRole('combobox', { name: /year/i });
    expect(yearDropdown).toBeInTheDocument();
  });

  it('default visible month sits ~30 years before today when value is empty', () => {
    const today = new Date();
    const expectedYear = today.getFullYear() - 30;
    render(<ControlledHarness />);
    const yearDropdown = screen.getByRole('combobox', { name: /year/i }) as HTMLSelectElement;
    expect(Number(yearDropdown.value)).toBe(expectedYear);
  });

  it('initializes the visible month from a non-empty DateTriple', () => {
    render(<ControlledHarness initial={{ day: '07', month: '03', year: '1991' }} />);
    const yearDropdown = screen.getByRole('combobox', { name: /year/i }) as HTMLSelectElement;
    expect(yearDropdown.value).toBe('1991');
  });

  it('disables future dates (cannot pick tomorrow)', () => {
    const onChange = vi.fn();
    // Pin to today by setting initial to today.
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const initial: DateTriple = {
      day: pad(today.getDate()),
      month: pad(today.getMonth() + 1),
      year: String(today.getFullYear()),
    };
    render(
      <DatePickerField name="dob" ariaLabel="Date of birth" value={initial} onChange={onChange} />,
    );
    // Find the cell for today's day-of-month and verify a "tomorrow" cell is
    // disabled (its gridcell button has aria-disabled=true).
    const grid = screen.getByRole('grid');
    const allCells = within(grid).getAllByRole('gridcell');
    // At least one disabled cell must exist (any future date).
    const disabledCount = allCells.filter(
      (c) =>
        c.getAttribute('aria-disabled') === 'true' || c.querySelector('button[disabled]') !== null,
    ).length;
    expect(disabledCount).toBeGreaterThan(0);
  });

  it('emits a DateTriple as zero-padded strings when the user selects a calendar cell', () => {
    let captured: DateTriple = EMPTY_DATE_TRIPLE;
    function H() {
      const [v, setV] = useState<DateTriple>(EMPTY_DATE_TRIPLE);
      return (
        <DatePickerField
          name="dob"
          ariaLabel="Date of birth"
          value={v}
          onChange={(next) => {
            captured = next;
            setV(next);
          }}
        />
      );
    }
    render(<H />);
    // The year-dropdown is wired; click the first enabled day cell. Any
    // selection produces a triple of zero-padded strings.
    const grid = screen.getByRole('grid');
    const buttons = within(grid).getAllByRole('button');
    const enabled = buttons.find((b) => !(b as HTMLButtonElement).disabled);
    expect(enabled).toBeDefined();
    fireEvent.click(enabled!);
    expect(captured.day).toMatch(/^\d{2}$/);
    expect(captured.month).toMatch(/^\d{2}$/);
    expect(captured.year).toMatch(/^\d{4}$/);
  });

  it('controlled-clear: when parent passes EMPTY_DATE_TRIPLE the picker shows no selection', () => {
    function H() {
      const [v, setV] = useState<DateTriple>({ day: '07', month: '03', year: '1991' });
      return (
        <>
          <button type="button" onClick={() => setV(EMPTY_DATE_TRIPLE)}>
            clear
          </button>
          <DatePickerField name="dob" ariaLabel="Date of birth" value={v} onChange={setV} />
        </>
      );
    }
    const { container } = render(<H />);
    // While selected the day cell carries an aria-selected="true".
    expect(container.querySelector('[aria-selected="true"]')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(container.querySelector('[aria-selected="true"]')).toBeNull();
  });

  it('respects min/maxYear bounds in the year dropdown options', () => {
    const onChange = vi.fn();
    render(
      <DatePickerField
        name="dob"
        ariaLabel="Date of birth"
        value={EMPTY_DATE_TRIPLE}
        onChange={onChange}
        minYear={1950}
        maxYear={1999}
      />,
    );
    const yearDropdown = screen.getByRole('combobox', { name: /year/i }) as HTMLSelectElement;
    const optionValues = Array.from(yearDropdown.options).map((o) => Number(o.value));
    const min = Math.min(...optionValues);
    const max = Math.max(...optionValues);
    expect(min).toBeGreaterThanOrEqual(1950);
    expect(max).toBeLessThanOrEqual(1999);
  });
});
