import { setBaseTitle } from '@app/seo';
import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';
import { useEffect } from 'react';

function SmsDisclosures() {
  useEffect(() => {
    setBaseTitle('SMS Program Disclosures');
  }, []);

  return (
    <Section className="section-pad-y-md">
      <Container>
        <div className="inner-container _800px center">
          <header className="text-center">
            <p className="paragraph-small text-uppercase mg-bottom-16px">
              Last updated: February 28, 2026
            </p>
            <h1 className="display-11">SMS Program Disclosures</h1>
            <p className="paragraph-large mg-top-12px">
              These disclosures apply to the Mukyala Day Spa waitlist SMS program.
            </p>
          </header>

          <div className="mg-top-40px rich-text w-richtext">
            <h2>Program details</h2>
            <p>
              Brand/program name: Mukyala Day Spa Waitlist SMS Program. Message frequency varies.
              Msg &amp; data rates may apply.
            </p>
            <p>
              To stop receiving messages, reply <strong>STOP</strong>. For help, reply{' '}
              <strong>HELP</strong>.
            </p>

            <h2>Consent & messaging terms</h2>
            <p>
              Waitlist SMS messages are marketing texts. By texting to join the waitlist, you agree
              to receive recurring marketing text messages from Mukyala Day Spa at the number
              provided. Consent is not a condition of purchase.
            </p>

            <h2>Related policies</h2>
            <p>
              Please review our <a href="/privacy">Privacy Policy</a> and{' '}
              <a href="/terms">Terms of Service</a> for additional details.
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export default SmsDisclosures;
