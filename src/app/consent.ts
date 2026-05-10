/*
 * consent.ts — chunk: spa-tracking-and-consent-2026-05-09 (implementer pass).
 *
 * Google Consent Mode v2 wiring + a tiny localStorage-backed choice store for
 * the CookieBanner / "Do Not Sell or Share" surface.
 *
 * California / CCPA model (NOT GDPR):
 *   - Default analytics_storage = 'granted' (CCPA is opt-OUT).
 *   - Default ad_storage / ad_user_data / ad_personalization = 'denied' until
 *     the user clicks "Accept". This keeps Meta Pixel ad-bucket events off until
 *     consent is given, which is the safer default even under CCPA.
 *   - Banner is courtesy + future-proofs EU expansion.
 *
 * IMPORTANT: this module never assumes `gtag` / `dataLayer` exists. When the
 * `VITE_GTM_ID` env var is unset, GTM never loads, `window.dataLayer` will be
 * undefined, and every helper here is a silent no-op (zero network).
 *
 * Storage contract (locked):
 *   - localStorage key: `mukyala.consentChoice.v1`
 *   - Values: `'accepted' | 'declined'`. Absence = no choice yet (auto-show
 *     banner on first visit).
 *   - Bump the version suffix (.v1 -> .v2) ONLY if the consent semantics
 *     change in a way that warrants asking already-decided users again.
 *
 * Public API (consumed by CookieBanner + Footer + tests):
 *   - getConsentChoice(): reads stored choice ('accepted' | 'declined' | null).
 *   - setConsentDefault(): pushes the gtag('consent', 'default', ...) command.
 *     Wired by main.tsx very early so the first GTM tags see the default.
 *   - setConsentGranted() / acceptAll(): user accepted — flip ad_* to granted.
 *   - setConsentDeclined() / declineAll(): user declined — flip everything to denied.
 *   - applyPersistedConsent(): re-apply stored choice on subsequent loads.
 *   - openBanner(): dispatch the open-banner event (used by footer link).
 *   - subscribe(handler): listen for consent changes (in-process pubsub).
 */

export const CONSENT_STORAGE_KEY = 'mukyala.consentChoice.v1';
export const CONSENT_BANNER_OPEN_EVENT = 'mukyala:openConsentBanner';
export const CONSENT_CHANGE_EVENT = 'mukyala:consentChange';

export type ConsentChoice = 'accepted' | 'declined';

interface DataLayerWindow extends Window {
  dataLayer?: Array<unknown>;
}

/**
 * Read the persisted user choice. Returns `null` when no choice exists, the
 * value is unrecognized, or localStorage access throws (Safari private mode).
 */
export function getConsentChoice(): ConsentChoice | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (raw === 'accepted' || raw === 'declined') return raw;
    return null;
  } catch {
    return null;
  }
}

function writeChoice(choice: ConsentChoice): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    // Best-effort; banner will simply re-show on next visit.
  }
}

/**
 * Push raw arguments onto window.dataLayer. Silent no-op when dataLayer is
 * absent (i.e. GTM never loaded because VITE_GTM_ID was unset at build time).
 *
 * gtag's contract: it pushes the `arguments` array (an array-like) onto
 * dataLayer. GTM iterates dataLayer and dispatches `consent` commands when it
 * sees the arguments-shape. So we mirror that exact shape here.
 */
function pushGtag(...args: unknown[]): void {
  if (typeof window === 'undefined') return;
  const w = window as DataLayerWindow;
  if (!Array.isArray(w.dataLayer)) return;
  // Use the arguments-array shape gtag itself uses so GTM's consent state
  // machine recognises this as a `gtag('consent', ...)` call.
  w.dataLayer.push(args);
}

function emitChange(choice: ConsentChoice | null): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: { choice } }));
  } catch {
    // Old browsers / SSR / jsdom edge cases — non-fatal.
  }
}

/**
 * Push a `consent` `default` command onto `window.dataLayer` (if present).
 *
 * Must be called BEFORE the GTM snippet runs any tags. The Vite plugin
 * (scripts/vite-plugin-gtm.mjs) injects an inline <script> that does this in
 * head BEFORE the gtm.js loader, so when GTM loads the defaults are already
 * in place. This module-level helper exists for SPA-side defensive use (e.g.
 * a route that conditionally enables tracking).
 */
export function setConsentDefault(): void {
  pushGtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'granted',
    functionality_storage: 'granted',
    security_storage: 'granted',
    wait_for_update: 500,
  });
}

/**
 * User clicked "Accept" — flip ad_* + analytics_storage to granted and persist.
 */
export function setConsentGranted(): void {
  pushGtag('consent', 'update', {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    analytics_storage: 'granted',
  });
  writeChoice('accepted');
  emitChange('accepted');
}

/**
 * User clicked "No thanks" — flip everything user-tracking-shaped
 * to denied and persist. More restrictive than CCPA strictly requires (which
 * only mandates an opt-out for "sale or sharing"), but matches the UX promise:
 * "I declined analytics" should mean it.
 */
export function setConsentDeclined(): void {
  pushGtag('consent', 'update', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
  });
  writeChoice('declined');
  emitChange('declined');
}

/**
 * Re-apply the user's persisted choice on subsequent page loads. Call from
 * `setConsentDefault()`'s call site after the defaults are pushed, so a
 * returning visitor's previous Accept/Decline takes effect before any tags fire.
 */
export function applyPersistedConsent(): void {
  const choice = getConsentChoice();
  if (choice === 'accepted') {
    pushGtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted',
    });
  } else if (choice === 'declined') {
    pushGtag('consent', 'update', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    });
  }
  // null = no choice yet; defaults stand and banner will auto-show.
}

/**
 * Public alias for `setConsentGranted()`. Spec name from the implementer
 * playbook; kept alongside the architect's `setConsent*` names so call sites
 * can use either.
 */
export function acceptAll(): void {
  setConsentGranted();
}

/**
 * Public alias for `setConsentDeclined()`.
 */
export function declineAll(): void {
  setConsentDeclined();
}

/**
 * Dispatch the open-banner event so the CookieBanner re-shows itself. Used by
 * the footer "Do Not Sell or Share My Personal Information" link.
 */
export function openBanner(): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent(CONSENT_BANNER_OPEN_EVENT));
  } catch {
    // jsdom / SSR — non-fatal.
  }
}

/**
 * Subscribe to consent-change notifications. Returns an unsubscribe function.
 * Useful for components that need to react to Accept/Decline without owning the
 * banner state themselves.
 */
export function subscribe(handler: (choice: ConsentChoice | null) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const listener = (e: Event) => {
    const detail = (e as CustomEvent<{ choice: ConsentChoice | null }>).detail;
    handler(detail?.choice ?? null);
  };
  window.addEventListener(CONSENT_CHANGE_EVENT, listener);
  return () => window.removeEventListener(CONSENT_CHANGE_EVENT, listener);
}
