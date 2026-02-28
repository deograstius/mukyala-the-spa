import { setBaseTitle } from '@app/seo';
import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';
import { useEffect } from 'react';

function RefundsPolicy() {
  useEffect(() => {
    setBaseTitle('Refunds & Returns');
  }, []);

  return (
    <Section className="section-pad-y-md">
      <Container>
        <div className="inner-container _800px center">
          <header className="text-center">
            <p className="paragraph-small text-uppercase mg-bottom-16px">
              Last updated: 2026-02-28
            </p>
            <h1 className="display-11">Refunds &amp; Returns</h1>
            <p className="paragraph-large mg-top-12px">
              We want you to feel confident ordering skincare from Mukyala. This policy covers
              shipped product orders (not spa services).
            </p>
          </header>

          <div className="mg-top-40px rich-text w-richtext">
            <h2>Returns (shipped products)</h2>
            <p>
              If something isn’t right, you can request a return within <strong>14 days</strong> of
              delivery. Items must be unused, unopened, and in their original packaging.
            </p>
            <ul>
              <li>For hygiene and safety, we can’t accept returns on opened or used products.</li>
              <li>Final-sale items (if labeled at purchase) are not returnable.</li>
              <li>
                We may ask for photos to confirm condition before issuing a return authorization.
              </li>
            </ul>

            <h2>Refunds</h2>
            <p>
              Once your return is received and inspected, we’ll email you an update. Approved
              refunds are issued to the original payment method. Processing times vary by bank, but
              most refunds appear within <strong>5–10 business days</strong> after approval.
            </p>
            <p>
              Original shipping fees are non-refundable, and return shipping is your responsibility
              unless the item arrived damaged or we sent the wrong item.
            </p>

            <h2>Damaged, missing, or incorrect items</h2>
            <p>
              If your order arrives damaged, incomplete, or incorrect, email us within{' '}
              <strong>48 hours</strong> of delivery so we can make it right. Include your order
              number and photos of the package and product(s).
            </p>

            <h2>How to start a return</h2>
            <p>
              Email{' '}
              <a href="mailto:info@mukyala.com?subject=Refund%20%26%20Return%20Request">
                info@mukyala.com
              </a>{' '}
              with your order number and the item(s) you’d like to return. If eligible, we’ll send
              return instructions and the correct return address.
            </p>

            <h2>Services</h2>
            <p>
              This policy applies to shipped products only. For appointment changes, please review
              our <a href="/terms">Terms of Service</a>.
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export default RefundsPolicy;
