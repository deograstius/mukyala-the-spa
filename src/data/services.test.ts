/*
 * services.ts unit tests — menu trimmed to the Signature Facial only
 * (operator decision 2026-09-18; was the 8-service opening menu). Pins the
 * sole slug, the $185 price, the fallback-only role of this file, and the
 * no-microneedling-anywhere invariant.
 */

import { describe, it, expect } from 'vitest';

import { services } from './services';

describe('services data — menu', () => {
  it('contains exactly the Signature Facial', () => {
    expect(services.map((s) => s.slug)).toEqual(['signature-facial']);
  });

  it('prices the Signature Facial at $185 (USD)', () => {
    const svc = services[0];
    expect(svc.title).toBe('Signature Facial');
    expect(svc.priceCents).toBe(18500);
  });

  it('routes to the service-detail page', () => {
    expect(services[0].href).toBe('/services/signature-facial');
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
});
