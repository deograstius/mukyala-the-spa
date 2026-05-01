/**
 * RevealOnTrigger — tester pass (chunk: spa-consultation-input-overhaul).
 *
 * Real assertions for the show/hide animation wrapper used by every
 * conditional reveal in the consultation wizard. Uses fake timers to
 * avoid waiting on the EXIT_MS=200 setTimeout.
 */

import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RevealOnTrigger from '../RevealOnTrigger';

function setMatchMediaReducedMotion(reduced: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: reduced && /prefers-reduced-motion: reduce/.test(query),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

beforeEach(() => {
  setMatchMediaReducedMotion(false);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('RevealOnTrigger', () => {
  it('renders children when show=true (default keepMounted=false)', () => {
    render(
      <RevealOnTrigger show>
        <span>revealed</span>
      </RevealOnTrigger>,
    );
    expect(screen.getByText('revealed')).toBeInTheDocument();
  });

  it('does NOT render children when show starts false (default keepMounted=false)', () => {
    render(
      <RevealOnTrigger show={false}>
        <span>hidden</span>
      </RevealOnTrigger>,
    );
    expect(screen.queryByText('hidden')).toBeNull();
  });

  it('flips data-shown to "true" via requestAnimationFrame after mount when show=true and motion is allowed', async () => {
    setMatchMediaReducedMotion(false);
    const { container } = render(
      <RevealOnTrigger show data-testid="r">
        <span>now</span>
      </RevealOnTrigger>,
    );
    // After rAF settles, data-shown should be true.
    await act(async () => {
      await new Promise((res) => requestAnimationFrame(() => res(null)));
    });
    expect(container.querySelector('[data-testid="r"]')!.getAttribute('data-shown')).toBe('true');
  });

  it('unmounts children after EXIT_MS when show flips false (default keepMounted=false)', () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <RevealOnTrigger show>
        <span>byebye</span>
      </RevealOnTrigger>,
    );
    expect(screen.getByText('byebye')).toBeInTheDocument();
    rerender(
      <RevealOnTrigger show={false}>
        <span>byebye</span>
      </RevealOnTrigger>,
    );
    // Still mounted during the 200ms exit transition.
    expect(screen.queryByText('byebye')).not.toBeNull();
    act(() => {
      vi.advanceTimersByTime(220);
    });
    expect(screen.queryByText('byebye')).toBeNull();
  });

  it('keepMounted=true keeps children in the DOM but toggles hidden + aria-hidden when show=false', async () => {
    const { rerender, container } = render(
      <RevealOnTrigger show keepMounted data-testid="r">
        <span>persist</span>
      </RevealOnTrigger>,
    );
    expect(screen.getByText('persist')).toBeInTheDocument();
    rerender(
      <RevealOnTrigger show={false} keepMounted data-testid="r">
        <span>persist</span>
      </RevealOnTrigger>,
    );
    expect(screen.queryByText('persist')).not.toBeNull();
    const wrapper = container.querySelector('[data-testid="r"]')!;
    expect(wrapper).toHaveAttribute('hidden');
    expect(wrapper).toHaveAttribute('aria-hidden', 'true');
  });

  it('respects prefers-reduced-motion: reduce — synchronous mount/unmount, no exit-timer wait', () => {
    setMatchMediaReducedMotion(true);
    const { rerender } = render(
      <RevealOnTrigger show>
        <span>reduced</span>
      </RevealOnTrigger>,
    );
    expect(screen.getByText('reduced')).toBeInTheDocument();
    rerender(
      <RevealOnTrigger show={false}>
        <span>reduced</span>
      </RevealOnTrigger>,
    );
    // No 200ms wait — already gone.
    expect(screen.queryByText('reduced')).toBeNull();
  });

  it('reduced-motion path sets data-shown=true immediately on mount when show=true', async () => {
    setMatchMediaReducedMotion(true);
    const { container } = render(
      <RevealOnTrigger show data-testid="r">
        <span>reduced</span>
      </RevealOnTrigger>,
    );
    await act(async () => {
      // Allow effects to commit.
      await Promise.resolve();
    });
    expect(container.querySelector('[data-testid="r"]')!.getAttribute('data-shown')).toBe('true');
  });

  it('passes through className and exposes data-testid hook', () => {
    const { container } = render(
      <RevealOnTrigger show className="extra" data-testid="reveal-x">
        <span>hello</span>
      </RevealOnTrigger>,
    );
    const wrapper = container.querySelector('[data-testid="reveal-x"]');
    expect(wrapper).not.toBeNull();
    expect(wrapper!.className).toMatch(/consultation-reveal/);
    expect(wrapper!.className).toMatch(/extra/);
  });
});
