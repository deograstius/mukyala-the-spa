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
                    <a href="/" className="logo-link w-inline-block">
                      <img src={logoSrc} alt={site.logo.altText} />
                    </a>
                    <div className="mg-top-16px">
                      <p className="paragraph-medium mg-bottom-8px">
                        {site.name} crafts hour-long rituals that honor African botanicals, backed
                        by licensed estheticians and AWS-secured infrastructure.
                      </p>
                      <p className="paragraph-small mg-bottom-0">
                        {address.line1}, {address.city}, {address.state} {address.postalCode}
                        <br />
                        <a href={`tel:${primaryLocation.phone?.tel ?? ''}`} className="link">
                          {primaryLocation.phone?.display}
                        </a>{' '}
                        ·{' '}
                        <a href={`mailto:${primaryLocation.email}`} className="link">
                          {primaryLocation.email}
                        </a>
                      </p>
                    </div>

                    <div className="mg-top-24px">
                      <p className="paragraph-small mg-bottom-0">
                        © {site.name} — All rights reserved.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="footer-column footer-column--policies">
                  <h2 className="paragraph-large mg-bottom-12px">Policies & Preferences</h2>
                  <ul role="list" className="nav-menu-list-wrapper">
                    <li className="nav-menu-list-item">
                      <a href="/privacy" className="nav-link">
                        Privacy Policy
                      </a>
                    </li>
                    <li className="nav-menu-list-item">
                      <a href="/terms" className="nav-link">
                        Terms of Service
                      </a>
                    </li>
                    <li className="nav-menu-list-item last">
                      <a href="/notifications/manage" className="nav-link">
                        Manage notifications
                      </a>
                    </li>
                  </ul>
                </div>

                <div className="footer-column footer-column--proof">
                  <h2 className="paragraph-large mg-bottom-12px">Proof of legitimacy</h2>
                  <p className="paragraph-medium mg-bottom-0">
                    Mukyala is a California spa with signed booking links, hashed cancel codes, and
                    at-least-once notification webhooks. AWS SES/Twilio credentials are verified,
                    and all guests can opt out using the links above or by emailing
                    info@mukyala.com.
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
