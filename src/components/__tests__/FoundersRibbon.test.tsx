/*
 * FoundersRibbon unit tests — chunk: spa-launch-readiness-seo-2026-05-09 (tester pass).
 *
 * Covers the new sitewide promo ribbon: copy, CTA wiring, dismissal persistence,
 * and the localStorage key version (regression guard against silent rename).
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, it, expect } from 'vitest';

import FoundersRibbon, { FOUNDERS_RIBBON_STORAGE_KEY } from '../FoundersRibbon';

describe('FoundersRibbon', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('renders the exact promo copy', () => {
    render(<FoundersRibbon />);
    // The implementation uses an em-dash (—) and middle-dot (·) per brief copy.
    expect(
      screen.getByText(/Founders'\s*Rate\s*—\s*Signature Facial \$129\s*·\s*First 50 guests/),
    ).toBeInTheDocument();
  });

  it('renders a CTA link with a non-empty href', () => {
    render(<FoundersRibbon />);
    const cta = screen.getByRole('link', { name: /book the founders/i });
    expect(cta).toBeInTheDocument();
    const href = cta.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href!.length).toBeGreaterThan(0);
  });

  it('renders a dismiss button with an accessible label', () => {
    render(<FoundersRibbon />);
    // aria-label on the implementation is "Dismiss Founders Rate banner".
    const btn = screen.getByRole('button', { name: /dismiss|close/i });
    expect(btn).toBeInTheDocument();
  });

  it('clicking dismiss removes the ribbon and persists the dismissal in localStorage', async () => {
    const user = userEvent.setup();
    render(<FoundersRibbon />);

    const region = screen.getByRole('region', { name: /founders/i });
    expect(region).toBeInTheDocument();

    const btn = screen.getByRole('button', { name: /dismiss|close/i });
    await user.click(btn);

    // Ribbon unmounts/hides
    expect(screen.queryByRole('region', { name: /founders/i })).not.toBeInTheDocument();

    // localStorage carries a truthy dismissal value
    const stored = window.localStorage.getItem(FOUNDERS_RIBBON_STORAGE_KEY);
    expect(stored).toBeTruthy();
  });

  it('does not render when localStorage already has the dismissal key set on mount', () => {
    window.localStorage.setItem(FOUNDERS_RIBBON_STORAGE_KEY, '1');
    render(<FoundersRibbon />);
    expect(screen.queryByRole('region', { name: /founders/i })).not.toBeInTheDocument();
    // Also no CTA link nor dismiss button rendered.
    expect(screen.queryByRole('link', { name: /book the founders/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /dismiss|close/i })).not.toBeInTheDocument();
  });

  it('localStorage key version is exactly mukyala.foundersRibbonDismissed.v1 (regression guard)', () => {
    // Explicit pin so a silent rename of the version suffix breaks loudly.
    expect(FOUNDERS_RIBBON_STORAGE_KEY).toBe('mukyala.foundersRibbonDismissed.v1');
  });
});
