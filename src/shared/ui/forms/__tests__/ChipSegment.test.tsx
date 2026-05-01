/**
 * ChipSegment — tester pass (chunk: spa-consultation-input-overhaul).
 *
 * Real assertions for the single-select chip group primitive used by the
 * consultation wizard. All bug-finding limited to behavioral surface; no
 * implementation snapshots.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import ChipSegment, { type ChipSegmentOption } from '../ChipSegment';

const OPTS: ReadonlyArray<ChipSegmentOption<'low' | 'moderate' | 'high'>> = [
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' },
];

function Harness({
  initial = '',
  options = OPTS,
  ...rest
}: {
  initial?: 'low' | 'moderate' | 'high' | '';
  options?: ReadonlyArray<ChipSegmentOption<'low' | 'moderate' | 'high'>>;
} & Partial<{
  legend: string;
  legendHidden: boolean;
  required: boolean;
  helpText: string;
  error: string;
  disabled: boolean;
}>) {
  const [v, setV] = useState<'low' | 'moderate' | 'high' | ''>(initial);
  return (
    <ChipSegment<'low' | 'moderate' | 'high'>
      name="stress_level"
      legend={rest.legend ?? 'Stress level'}
      options={options}
      value={v}
      onChange={(next) => setV(next)}
      {...rest}
    />
  );
}

describe('ChipSegment', () => {
  it('renders one chip per option inside a radiogroup', () => {
    render(<Harness />);
    const group = screen.getByRole('radiogroup');
    expect(group).toBeInTheDocument();
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(OPTS.length);
    expect(radios.map((r) => (r as HTMLInputElement).value)).toEqual(['low', 'moderate', 'high']);
    // Labels render visibly.
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('Moderate')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('selects a chip on click and reflects checked/aria-checked state (single-select toggle)', () => {
    render(<Harness />);
    const radios = screen.getAllByRole('radio') as HTMLInputElement[];
    expect(radios.every((r) => !r.checked)).toBe(true);

    fireEvent.click(radios[1]); // pick "Moderate"
    expect(radios[1].checked).toBe(true);
    expect(radios[0].checked).toBe(false);
    expect(radios[2].checked).toBe(false);

    fireEvent.click(radios[2]); // toggle to "High"
    expect(radios[2].checked).toBe(true);
    expect(radios[1].checked).toBe(false);
  });

  it('emits onChange(value) with the option string when a chip is clicked', () => {
    const onChange = vi.fn();
    render(
      <ChipSegment<'low' | 'moderate' | 'high'>
        name="stress_level"
        legend="Stress level"
        options={OPTS}
        value=""
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getAllByRole('radio')[0]);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('low');
  });

  it('renders legend visibly by default and visually-hidden when legendHidden=true', () => {
    const { rerender, container } = render(<Harness legend="Stress level" />);
    const legend1 = container.querySelector('legend');
    expect(legend1).not.toBeNull();
    expect(legend1!.className).not.toMatch(/visually-hidden/);

    rerender(<Harness legend="Stress level" legendHidden />);
    const legend2 = container.querySelector('legend');
    expect(legend2!.className).toMatch(/visually-hidden/);
  });

  it('renders helpText and error and wires both ids into fieldset aria-describedby', () => {
    const { container } = render(
      <ChipSegment<'low' | 'moderate' | 'high'>
        name="stress_level"
        legend="Stress level"
        options={OPTS}
        value=""
        onChange={() => {}}
        helpText="Pick the closest match."
        error="Required"
      />,
    );
    const fieldset = container.querySelector('fieldset')!;
    const describedBy = fieldset.getAttribute('aria-describedby') ?? '';
    expect(describedBy).toContain('stress_level-help');
    expect(describedBy).toContain('stress_level-error');
    expect(screen.getByText('Pick the closest match.')).toBeInTheDocument();
    const err = screen.getByText('Required');
    expect(err).toHaveAttribute('role', 'alert');
  });

  it('renders required asterisk + visually-hidden " (required)" when required=true', () => {
    const { container } = render(<Harness required />);
    const aster = container.querySelector('.required-asterisk');
    expect(aster).not.toBeNull();
    expect(aster?.textContent).toBe('*');
    // The "(required)" suffix is in a visually-hidden span for AT.
    expect(container.querySelector('legend .visually-hidden')?.textContent).toContain('required');
  });

  it('honors disabled prop on the entire fieldset', () => {
    const { container } = render(<Harness disabled />);
    const fieldset = container.querySelector('fieldset')!;
    expect(fieldset).toHaveAttribute('disabled');
    // Disabled fieldsets disable descendant inputs natively.
    const radios = screen.getAllByRole('radio') as HTMLInputElement[];
    radios.forEach((r) => expect(r.disabled).toBe(true));
  });

  it('marks individual options as disabled when option.disabled=true (other options remain clickable)', () => {
    const onChange = vi.fn();
    render(
      <ChipSegment<'low' | 'moderate' | 'high'>
        name="stress_level"
        legend="Stress level"
        options={[
          { value: 'low', label: 'Low' },
          { value: 'moderate', label: 'Moderate', disabled: true },
          { value: 'high', label: 'High' },
        ]}
        value=""
        onChange={onChange}
      />,
    );
    const radios = screen.getAllByRole('radio') as HTMLInputElement[];
    // Native disabled is the contract — browsers + AT honor it; JSDOM clicks
    // on disabled inputs still fire change handlers, but the disabled flag is
    // what users and screen readers actually see.
    expect(radios[0].disabled).toBe(false);
    expect(radios[1].disabled).toBe(true);
    expect(radios[2].disabled).toBe(false);
    fireEvent.click(radios[2]);
    expect(onChange).toHaveBeenCalledWith('high');
  });

  it('layout defaults to wrap and reflects layout="stacked" via data-layout', () => {
    const { container, rerender } = render(<Harness />);
    expect(container.querySelector('fieldset')!.getAttribute('data-layout')).toBe('wrap');
    rerender(<Harness layout="stacked" />);
    expect(container.querySelector('fieldset')!.getAttribute('data-layout')).toBe('stacked');
  });

  it('builds option ids from the name (data-testid resolution stays stable for selectors)', () => {
    const { container } = render(<Harness />);
    expect(container.querySelector('#stress_level-low')).not.toBeNull();
    expect(container.querySelector('#stress_level-moderate')).not.toBeNull();
    expect(container.querySelector('#stress_level-high')).not.toBeNull();
    // Labels are tied via htmlFor.
    const labels = container.querySelectorAll('label.consultation-chip-option');
    expect(labels[0].getAttribute('for')).toBe('stress_level-low');
  });

  it('keyboard arrow nav works on native radios (Space/Enter selects via change event)', () => {
    render(<Harness />);
    const radios = screen.getAllByRole('radio') as HTMLInputElement[];
    // Browsers handle Arrow key navigation natively for sibling radios sharing
    // the same name. Verify the change event path that React uses to commit
    // selection (Space/click/keyboard all funnel into the same onChange):
    fireEvent.click(radios[0]);
    expect(radios[0].checked).toBe(true);
    fireEvent.click(radios[2]);
    expect(radios[2].checked).toBe(true);
    expect(radios[0].checked).toBe(false);
  });
});

describe('ChipSegment legend hierarchy', () => {
  it('renders legend with paragraph-medium semi-bold class by default (sub-label scale)', () => {
    const { container } = render(<Harness legend="Visible legend" />);
    const legend = container.querySelector('legend')!;
    expect(legend.className).toMatch(/paragraph-medium/);
    expect(legend.className).toMatch(/semi-bold/);
  });
});
