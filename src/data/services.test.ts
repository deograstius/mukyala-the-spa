/*
 * services.ts unit tests — chunk: spa-launch-readiness-seo-2026-05-09 (tester pass).
 *
 * Pins the opening-menu slug list, USD prices, the required Nano-needling
 * disclosure copy, the no-microneedling-anywhere invariant, and the chemical
 * peel "Series of 3 / $450" pricing-package mention.
 */

import { describe, it, expect } from 'vitest';

import { services } from './services';

const EXPECTED_SLUGS = [
  'signature-facial',
  'deluxe-ritual-facial',
  'dermaplane-facial',
  'chemical-peel',
  'nano-needling',
  'body-scrub-ritual',
  'back-facial',
  'led-add-on',
] as const;

const EXPECTED_PRICES_USD: Record<(typeof EXPECTED_SLUGS)[number], number> = {
  'signature-facial': 185,
  'deluxe-ritual-facial': 245,
  'dermaplane-facial': 195,
  'chemical-peel': 175,
  'nano-needling': 250,
  'body-scrub-ritual': 245,
  'back-facial': 115,
  'led-add-on': 35,
};

describe('services data — opening menu', () => {
  it('contains the 8 opening-menu services with the exact slugs', () => {
    const slugs = services.map((s) => s.slug);
    // Same slugs, same count.
    expect(slugs.length).toBe(EXPECTED_SLUGS.length);
    for (const slug of EXPECTED_SLUGS) {
      expect(slugs).toContain(slug);
    }
  });

  it('preserves the brief-mandated slug order', () => {
    expect(services.map((s) => s.slug)).toEqual([...EXPECTED_SLUGS]);
  });

  it('exposes prices that match the brief exactly (USD)', () => {
    for (const slug of EXPECTED_SLUGS) {
      const svc = services.find((s) => s.slug === slug);
      expect(svc, `service "${slug}" should be present`).toBeDefined();
      expect(svc!.priceCents, `service "${slug}" should have a numeric priceCents`).toBeTypeOf(
        'number',
      );
      const expectedDollars = EXPECTED_PRICES_USD[slug];
      expect(svc!.priceCents).toBe(expectedDollars * 100);
    }
  });

  it('nano-needling carries the required clinical-depth disclosure copy', () => {
    const nano = services.find((s) => s.slug === 'nano-needling');
    expect(nano).toBeDefined();
    const haystack = `${nano!.title} ${nano!.description ?? ''}`;
    // Required: cosmetic-depth disclosure and licensed-esthetician phrase.
    expect(haystack).toContain('<0.3mm');
    expect(haystack.toLowerCase()).toContain('licensed esthetician');
  });

  it('does not contain the literal "microneedling" anywhere (case-insensitive) in titles or descriptions', () => {
    for (const svc of services) {
      const blob = `${svc.title ?? ''} ${svc.description ?? ''}`.toLowerCase();
      expect(
        blob.includes('microneedling'),
        `service "${svc.slug}" must not contain "microneedling" in copy`,
      ).toBe(false);
    }
  });

  it('chemical peel description mentions "Series of 3" and "$450" (or 450)', () => {
    const peel = services.find((s) => s.slug === 'chemical-peel');
    expect(peel).toBeDefined();
    const desc = peel!.description ?? '';
    expect(desc.toLowerCase()).toContain('series of 3');
    // Accept "$450" or just "450" per brief.
    expect(/\$?450\b/.test(desc)).toBe(true);
  });
});
