/*
 * FoundersRibbon — chunk: spa-launch-readiness-seo-2026-05-09 (implementer pass).
 *
 * Sitewide dismissible top ribbon advertising the Founders' Rate. Mounted in
 * src/router.tsx -> RootLayout immediately above <Header />.
 *
 * Persistence contract:
 * - Dismissal is stored in localStorage under the exported
 *   `FOUNDERS_RIBBON_STORAGE_KEY` (`mukyala.foundersRibbonDismissed.v1`).
 *   Value `'1'` means dismissed; absence means visible.
 * - SSR / private-mode safe: localStorage access is wrapped in try/catch and
 *   the initial state is read synchronously in `useState` so dismissed users
 *   never see a flash of the ribbon on hydration.
 * - Cross-tab sync: a `storage` event listener mirrors a dismissal made in
 *   another tab.
 *
 * Retire / refresh playbook:
 * - To **retire the promo**: unmount `<FoundersRibbon />` from RootLayout, or
 *   gate it behind a feature flag. Do not silently change `RIBBON_COPY` on
 *   the same storage key — users who dismissed the old offer will never see
 *   the new one.
 * - To **re-enable for previously-dismissed users** (e.g. a new offer): bump
 *   the version suffix on `FOUNDERS_RIBBON_STORAGE_KEY`
 *   (`mukyala.foundersRibbonDismissed.v1` -> `.v2`). That resets the dismissal
 *   cohort so the new ribbon is shown to everyone.
 *
 * TODO(implementer): swap href to /reservation if operator prefers booking
 * over service-detail entry; gate via a feature flag if the offer needs to
 * retire after the first 50 guests are booked.
 */

import { useCallback, useEffect, useState } from 'react';

export const FOUNDERS_RIBBON_STORAGE_KEY = 'mukyala.foundersRibbonDismissed.v1';

const RIBBON_COPY = "Founders' Rate — Signature Facial $129 · First 50 guests";
const CTA_HREF = '/services/signature-facial';
const CTA_LABEL = 'Book the Founders\u2019 Rate';

function readDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(FOUNDERS_RIBBON_STORAGE_KEY) === '1';
  } catch {
    // Safari private mode / iOS lockdown can throw on localStorage access.
    return false;
  }
}

function writeDismissed(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FOUNDERS_RIBBON_STORAGE_KEY, '1');
  } catch {
    // Best-effort persist; dismissal will simply not survive a reload.
  }
}

function FoundersRibbon() {
  // Initialise from localStorage synchronously so we never flash the ribbon to
  // a guest who has already dismissed it. SSR-safe via the typeof check above.
  const [dismissed, setDismissed] = useState<boolean>(() => readDismissed());

  // If a different tab dismisses the ribbon, reflect that here too.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (event: StorageEvent) => {
      if (event.key === FOUNDERS_RIBBON_STORAGE_KEY && event.newValue === '1') {
        setDismissed(true);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const handleDismiss = useCallback(() => {
    writeDismissed();
    setDismissed(true);
  }, []);

  if (dismissed) return null;

  return (
    <div
      data-cta-id="founders-ribbon-impression"
      role="region"
      aria-label="Founders Rate promotion"
      style={{
        position: 'relative',
        width: '100%',
        backgroundColor: '#f3ead6',
        color: '#3a2e22',
        borderBottom: '1px solid rgba(58, 46, 34, 0.12)',
        padding: '10px 56px 10px 16px',
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 1.4,
        zIndex: 1000,
      }}
    >
      <span>
        {RIBBON_COPY}
        {' \u00b7 '}
        <a
          href={CTA_HREF}
          data-cta-id="founders-ribbon-cta"
          style={{ color: '#3a2e22', textDecoration: 'underline', fontWeight: 600 }}
        >
          {CTA_LABEL}
        </a>
      </span>
      <button
        type="button"
        onClick={handleDismiss}
        data-cta-id="founders-ribbon-dismiss"
        aria-label="Dismiss Founders Rate banner"
        style={{
          position: 'absolute',
          top: '50%',
          right: 8,
          transform: 'translateY(-50%)',
          width: 44,
          height: 44,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          color: '#3a2e22',
          cursor: 'pointer',
          fontSize: 20,
          lineHeight: 1,
          padding: 0,
        }}
      >
        <span aria-hidden="true">{'\u00d7'}</span>
      </button>
    </div>
  );
}

export default FoundersRibbon;
