import { setBaseTitle } from '@app/seo';
import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';
import { useEffect } from 'react';

function ShippingPolicy() {
  useEffect(() => {
    setBaseTitle('Shipping / Fulfillment');
  }, []);

  return (
    <Section className="section-pad-y-md">
      <Container>
        <div className="inner-container _800px center">
          <header className="text-center">
            <p className="paragraph-small text-uppercase mg-bottom-16px">
              Last updated: 2026-02-28
            </p>
            <h1 className="display-11">Shipping / Fulfillment</h1>
            <p className="paragraph-large mg-top-12px">
              This policy covers shipped product orders (not spa services). It explains when we
              ship, how long fulfillment usually takes, and what to expect after your order leaves
              us.
            </p>
          </header>

          <div className="mg-top-40px rich-text w-richtext">
            <h2>Order processing</h2>
            <p>
              We process and pack orders Monday through Friday (excluding major U.S. holidays).
              Orders placed before <strong>2:00 PM PT</strong> are typically processed the same
              business day. Orders placed after cutoff usually process the next business day.
            </p>
            <p>
              During launches, promotions, or holiday peaks, processing may take up to{' '}
              <strong>2–3 business days</strong>.
            </p>

            <h2>Estimated transit times</h2>
            <p>
              Delivery windows begin after fulfillment and are estimates, not guarantees. Most
              orders arrive within:
            </p>
            <ul>
              <li>
                Contiguous U.S.: <strong>2–5 business days</strong>
              </li>
              <li>
                Alaska and Hawaii: <strong>4–8 business days</strong>
              </li>
            </ul>
            <p>Business days do not include weekends or U.S. holidays.</p>

            <h2>Carriers</h2>
            <p>
              We currently ship with <strong>USPS</strong>, <strong>UPS</strong>, and{' '}
              <strong>FedEx</strong>. Carrier options may vary by destination, package weight, and
              current service availability.
            </p>

            <h2>Shipping costs</h2>
            <p>
              Shipping rates are <strong>calculated at checkout</strong> based on destination,
              package size, and selected delivery speed. Available methods and final shipping cost
              are shown before payment.
            </p>

            <h2>Delivery regions</h2>
            <p>
              We currently ship to the <strong>United States</strong>, including the contiguous
              U.S., Alaska, and Hawaii.
            </p>
            <p>
              We do not currently ship to international destinations, U.S. territories, or APO/FPO
              addresses.
            </p>

            <h2>Tracking</h2>
            <p>
              Once your order ships, we’ll email a tracking link to the address used at checkout.
              Please allow up to 24 hours for the carrier tracking page to update.
            </p>

            <h2>Lost, damaged, or incorrect deliveries</h2>
            <p>
              If your package arrives damaged, appears lost in transit, or you receive the wrong
              item, contact us at{' '}
              <a href="mailto:info@mukyala.com?subject=Shipping%20Issue">info@mukyala.com</a> within{' '}
              <strong>48 hours</strong> of delivery (or expected delivery for lost shipments).
              Include your order number and photos when available.
            </p>
            <p>
              We’ll review the issue and, when appropriate, coordinate a replacement, refund, or
              carrier claim support.
            </p>

            <h2>Incorrect or undeliverable addresses</h2>
            <p>
              Please confirm your shipping address before placing an order. If a package is delayed
              or returned due to an incorrect/incomplete address entered at checkout, additional
              shipping fees may apply for reshipment.
            </p>

            <h2>Returns</h2>
            <p>
              For returns and refunds, see our <a href="/refunds">Refunds &amp; Returns</a> policy.
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export default ShippingPolicy;
