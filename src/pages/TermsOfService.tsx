import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';

function TermsOfService() {
  return (
    <Section className="section">
      <Container className="inner-container _820px">
        <header className="text-center">
          <p className="eyebrow">Last updated: November 18, 2025</p>
          <h1 className="display-7">Mukyala Terms of Service</h1>
          <p className="paragraph-large mg-top-12px">
            These terms govern how you access Mukyala Day Spa experiences, purchase products, and
            interact with our digital services. By booking an appointment, buying items, or
            subscribing to notifications, you agree to the rules below.
          </p>
        </header>

        <div className="mg-top-40px">
          <section className="mg-bottom-32px">
            <h2 className="display-9">Appointments & cancellations</h2>
            <ul className="paragraph-medium" style={{ marginTop: 12, paddingLeft: 20 }}>
              <li>
                A minimum of 24 hours’ notice is required to reschedule or cancel any reservation.
              </li>
              <li>
                Bookings cannot be scheduled more than 90 days in advance and use fixed 60-minute
                slots.
              </li>
              <li>
                Signed confirmation links and six-digit cancel codes are required to manage
                bookings; protect them like a password.
              </li>
            </ul>
          </section>

          <section className="mg-bottom-32px">
            <h2 className="display-9">Purchases & payments</h2>
            <p className="paragraph-medium mg-top-12px">
              Product sales and service deposits are processed through our PCI-compliant partners.
              By completing checkout you authorize Mukyala to charge the selected method for the
              stated amount. All prices are denominated in USD and include applicable taxes where
              required.
            </p>
          </section>

          <section className="mg-bottom-32px">
            <h2 className="display-9">Communications</h2>
            <p className="paragraph-medium mg-top-12px">
              Transactional emails or SMS (appointment confirmations, receipts, cancel codes) are
              sent as part of fulfilling your booking. Marketing communications require explicit
              consent and a verified double opt-in. You can withdraw consent at any time via the
              links provided in each message or at{' '}
              <a href="/notifications/manage">/notifications/manage</a>.
            </p>
          </section>

          <section className="mg-bottom-32px">
            <h2 className="display-9">Acceptable use</h2>
            <p className="paragraph-medium mg-top-12px">
              You agree not to misuse the site, interfere with other guests’ reservations, or
              attempt to reverse engineer, scrape, or overload our services. We may suspend access
              if we detect abuse or security threats.
            </p>
          </section>

          <section className="mg-bottom-32px">
            <h2 className="display-9">Liability</h2>
            <p className="paragraph-medium mg-top-12px">
              To the fullest extent permitted by law, Mukyala’s liability is limited to the amounts
              you paid for the applicable service or product. We do not guarantee uninterrupted
              access to third-party services (e.g., payment gateways, messaging networks) but take
              reasonable steps to keep them available.
            </p>
          </section>

          <section className="mg-bottom-32px">
            <h2 className="display-9">Contact</h2>
            <p className="paragraph-medium mg-top-12px">
              Questions about these terms? Email info@mukyala.com or mail us at 2951 State Street,
              Carlsbad, CA 92008.
            </p>
          </section>
        </div>
      </Container>
    </Section>
  );
}

export default TermsOfService;
