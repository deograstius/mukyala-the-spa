import logoSrc from '/images/mukyala_logo.png';
import Container from '@shared/ui/Container';
import { primaryLocation } from '../data/contact';
import { site } from '../data/site';

function Footer() {
  const address = primaryLocation.address;
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
                      <p className="footer-fineprint paragraph-small mg-bottom-0">
                        {address.line1}, {address.city}, {address.state} {address.postalCode}
                        <br />
                        <a
                          href={`tel:${primaryLocation.phone?.tel ?? ''}`}
                          className="link"
                          data-cta-id="footer-phone"
                        >
                          {primaryLocation.phone?.display}
                        </a>{' '}
                        ·{' '}
                        <a
                          href={`mailto:${primaryLocation.email}`}
                          className="link"
                          data-cta-id="footer-email"
                        >
                          {primaryLocation.email}
                        </a>
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
                    <li className="nav-menu-list-item last">
                      <a
                        href="/notifications/manage"
                        className="footer-link nav-link"
                        data-cta-id="footer-manage-notifications"
                      >
                        Manage notifications
                      </a>
                    </li>
                  </ul>
                </div>

                <div className="footer-column footer-column--proof">
                  <h2 className="footer-title paragraph-large mg-bottom-12px">Peace of mind</h2>
                  <p className="footer-body paragraph-medium mg-bottom-0">
                    We use secure confirmation links and simple cancel codes to protect your
                    reservation. If you need help, email info@mukyala.com.
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
