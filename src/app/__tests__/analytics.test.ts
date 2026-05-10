/*
 * analytics.ts unit tests — chunk: spa-tracking-and-consent-2026-05-09 (implementer pass).
 */

import { afterEach, describe, it, expect } from 'vitest';

import { EV, trackEvent, trackLead, trackScheduleIntent, trackViewContent } from '../analytics';

interface DataLayerWindow extends Window {
  dataLayer?: Array<Record<string, unknown>>;
}

describe('analytics', () => {
  afterEach(() => {
    delete (window as DataLayerWindow).dataLayer;
  });

  it('exports the canonical event-name constants (regression guard)', () => {
    expect(EV).toMatchObject({
      VIEW_CONTENT: 'view_content',
      LEAD: 'lead',
      SCHEDULE: 'schedule',
      CONSENT_GRANTED: 'consent_granted',
      CONSENT_DECLINED: 'consent_declined',
    });
  });

  it('trackEvent is a silent no-op when window.dataLayer is undefined', () => {
    expect((window as DataLayerWindow).dataLayer).toBeUndefined();
    expect(() => trackEvent('view_content', { foo: 'bar' })).not.toThrow();
    expect((window as DataLayerWindow).dataLayer).toBeUndefined();
  });

  it('trackEvent is a silent no-op when dataLayer is non-array (defensive)', () => {
    // GTM normally sets dataLayer to an array; if something else has clobbered
    // it we should not throw, just skip the push.
    (window as unknown as { dataLayer?: unknown }).dataLayer = { not: 'an array' };
    expect(() => trackEvent('view_content')).not.toThrow();
    delete (window as unknown as { dataLayer?: unknown }).dataLayer;
  });

  it('trackEvent pushes onto window.dataLayer when present', () => {
    (window as DataLayerWindow).dataLayer = [];
    trackEvent('view_content', { content_name: 'test' });
    expect((window as DataLayerWindow).dataLayer).toHaveLength(1);
    expect((window as DataLayerWindow).dataLayer![0]).toMatchObject({
      event: 'view_content',
      content_name: 'test',
    });
  });

  it('trackViewContent pushes a Meta-shaped view_content event with USD currency', () => {
    (window as DataLayerWindow).dataLayer = [];
    trackViewContent({ contentName: 'Signature Facial', value: 185 });
    expect((window as DataLayerWindow).dataLayer![0]).toMatchObject({
      event: 'view_content',
      content_name: 'Signature Facial',
      value: 185,
      currency: 'USD',
    });
  });

  it('trackViewContent defaults value to 0 when not provided', () => {
    (window as DataLayerWindow).dataLayer = [];
    trackViewContent({ contentName: 'Services index', contentCategory: 'services_index' });
    expect((window as DataLayerWindow).dataLayer![0]).toMatchObject({
      event: 'view_content',
      content_name: 'Services index',
      content_category: 'services_index',
      value: 0,
      currency: 'USD',
    });
  });

  it('trackLead pushes a Meta-shaped lead event tagged with the source path', () => {
    (window as DataLayerWindow).dataLayer = [];
    trackLead('/about');
    expect((window as DataLayerWindow).dataLayer![0]).toMatchObject({
      event: 'lead',
      content_name: '/about',
      source: '/about',
      value: 0,
      currency: 'USD',
    });
  });

  it('trackScheduleIntent pushes a Meta-shaped schedule event with cta_id + service', () => {
    (window as DataLayerWindow).dataLayer = [];
    trackScheduleIntent({ ctaId: 'home-hero-cta', serviceSlug: 'signature-facial' });
    expect((window as DataLayerWindow).dataLayer![0]).toMatchObject({
      event: 'schedule',
      cta_id: 'home-hero-cta',
      content_name: 'signature-facial',
      service: 'signature-facial',
      currency: 'USD',
    });
  });

  it('trackScheduleIntent uses an explicit source when provided', () => {
    (window as DataLayerWindow).dataLayer = [];
    trackScheduleIntent({ ctaId: 'founders-ribbon-cta', source: 'founders_ribbon' });
    expect((window as DataLayerWindow).dataLayer![0]).toMatchObject({
      event: 'schedule',
      cta_id: 'founders-ribbon-cta',
      source: 'founders_ribbon',
    });
  });
});
