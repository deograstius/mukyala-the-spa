/*
 * consent.ts unit tests — chunk: spa-tracking-and-consent-2026-05-09 (implementer pass).
 */

import { afterEach, beforeEach, describe, it, expect } from 'vitest';

import {
  acceptAll,
  applyPersistedConsent,
  CONSENT_BANNER_OPEN_EVENT,
  CONSENT_STORAGE_KEY,
  declineAll,
  getConsentChoice,
  openBanner,
  setConsentDeclined,
  setConsentDefault,
  setConsentGranted,
  subscribe,
} from '../consent';

interface DataLayerWindow extends Window {
  dataLayer?: Array<unknown>;
}

function lastConsentArgs(): unknown[] | null {
  const dl = (window as DataLayerWindow).dataLayer;
  if (!Array.isArray(dl)) return null;
  // gtag pushes arguments-arrays; find the most recent consent push.
  for (let i = dl.length - 1; i >= 0; i--) {
    const entry = dl[i];
    if (Array.isArray(entry) && entry[0] === 'consent') return entry;
  }
  return null;
}

describe('consent', () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete (window as DataLayerWindow).dataLayer;
  });

  afterEach(() => {
    window.localStorage.clear();
    delete (window as DataLayerWindow).dataLayer;
  });

  it('exports the canonical localStorage key (regression guard)', () => {
    expect(CONSENT_STORAGE_KEY).toBe('mukyala.consentChoice.v1');
  });

  it('exports the canonical open-banner event name (regression guard)', () => {
    expect(CONSENT_BANNER_OPEN_EVENT).toBe('mukyala:openConsentBanner');
  });

  it('getConsentChoice returns null when no choice has been persisted', () => {
    expect(getConsentChoice()).toBeNull();
  });

  it('getConsentChoice returns null for unrecognized stored values', () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'maybe');
    expect(getConsentChoice()).toBeNull();
  });

  it('setConsentGranted persists "accepted" and pushes a granted update', () => {
    (window as DataLayerWindow).dataLayer = [];
    setConsentGranted();
    expect(getConsentChoice()).toBe('accepted');
    const args = lastConsentArgs();
    expect(args).not.toBeNull();
    expect(args![0]).toBe('consent');
    expect(args![1]).toBe('update');
    expect(args![2]).toMatchObject({
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted',
    });
  });

  it('setConsentDeclined persists "declined" and pushes a denied update', () => {
    (window as DataLayerWindow).dataLayer = [];
    setConsentDeclined();
    expect(getConsentChoice()).toBe('declined');
    const args = lastConsentArgs();
    expect(args![2]).toMatchObject({
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    });
  });

  it('acceptAll is an alias for setConsentGranted', () => {
    (window as DataLayerWindow).dataLayer = [];
    acceptAll();
    expect(getConsentChoice()).toBe('accepted');
  });

  it('declineAll is an alias for setConsentDeclined', () => {
    (window as DataLayerWindow).dataLayer = [];
    declineAll();
    expect(getConsentChoice()).toBe('declined');
  });

  it('setConsentDefault pushes a gtag(consent, default) command with CCPA defaults', () => {
    (window as DataLayerWindow).dataLayer = [];
    setConsentDefault();
    const args = lastConsentArgs();
    expect(args).not.toBeNull();
    expect(args![0]).toBe('consent');
    expect(args![1]).toBe('default');
    expect(args![2]).toMatchObject({
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'granted',
      functionality_storage: 'granted',
      security_storage: 'granted',
      wait_for_update: 500,
    });
  });

  it('setConsentDefault is a no-op when dataLayer is absent (zero-network)', () => {
    expect((window as DataLayerWindow).dataLayer).toBeUndefined();
    expect(() => setConsentDefault()).not.toThrow();
    expect((window as DataLayerWindow).dataLayer).toBeUndefined();
  });

  it('setConsentGranted is a no-op for dataLayer when it is absent', () => {
    expect((window as DataLayerWindow).dataLayer).toBeUndefined();
    setConsentGranted();
    // Storage still updates; dataLayer is not synthesized.
    expect(getConsentChoice()).toBe('accepted');
    expect((window as DataLayerWindow).dataLayer).toBeUndefined();
  });

  it('applyPersistedConsent re-applies a previously stored "accepted" choice', () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'accepted');
    (window as DataLayerWindow).dataLayer = [];
    applyPersistedConsent();
    const args = lastConsentArgs();
    expect(args).not.toBeNull();
    expect(args![1]).toBe('update');
    expect(args![2]).toMatchObject({ analytics_storage: 'granted' });
  });

  it('applyPersistedConsent re-applies a previously stored "declined" choice', () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'declined');
    (window as DataLayerWindow).dataLayer = [];
    applyPersistedConsent();
    const args = lastConsentArgs();
    expect(args).not.toBeNull();
    expect(args![1]).toBe('update');
    expect(args![2]).toMatchObject({ analytics_storage: 'denied' });
  });

  it('applyPersistedConsent does not push when no choice is stored', () => {
    (window as DataLayerWindow).dataLayer = [];
    applyPersistedConsent();
    expect(lastConsentArgs()).toBeNull();
  });

  it('openBanner dispatches the open-banner CustomEvent', () => {
    let fired = false;
    const handler = () => {
      fired = true;
    };
    window.addEventListener(CONSENT_BANNER_OPEN_EVENT, handler);
    openBanner();
    window.removeEventListener(CONSENT_BANNER_OPEN_EVENT, handler);
    expect(fired).toBe(true);
  });

  it('subscribe receives "accepted" notifications and unsubscribe stops them', () => {
    const seen: Array<string | null> = [];
    const unsubscribe = subscribe((c) => seen.push(c));
    setConsentGranted();
    expect(seen).toEqual(['accepted']);
    unsubscribe();
    setConsentDeclined();
    expect(seen).toEqual(['accepted']);
  });

  it('subscribe receives "declined" notifications', () => {
    const seen: Array<string | null> = [];
    subscribe((c) => seen.push(c));
    setConsentDeclined();
    expect(seen).toEqual(['declined']);
  });
});
