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
              <div className="footer-logo---newsletter">
                <a href="/" className="logo-link w-inline-block">
                  <img src={logoSrc} alt={site.logo.altText} />
                </a>
                <div className="mg-top-16px">
                  <p className="paragraph-medium" style={{ marginBottom: 8 }}>
                    {site.name} crafts hour-long rituals that honor African botanicals, backed by
                    licensed estheticians and AWS-secured infrastructure.
                  </p>
                  <p className="paragraph-small" style={{ margin: 0 }}>
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
              </div>

              <div
                className="footer-links"
                style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}
              >
                <div>
                  <h2 className="paragraph-large" style={{ marginBottom: 12 }}>
                    Policies & Preferences
                  </h2>
                  <ul
                    className="paragraph-medium"
                    style={{ listStyle: 'none', padding: 0, margin: 0 }}
                  >
                    <li>
                      <a href="/privacy" className="link">
                        Privacy Policy
                      </a>
                    </li>
                    <li>
                      <a href="/terms" className="link">
                        Terms of Service
                      </a>
                    </li>
                    <li>
                      <a href="/notifications/manage" className="link">
                        Manage notifications
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h2 className="paragraph-large" style={{ marginBottom: 12 }}>
                    Proof of legitimacy
                  </h2>
                  <p className="paragraph-medium" style={{ margin: 0 }}>
                    Mukyala is a California spa with signed booking links, hashed cancel codes, and
                    at-least-once notification webhooks. AWS SES/Twilio credentials are verified,
                    and all guests can opt out using the links above or by emailing
                    info@mukyala.com.
                  </p>
                </div>
              </div>
            </div>

            <div className="mg-top-24px">
              <p className="paragraph-small" style={{ margin: 0 }}>
                © {site.name} — All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
