/*
 * CookieBanner unit tests — chunk: spa-tracking-and-consent-2026-05-09 (implementer pass).
 */

import { CONSENT_BANNER_OPEN_EVENT, CONSENT_STORAGE_KEY } from '@app/consent';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect } from 'vitest';

import CookieBanner from '../CookieBanner';

interface DataLayerWindow extends Window {
  dataLayer?: Array<unknown>;
}

describe('CookieBanner', () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete (window as DataLayerWindow).dataLayer;
  });

  afterEach(() => {
    window.localStorage.clear();
    delete (window as DataLayerWindow).dataLayer;
  });

  it('exports the open-event name (regression guard)', () => {
    expect(CONSENT_BANNER_OPEN_EVENT).toBe('mukyala:openConsentBanner');
  });

  it('auto-shows on first visit when no consent choice exists', () => {
    render(<CookieBanner />);
    expect(screen.getByRole('region', { name: /cookie consent/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^accept$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^no thanks$/i })).toBeInTheDocument();
  });

  it('renders the operator-approved body copy', () => {
    render(<CookieBanner />);
    const region = screen.getByRole('region', { name: /cookie consent/i });
    expect(region).toHaveTextContent(/we use cookies to understand how the site is used/i);
    expect(region).toHaveTextContent(/measure ads/i);
    expect(region).toHaveTextContent(/decline below if you.d rather not/i);
  });

  it('hides after Accept and persists "accepted" in localStorage', () => {
    (window as DataLayerWindow).dataLayer = [];
    render(<CookieBanner />);
    fireEvent.click(screen.getByRole('button', { name: /^accept$/i }));
    expect(screen.queryByRole('region', { name: /cookie consent/i })).not.toBeInTheDocument();
    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBe('accepted');
  });

  it('hides after Decline and persists "declined" in localStorage', () => {
    (window as DataLayerWindow).dataLayer = [];
    render(<CookieBanner />);
    fireEvent.click(screen.getByRole('button', { name: /^no thanks$/i }));
    expect(screen.queryByRole('region', { name: /cookie consent/i })).not.toBeInTheDocument();
    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBe('declined');
  });

  it('does not auto-show when a choice has already been persisted', () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'accepted');
    render(<CookieBanner />);
    expect(screen.queryByRole('region', { name: /cookie consent/i })).not.toBeInTheDocument();
  });

  it('re-opens when the mukyala:openConsentBanner window event fires', () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'accepted');
    render(<CookieBanner />);
    expect(screen.queryByRole('region', { name: /cookie consent/i })).not.toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new CustomEvent(CONSENT_BANNER_OPEN_EVENT));
    });

    expect(screen.getByRole('region', { name: /cookie consent/i })).toBeInTheDocument();
  });

  it('Accept fires a granted gtag update onto dataLayer', () => {
    (window as DataLayerWindow).dataLayer = [];
    render(<CookieBanner />);
    fireEvent.click(screen.getByRole('button', { name: /^accept$/i }));
    const dl = (window as DataLayerWindow).dataLayer!;
    const consentPush = dl.find((e) => Array.isArray(e) && e[0] === 'consent') as
      | unknown[]
      | undefined;
    expect(consentPush).toBeDefined();
    expect(consentPush![1]).toBe('update');
    expect(consentPush![2]).toMatchObject({ ad_storage: 'granted' });
  });

  it('Decline fires a denied gtag update onto dataLayer', () => {
    (window as DataLayerWindow).dataLayer = [];
    render(<CookieBanner />);
    fireEvent.click(screen.getByRole('button', { name: /^no thanks$/i }));
    const dl = (window as DataLayerWindow).dataLayer!;
    const consentPush = dl.find((e) => Array.isArray(e) && e[0] === 'consent') as
      | unknown[]
      | undefined;
    expect(consentPush).toBeDefined();
    expect(consentPush![2]).toMatchObject({ ad_storage: 'denied' });
  });

  it('the banner body uses aria-live="polite" for accessibility', () => {
    render(<CookieBanner />);
    const region = screen.getByRole('region', { name: /cookie consent/i });
    const polite = region.querySelector('[aria-live="polite"]');
    expect(polite).not.toBeNull();
  });

  it('Accept also pushes a consent_granted event onto dataLayer (telemetry)', () => {
    (window as DataLayerWindow).dataLayer = [];
    render(<CookieBanner />);
    fireEvent.click(screen.getByRole('button', { name: /^accept$/i }));
    const dl = (window as DataLayerWindow).dataLayer!;
    const grantedEvent = dl.find(
      (e) => !Array.isArray(e) && (e as Record<string, unknown>).event === 'consent_granted',
    );
    expect(grantedEvent).toBeDefined();
    expect(grantedEvent).toMatchObject({ event: 'consent_granted', source: 'cookie_banner' });
  });

  it('Decline also pushes a consent_declined event onto dataLayer (telemetry)', () => {
    (window as DataLayerWindow).dataLayer = [];
    render(<CookieBanner />);
    fireEvent.click(screen.getByRole('button', { name: /^no thanks$/i }));
    const dl = (window as DataLayerWindow).dataLayer!;
    const declinedEvent = dl.find(
      (e) => !Array.isArray(e) && (e as Record<string, unknown>).event === 'consent_declined',
    );
    expect(declinedEvent).toBeDefined();
    expect(declinedEvent).toMatchObject({ event: 'consent_declined', source: 'cookie_banner' });
  });

  it('Accept and Decline buttons have explicit data-cta-id attributes (analytics)', () => {
    render(<CookieBanner />);
    expect(screen.getByRole('button', { name: /^accept$/i })).toHaveAttribute(
      'data-cta-id',
      'cookie-banner-accept',
    );
    expect(screen.getByRole('button', { name: /^no thanks$/i })).toHaveAttribute(
      'data-cta-id',
      'cookie-banner-decline',
    );
  });
});
