/**
 * Stepper — tester pass (chunk: spa-consultation-input-overhaul).
 *
 * Real assertions for the bounded-numeric stepper used across Step 2 of the
 * consultation wizard (water/alcohol/smoke/caffeine counts).
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import Stepper from '../Stepper';

function Harness({
  initial = '',
  min = 0,
  max = 10,
  defaultValue,
  step,
  suffix,
  ariaLabel,
  disabled,
}: {
  initial?: string;
  min?: number;
  max?: number;
  defaultValue?: number;
  step?: number;
  suffix?: string;
  ariaLabel?: string;
  disabled?: boolean;
}) {
  const [v, setV] = useState(initial);
  return (
    <Stepper
      name="water_glasses_per_day"
      ariaLabel={ariaLabel}
      value={v}
      onChange={setV}
      min={min}
      max={max}
      defaultValue={defaultValue}
      step={step}
      suffix={suffix}
      disabled={disabled}
    />
  );
}

describe('Stepper', () => {
  it('renders a spinbutton wrapper with min/max/value ARIA wiring', () => {
    render(<Harness initial="3" min={0} max={10} />);
    const sb = screen.getByRole('spinbutton');
    expect(sb).toHaveAttribute('aria-valuemin', '0');
    expect(sb).toHaveAttribute('aria-valuemax', '10');
    expect(sb).toHaveAttribute('aria-valuenow', '3');
  });

  it('increments via the + button and emits a stringified value', () => {
    const onChange = vi.fn();
    render(<Stepper name="water" value="3" onChange={onChange} min={0} max={10} />);
    fireEvent.click(screen.getByRole('button', { name: /increase/i }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('4');
  });

  it('decrements via the − button and emits a stringified value', () => {
    const onChange = vi.fn();
    render(<Stepper name="water" value="3" onChange={onChange} min={0} max={10} />);
    fireEvent.click(screen.getByRole('button', { name: /decrease/i }));
    expect(onChange).toHaveBeenCalledWith('2');
  });

  it('respects min and max boundaries (buttons disable; clamp on emit)', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <Stepper name="water" value="0" onChange={onChange} min={0} max={5} />,
    );
    expect(screen.getByRole('button', { name: /decrease/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /increase/i })).not.toBeDisabled();

    rerender(<Stepper name="water" value="5" onChange={onChange} min={0} max={5} />);
    expect(screen.getByRole('button', { name: /increase/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /decrease/i })).not.toBeDisabled();
  });

  it('keyboard ArrowUp / ArrowRight increment by step', () => {
    const onChange = vi.fn();
    render(<Stepper name="water" value="3" onChange={onChange} min={0} max={10} step={2} />);
    const sb = screen.getByRole('spinbutton');
    fireEvent.keyDown(sb, { key: 'ArrowUp' });
    expect(onChange).toHaveBeenLastCalledWith('5');
    fireEvent.keyDown(sb, { key: 'ArrowRight' });
    // value prop didn't change in this test, so internal current still reads 3.
    expect(onChange).toHaveBeenLastCalledWith('5');
  });

  it('keyboard ArrowDown / ArrowLeft decrement by step', () => {
    const onChange = vi.fn();
    render(<Stepper name="water" value="4" onChange={onChange} min={0} max={10} />);
    const sb = screen.getByRole('spinbutton');
    fireEvent.keyDown(sb, { key: 'ArrowDown' });
    expect(onChange).toHaveBeenLastCalledWith('3');
    fireEvent.keyDown(sb, { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenLastCalledWith('3');
  });

  it('keyboard Home jumps to min and End jumps to max', () => {
    const onChange = vi.fn();
    render(<Stepper name="water" value="3" onChange={onChange} min={0} max={15} />);
    const sb = screen.getByRole('spinbutton');
    fireEvent.keyDown(sb, { key: 'Home' });
    expect(onChange).toHaveBeenLastCalledWith('0');
    fireEvent.keyDown(sb, { key: 'End' });
    expect(onChange).toHaveBeenLastCalledWith('15');
  });

  it('uses defaultValue when value is empty (visible value + aria-valuenow)', () => {
    render(<Harness initial="" defaultValue={6} min={0} max={15} />);
    const sb = screen.getByRole('spinbutton');
    expect(sb).toHaveAttribute('aria-valuenow', '6');
    expect(screen.getByRole('status')).toHaveTextContent('6');
  });

  it('renders a suffix span after the value when provided', () => {
    const { container } = render(<Harness initial="5" suffix="cigarettes" />);
    const suffixSpan = container.querySelector('.consultation-stepper-suffix');
    expect(suffixSpan).not.toBeNull();
    expect(suffixSpan!.textContent).toMatch(/cigarettes/);
    // Browsers show stepper output via an <output> element with role=status.
    expect(screen.getByRole('status')).toHaveTextContent('5');
  });

  it('disabled spinbutton blocks click + keyboard emits', () => {
    const onChange = vi.fn();
    render(<Stepper name="water" value="3" onChange={onChange} min={0} max={10} disabled />);
    fireEvent.click(screen.getByRole('button', { name: /increase/i }));
    fireEvent.click(screen.getByRole('button', { name: /decrease/i }));
    const sb = screen.getByRole('spinbutton');
    fireEvent.keyDown(sb, { key: 'ArrowUp' });
    fireEvent.keyDown(sb, { key: 'Home' });
    expect(onChange).not.toHaveBeenCalled();
    expect(sb).toHaveAttribute('aria-disabled', 'true');
    expect(sb).toHaveAttribute('tabindex', '-1');
  });

  it('clamps the emitted value within [min,max] (negative path)', () => {
    const onChange = vi.fn();
    render(<Stepper name="water" value="0" onChange={onChange} min={0} max={5} />);
    const sb = screen.getByRole('spinbutton');
    fireEvent.keyDown(sb, { key: 'ArrowDown' });
    // Already at min, clamped to 0.
    expect(onChange).toHaveBeenLastCalledWith('0');
  });

  it('treats invalid string values as defaultValue/min for arithmetic (boundary)', () => {
    const onChange = vi.fn();
    render(
      <Stepper
        name="water"
        value="not-a-number"
        onChange={onChange}
        min={0}
        max={10}
        defaultValue={4}
      />,
    );
    const sb = screen.getByRole('spinbutton');
    expect(sb).toHaveAttribute('aria-valuenow', '4');
    fireEvent.click(screen.getByRole('button', { name: /increase/i }));
    expect(onChange).toHaveBeenLastCalledWith('5');
  });

  it('exposes the value via <output role="status" aria-live=polite> for SR announcements', () => {
    const { container } = render(<Harness initial="3" />);
    const out = container.querySelector('output');
    expect(out).not.toBeNull();
    expect(out!.getAttribute('aria-live')).toBe('polite');
  });

  it('button styling reserves the ≥44px tap target via the consultation-stepper-button class', () => {
    const { container } = render(<Harness initial="3" />);
    const buttons = container.querySelectorAll('button.consultation-stepper-button');
    expect(buttons.length).toBe(2);
  });
});
