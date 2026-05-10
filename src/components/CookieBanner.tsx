/*
 * CookieBanner — chunk: spa-tracking-and-consent-2026-05-09 (implementer pass).
 *
 * Sitewide bottom-fixed dismissible cookie/consent banner. Two buttons:
 *   - Accept       -> setConsentGranted()
 *   - No thanks    -> setConsentDeclined()
 *
 * Visibility:
 *   - Auto-shows on first visit (no `mukyala.consentChoice.v1` localStorage entry).
 *   - Hidden after the user has made a choice.
 *   - Re-openable via the footer "Do Not Sell or Share My Personal Information"
 *     link, which dispatches the `mukyala:openConsentBanner` window event.
 */

import { trackEvent, EV } from '@app/analytics';
import {
  applyPersistedConsent,
  CONSENT_BANNER_OPEN_EVENT,
  getConsentChoice,
  setConsentDeclined,
  setConsentGranted,
} from '@app/consent';
import { useEffect, useState } from 'react';

function CookieBanner() {
  // Initialise from localStorage synchronously so we never flash the banner to
  // a returning visitor who has already chosen.
  const [open, setOpen] = useState<boolean>(() => getConsentChoice() === null);

  // Re-apply persisted choice on mount so a returning visitor's earlier
  // Accept/Decline takes effect before any GTM tags fire on this page load.
  useEffect(() => {
    applyPersistedConsent();
  }, []);

  // Footer "Do Not Sell or Share" link dispatches this event to re-open the
  // banner regardless of stored choice.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onOpen = () => setOpen(true);
    window.addEventListener(CONSENT_BANNER_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(CONSENT_BANNER_OPEN_EVENT, onOpen);
  }, []);

  if (!open) return null;

  const handleAccept = () => {
    setConsentGranted();
    trackEvent(EV.CONSENT_GRANTED, { source: 'cookie_banner' });
    setOpen(false);
  };

  const handleDecline = () => {
    setConsentDeclined();
    // Push the decline event onto dataLayer too — harmless when GTM is absent
    // (no-op) and useful for downstream measurement when GTM loads later.
    trackEvent(EV.CONSENT_DECLINED, { source: 'cookie_banner' });
    setOpen(false);
  };

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      data-cta-id="cookie-banner"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        // Above page content but below modal layer (CartDrawer ~1000,
        // FoundersRibbon ~1000). Banner sits at 900 so it visually sits below
        // any active modal overlay; coexists with FoundersRibbon (top, 1000).
        zIndex: 900,
        display: 'flex',
        justifyContent: 'center',
        padding: '12px',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          pointerEvents: 'auto',
          width: '100%',
          maxWidth: 640,
          background: '#f3ead6',
          color: '#3a2e22',
          border: '1px solid rgba(58, 46, 34, 0.12)',
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <p aria-live="polite" className="paragraph-small" style={{ margin: 0, lineHeight: 1.4 }}>
          We use cookies to understand how the site is used and to measure ads. Decline below if
          you&rsquo;d rather not.
        </p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={handleDecline}
            data-cta-id="cookie-banner-decline"
            style={{
              background: 'transparent',
              color: '#3a2e22',
              border: '1px solid #3a2e22',
              borderRadius: 8,
              padding: '12px 20px',
              minHeight: 44,
              minWidth: 96,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            No thanks
          </button>
          <button
            type="button"
            onClick={handleAccept}
            data-cta-id="cookie-banner-accept"
            style={{
              background: '#3a2e22',
              color: '#f3ead6',
              border: '1px solid #3a2e22',
              borderRadius: 8,
              padding: '12px 20px',
              minHeight: 44,
              minWidth: 96,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

export default CookieBanner;
