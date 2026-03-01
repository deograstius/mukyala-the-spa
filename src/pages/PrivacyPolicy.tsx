import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';

function PrivacyPolicy() {
  return (
    <Section className="section-pad-y-md">
      <Container>
        <div className="inner-container _800px center">
          <header className="text-center">
            <p className="paragraph-small text-uppercase mg-bottom-16px">
              Last updated: March 1, 2026
            </p>
            <h1 className="display-7">Mukyala Privacy Policy</h1>
            <p className="paragraph-large mg-top-12px">
              This policy explains how Mukyala Day Spa (“Mukyala”, “we”, “us”) collects, uses, and
              protects personal information shared across our website, booking flows, and spa
              experiences.
            </p>
          </header>

          <div className="mg-top-40px rich-text w-richtext">
            <h2>Information we collect</h2>
            <p>
              We collect the details you share when booking a reservation, purchasing products, or
              subscribing to updates. This includes contact details (name, email, phone), preferred
              services, appointment dates, payment confirmations, and consent preferences.
            </p>
            <ul>
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

            <h2>How we use your data</h2>
            <p>
              We process personal data to confirm and manage reservations, send transactional
              receipts, deliver marketing emails you opted into, safeguard our services, and comply
              with legal requirements. All marketing sends require a verified double opt-in, while
              transactional emails rely on legitimate interest to fulfill your booking or purchase.
            </p>
            <p>
              Data is encrypted at rest, redacted in logs, and retained per our guardrails
              (reservation details for 24 months before anonymization; consent logs for at least
              five years).
            </p>

            <h2>Sharing & processors</h2>
            <p>
              We only share data with processors that help us run Mukyala (Stripe for payments,
              Twilio/SES for messaging, AWS for hosting). Each partner follows contractual
              safeguards and receives only the minimum data required to provide their service.
            </p>
            <p>
              We do not sell or rent your mobile number. We use your mobile number only for Mukyala
              communications and may share it only with required processors (such as Twilio) solely
              to deliver those communications.
            </p>

            <h2>Your choices</h2>
            <ul>
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

            <h2>Contact</h2>
            <p>
              Mukyala Day Spa · 390 Oak Ave, Carlsbad, CA 92008 · (443) 681-0463 · info@mukyala.com
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export default PrivacyPolicy;
