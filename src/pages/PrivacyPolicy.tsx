import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';

function PrivacyPolicy() {
  return (
    <Section className="section">
      <Container className="inner-container _820px">
        <header className="text-center">
          <p className="eyebrow">Last updated: November 18, 2025</p>
          <h1 className="display-7">Mukyala Privacy Policy</h1>
          <p className="paragraph-large mg-top-12px">
            This policy explains how Mukyala Day Spa (“Mukyala”, “we”, “us”) collects, uses, and
            protects personal information shared across our website, booking flows, and spa
            experiences.
          </p>
        </header>

        <div className="mg-top-40px">
          <section className="mg-bottom-40px">
            <h2 className="display-9">Information we collect</h2>
            <p className="paragraph-medium mg-top-12px">
              We collect the details you share when booking a reservation, purchasing products, or
              subscribing to updates. This includes contact details (name, email, phone), preferred
              services, appointment dates, payment confirmations, and consent preferences.
            </p>
            <ul className="paragraph-medium" style={{ marginTop: 12, paddingLeft: 20 }}>
              <li>
                Reservation information is required to honor the 24-hour notice / 90-day horizon
                rules.
              </li>
              <li>
                Emails gathered for newsletters or offers are stored only after you provide explicit
                consent.
              </li>
              <li>Support correspondence may include additional context you share voluntarily.</li>
            </ul>
          </section>

          <section className="mg-bottom-40px">
            <h2 className="display-9">How we use your data</h2>
            <p className="paragraph-medium mg-top-12px">
              We process personal data to confirm and manage reservations, send transactional
              receipts, deliver marketing emails you opted into, safeguard our services, and comply
              with legal requirements. All marketing sends require a verified double opt-in, while
              transactional emails rely on legitimate interest to fulfill your booking or purchase.
            </p>
            <p className="paragraph-medium mg-top-12px">
              Data is encrypted at rest, redacted in logs, and retained per our guardrails
              (reservation details for 24 months before anonymization; consent logs for at least
              five years).
            </p>
          </section>

          <section className="mg-bottom-40px">
            <h2 className="display-9">Sharing & processors</h2>
            <p className="paragraph-medium mg-top-12px">
              We only share data with processors that help us run Mukyala (Stripe for payments,
              Twilio/SES for messaging, AWS for hosting). Each partner follows contractual
              safeguards and receives only the minimum data required to provide their service.
            </p>
          </section>

          <section className="mg-bottom-40px">
            <h2 className="display-9">Your choices</h2>
            <ul className="paragraph-medium" style={{ marginTop: 12, paddingLeft: 20 }}>
              <li>
                Review, update, or delete reservation information by emailing info@mukyala.com.
              </li>
              <li>
                Manage notification preferences anytime at{' '}
                <a href="/notifications/manage">/notifications/manage</a>.
              </li>
              <li>
                Use the STOP keyword in SMS or the unsubscribe/manage-preferences link in every
                email.
              </li>
            </ul>
          </section>

          <section className="mg-bottom-40px">
            <h2 className="display-9">Contact</h2>
            <p className="paragraph-medium mg-top-12px">
              Mukyala Day Spa · 2951 State Street, Carlsbad, CA 92008 · (760) 870-1087 ·
              info@mukyala.com
            </p>
          </section>
        </div>
      </Container>
    </Section>
  );
}

export default PrivacyPolicy;
