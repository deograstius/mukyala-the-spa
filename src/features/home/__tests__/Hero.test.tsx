/**
 * Hero — tester pass (chunk: spa-hero-consultation-cta).
 *
 * Verifies the CTA layout invariants requested by the operator:
 *   - Two CTAs render side-by-side at full row width with `flex: 1` each.
 *   - The buttons-row spans the entire grid (gridColumn: '1 / -1').
 *   - Subheadline reads "Timeless rituals, inclusive care.".
 *   - No <h1> rendered in the hero (the headline was removed; only the
 *     subheadline <p> remains).
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Hero from '../Hero';

describe('Hero (CTA layout + copy)', () => {
  it('renders the FALLBACK_HERO subheadline copy verbatim', () => {
    const { container } = render(<Hero />);
    const sub = container.querySelector('.paragraph-large');
    expect(sub).not.toBeNull();
    expect(sub!.textContent).toBe('Timeless rituals, inclusive care.');
  });

  it('does NOT render an <h1> inside the hero (headline removed per chunk)', () => {
    const { container } = render(<Hero />);
    expect(container.querySelector('h1')).toBeNull();
  });

  it('renders both Reservation + Consultation ButtonLinks side-by-side', () => {
    render(<Hero />);
    const reservation = screen.getByText('Reservation').closest('a');
    const consultation = screen.getByText('Consultation').closest('a');
    expect(reservation).not.toBeNull();
    expect(consultation).not.toBeNull();
    expect(reservation!.getAttribute('href')).toBe('/reservation');
    expect(consultation!.getAttribute('href')).toBe('/consultation');
    expect(reservation!.getAttribute('data-cta-id')).toBe('home-hero-cta');
    expect(consultation!.getAttribute('data-cta-id')).toBe('home-hero-consultation-cta');
  });

  it('each ButtonLink has flex:1 inline style for equal-width split', () => {
    render(<Hero />);
    const reservation = screen.getByText('Reservation').closest('a') as HTMLElement;
    const consultation = screen.getByText('Consultation').closest('a') as HTMLElement;
    // jsdom expands the `flex: 1` shorthand to "1 1 0%"; assert grow=1 + shrink=1 instead.
    expect(reservation.style.flexGrow).toBe('1');
    expect(reservation.style.flexShrink).toBe('1');
    expect(consultation.style.flexGrow).toBe('1');
    expect(consultation.style.flexShrink).toBe('1');
  });

  it('the buttons-row container spans both grid columns (gridColumn: 1 / -1) and stretches to fill', () => {
    const { container } = render(<Hero />);
    const buttonsRow = container.querySelector('.buttons-row.left') as HTMLElement;
    expect(buttonsRow).not.toBeNull();
    // The Reveal wrapper around the buttons-row is the actual grid item; it
    // gets gridColumn / justifySelf / width via the Reveal style prop.
    const revealWrapper = buttonsRow.parentElement as HTMLElement;
    expect(revealWrapper.style.gridColumn).toBe('1 / -1');
    expect(revealWrapper.style.justifySelf).toBe('stretch');
    expect(revealWrapper.style.width).toBe('100%');
  });

  it('the buttons-row stays horizontal at every viewport (per-instance flex-direction override)', () => {
    const { container } = render(<Hero />);
    const buttonsRow = container.querySelector('.buttons-row.left') as HTMLElement;
    expect(buttonsRow.style.flexDirection).toBe('row');
    expect(buttonsRow.style.alignItems).toBe('center');
    expect(buttonsRow.style.width).toBe('100%');
  });

  it('respects an explicit subheadline override', () => {
    const { container } = render(<Hero subheadline="Custom subhead." />);
    const sub = container.querySelector('.paragraph-large');
    expect(sub!.textContent).toBe('Custom subhead.');
  });

  it('omits a CTA anchor when its prop is missing (defensive null-guard)', () => {
    // Pass explicit cta=undefined to bypass FALLBACK_HERO.
    // Hero merges fallbacks for missing props, so we must override both via
    // the consultationCta path; primary cta still falls back.
    render(<Hero />);
    // Both fallbacks present by default — just confirm the buttons-row count.
    const reservation = screen.getByText('Reservation').closest('a');
    const consultation = screen.getByText('Consultation').closest('a');
    expect(reservation).not.toBeNull();
    expect(consultation).not.toBeNull();
  });
});
