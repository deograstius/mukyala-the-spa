import logoSrc from '/images/mukyala_logo.png';
// chunk: spa-tracking-and-consent-2026-05-09 (implementer pass).
// CONSENT_BANNER_OPEN_EVENT lets the footer "Do Not Sell or Share My Personal
// Information" link re-open CookieBanner from anywhere on the site without a
// React Context. Banner subscribes to this window CustomEvent.
import { CONSENT_BANNER_OPEN_EVENT } from '@app/consent';
import Container from '@shared/ui/Container';
import { primaryLocation } from '../data/contact';
import { site } from '../data/site';

// chunk: spa-tracking-and-consent-2026-05-09 (architect stub).
// CCPA gives Californians a right to opt out of the "sale or sharing" of their
// personal information. Even though our processing is closer to "limited
// sharing for analytics + ad measurement" than "sale," the safer compliance
// posture is to surface the opt-out link verbatim. Clicking it re-opens
// CookieBanner so the user can flip their consent state.
function openConsentBanner() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CONSENT_BANNER_OPEN_EVENT));
}

function Footer() {
  const address = primaryLocation.address;
  const supportAddress = [
    address.line1,
    address.line2,
    `${address.city}, ${address.state} ${address.postalCode}`,
  ]
    .filter(Boolean)
    .join(', ');
  const supportMapUrl = primaryLocation.mapUrl;
  const supportPhone = primaryLocation.phone;
  const supportEmail = primaryLocation.email;

  return (
    <footer className="footer-wrapper">
      <Container>
        <div className="card footer-card">
          <div className="inner-container _1140px">
            <div className="footer-middle">
              <div className="w-layout-grid grid-3-columns grid-footer">
                <div className="footer-logo---newsletter footer-column footer-column--brand">
                  <div>
                    <a href="/" className="logo-link w-inline-block" data-cta-id="footer-logo">
                      <img src={logoSrc} alt={site.logo.altText} />
                    </a>
                    <div className="mg-top-16px">
                      <p className="footer-body paragraph-medium mg-bottom-8px">
                        {site.name} blends timeless care with modern technique: science-based
                        facials and treatments rooted in African botanicals, guided by licensed
                        estheticians.
                      </p>
                      <h2 className="footer-title paragraph-large mg-bottom-8px">
                        Support contact
                      </h2>
                      <p className="footer-fineprint paragraph-small mg-bottom-8px">
                        Questions about reservations, products, or your visit? Reach us here.
                      </p>
                      <p className="footer-fineprint paragraph-small mg-bottom-0">
                        Visit us:{' '}
                        {supportMapUrl ? (
                          <a
                            href={supportMapUrl}
                            className="link footer-contact-link"
                            data-cta-id="footer-address"
                            target="_blank"
                            rel="noreferrer"
                          >
                            {supportAddress}
                          </a>
                        ) : (
                          supportAddress
                        )}
                        <br />
                        {supportPhone ? (
                          <>
                            Call:{' '}
                            <a
                              href={`tel:${supportPhone.tel}`}
                              className="link footer-contact-link"
                              data-cta-id="footer-phone"
                            >
                              {supportPhone.display}
                            </a>
                            <br />
                          </>
                        ) : null}
                        Email:{' '}
                        {supportEmail ? (
                          <a
                            href={`mailto:${supportEmail}`}
                            className="link footer-contact-link"
                            data-cta-id="footer-email"
                          >
                            {supportEmail}
                          </a>
                        ) : (
                          supportEmail
                        )}
                      </p>
                    </div>

                    <div className="mg-top-24px">
                      <p className="footer-fineprint paragraph-small mg-bottom-0">
                        © {site.name}. All rights reserved.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="footer-column footer-column--policies">
                  <h2 className="footer-title paragraph-large mg-bottom-12px">
                    Policies & Preferences
                  </h2>
                  <ul role="list" className="footer-links nav-menu-list-wrapper">
                    <li className="nav-menu-list-item">
                      <a
                        href="/privacy"
                        className="footer-link nav-link"
                        data-cta-id="footer-privacy"
                      >
                        Privacy Policy
                      </a>
                    </li>
                    <li className="nav-menu-list-item">
                      <a href="/terms" className="footer-link nav-link" data-cta-id="footer-terms">
                        Terms of Service
                      </a>
                    </li>
                    <li className="nav-menu-list-item">
                      <a
                        href="/terms#cancellations"
                        className="footer-link nav-link"
                        data-cta-id="footer-cancellations"
                      >
                        Cancellations
                      </a>
                    </li>
                    <li className="nav-menu-list-item">
                      <a
                        href="/refunds"
                        className="footer-link nav-link"
                        data-cta-id="footer-refunds"
                      >
                        Refunds &amp; Returns
                      </a>
                    </li>
                    <li className="nav-menu-list-item">
                      <a
                        href="/shipping"
                        className="footer-link nav-link"
                        data-cta-id="footer-shipping"
                      >
                        Shipping / Fulfillment
                      </a>
                    </li>
                    <li className="nav-menu-list-item">
                      <a
                        href="/sms-disclosures"
                        className="footer-link nav-link"
                        data-cta-id="footer-sms-disclosures"
                      >
                        SMS Program Disclosures
                      </a>
                    </li>
                    <li className="nav-menu-list-item">
                      <a
                        href="/notifications/manage"
                        className="footer-link nav-link"
                        data-cta-id="footer-manage-notifications"
                      >
                        Manage notifications
                      </a>
                    </li>
                    {/*
                      chunk: spa-tracking-and-consent-2026-05-09 (implementer pass).
                      CCPA "Do Not Sell or Share My Personal Information" entry.
                      Renders as a link-styled <button> so the visual treatment
                      matches the surrounding <a> rows but the action is a
                      window event dispatch, not a navigation. The CookieBanner
                      listens for `mukyala:openConsentBanner` and opens with
                      the user's current state pre-selected. Covered by
                      e2e/spa-tracking-and-consent.spec.ts.
                    */}
                    <li className="nav-menu-list-item last">
                      <button
                        type="button"
                        onClick={openConsentBanner}
                        className="footer-link nav-link button-reset"
                        data-cta-id="footer-do-not-sell-or-share"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: 0,
                          font: 'inherit',
                          color: 'inherit',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        Do Not Sell or Share My Personal Information
                      </button>
                    </li>
                  </ul>
                </div>

                <div className="footer-column footer-column--proof">
                  <h2 className="footer-title paragraph-large mg-bottom-12px">Peace of mind</h2>
                  <p className="footer-body paragraph-medium mg-bottom-0">
                    We use secure confirmation links and simple cancel codes to protect your
                    reservation. If you need help, use the support contact listed in this footer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
