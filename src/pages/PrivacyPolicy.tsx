// TODO(operator): legal review before paid advertising launches.
// This template covers CCPA basics; supplement with Termly/Termageddon
// or attorney-reviewed text once budget permits.
//
// Last reviewed: 2026-05-09 (chunk: spa-tracking-and-consent-2026-05-09).
// Bump this date whenever the policy text or third-party list changes; the
// header `<p>Last updated: ...` text in the rendered page should match.

import { primaryLocation } from '@data/contact';
import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';

/*
 * PrivacyPolicy — chunk: spa-tracking-and-consent-2026-05-09 (implementer pass).
 *
 * Warm, plain-language CCPA-compliant policy. Expanded from the prior version
 * to add: information automatically collected, third-party sharing detail,
 * California rights, and how to exercise rights via the footer "Do Not Sell or
 * Share My Personal Information" link.
 *
 * Keeps the existing SMS/Mobile Messaging Privacy section intact so the
 * compliance-static-html.spec.ts assertions (privacy.spec.ts) continue to pass.
 */
function PrivacyPolicy() {
  return (
    <Section className="section-pad-y-md">
      <Container>
        <div className="inner-container _800px center">
          <header className="text-center">
            <p className="paragraph-small text-uppercase mg-bottom-16px">
              Last updated: May 9, 2026
            </p>
            <h1 className="display-7">Mukyala Privacy Policy</h1>
            <p className="paragraph-large mg-top-12px">
              This policy explains how Mukyala The Spa LLC (&ldquo;Mukyala&rdquo;, &ldquo;we&rdquo;,
              &ldquo;us&rdquo;) collects, uses, and protects personal information shared across our
              website, booking flows, and spa experiences.
            </p>
          </header>

          <div className="mg-top-40px rich-text w-richtext">
            <h2>About this policy</h2>
            <p>
              We&rsquo;re a Carlsbad, California day spa owned by licensed estheticians. This policy
              covers the information we collect when you visit{' '}
              <a href="https://www.mukyala.com">www.mukyala.com</a>, sign up for our newsletter,
              book or inquire about an appointment, or otherwise interact with us online. We aim for
              plain language; if anything here is unclear, email us at info@mukyala.com and
              we&rsquo;ll explain.
            </p>

            <h2>Information we collect</h2>
            <p>
              We collect a small amount of personal information, only what we need to run the spa
              and the website:
            </p>
            <ul>
              <li>
                <strong>Site analytics</strong> via Google Analytics 4 and Google Tag Manager
                &mdash; aggregate metrics about which pages you visit, which services you click on,
                and how you got to us.
              </li>
              <li>
                <strong>Email addresses</strong> you submit to our newsletter signup (&ldquo;Notify
                me when we open&rdquo; and similar surfaces).
              </li>
              <li>
                <strong>Booking and reservation data</strong> when you book or inquire about an
                appointment &mdash; your name, contact details, the service you want, your preferred
                date, and any notes you add.
              </li>
              <li>
                <strong>Information automatically collected</strong> by your browser when you load
                the site &mdash; your IP address, device and browser type, the pages you view, the
                page that referred you, and the time of your visit.
              </li>
              <li>
                <strong>SMS opt-in and consent state</strong> when you give us your mobile number
                for appointment reminders or other text messages.
              </li>
            </ul>

            <h2>How we use your information</h2>
            <p>We use what we collect to:</p>
            <ul>
              <li>Deliver the website and our services to you.</li>
              <li>
                Communicate with you about your appointments, our launch, and the Founders&rsquo;
                Rate.
              </li>
              <li>Measure how our marketing performs and where to invest next.</li>
              <li>Improve our offerings, copy, and customer experience.</li>
              <li>Comply with our legal obligations and protect against fraud or abuse.</li>
            </ul>

            <h2>Third parties we share with</h2>
            <p>
              We don&rsquo;t sell your personal information for money. We do share limited data with
              the service providers we use to run the spa and website:
            </p>
            <ul>
              <li>
                <strong>Google</strong> &mdash; for analytics (Google Analytics 4) and ads
                measurement, deployed via Google Tag Manager.
              </li>
              <li>
                <strong>Meta (Facebook / Instagram)</strong> &mdash; the Meta Pixel for ad
                measurement and audience-building.
              </li>
              <li>
                <strong>Our email service provider</strong> &mdash; used to send launch
                announcements, newsletter updates, and appointment-related messages.
              </li>
              <li>
                <strong>Our booking platform</strong> &mdash; the system that holds your reservation
                details and sends confirmations.
              </li>
              <li>
                <strong>Stripe</strong> &mdash; processes payments. We never see your full card
                number.
              </li>
              <li>
                <strong>Twilio</strong> &mdash; delivers SMS reminders and confirmations (only when
                you opt in).
              </li>
              <li>
                <strong>AWS</strong> &mdash; hosts the website and the application that runs it.
              </li>
            </ul>
            <p>
              Each of these partners follows contractual safeguards and only receives the minimum
              information they need to do their part.
            </p>

            <h2>Sharing &amp; processors</h2>
            <p>
              We do not sell or rent your mobile number. We use your mobile number only for Mukyala
              communications and may share it only with required processors (such as Twilio) solely
              to deliver those communications.
            </p>

            <h2>SMS/Mobile Messaging Privacy</h2>
            <p>
              When you provide your mobile phone number and opt in to receive text messages from
              Mukyala Day Spa, we collect your phone number, messaging consent status, and
              opt-in/opt-out preferences solely to deliver the messages you have requested. These
              messages may include reservation confirmations, appointment reminders, cancellation
              codes, customer support follow-ups, and, where you have separately opted in,
              promotional updates and offers.
            </p>
            <p>
              No mobile information will be shared with third parties or affiliates for marketing or
              promotional purposes.
            </p>
            <p>
              All of the data-sharing categories described elsewhere in this Privacy Policy exclude
              text messaging originator opt-in data and consent; this information will not be shared
              with any third parties.
            </p>
            <p>
              We may share your phone number only with service providers who help us deliver
              messages on our behalf (such as our messaging platform provider), strictly for the
              purpose of transmitting messages you have consented to receive. These service
              providers are contractually prohibited from using your information for their own
              marketing purposes.
            </p>
            <p>
              You may opt out of SMS messages at any time by replying STOP to any message you
              receive from us. After opting out, you will receive a single confirmation message and
              no further texts unless you re-subscribe. For assistance, reply HELP or contact us at
              info@mukyala.com or +1 {primaryLocation.phone.display}.
            </p>
            <p>
              Message frequency varies based on your activity and preferences. Message and data
              rates may apply.
            </p>

            <h2>Your California privacy rights (CCPA/CPRA)</h2>
            <p>
              California residents have the following rights under the California Consumer Privacy
              Act (CCPA) and the California Privacy Rights Act (CPRA):
            </p>
            <ul>
              <li>
                <strong>Right to know</strong> what personal information we collect, use, and share
                about you.
              </li>
              <li>
                <strong>Right to delete</strong> the personal information we hold about you, subject
                to limited exceptions (for example, completing a transaction you asked us to
                perform).
              </li>
              <li>
                <strong>Right to correct</strong> inaccurate personal information we hold about you.
              </li>
              <li>
                <strong>Right to opt out</strong> of the &ldquo;sale or sharing&rdquo; of your
                personal information for cross-context behavioral advertising.
              </li>
              <li>
                <strong>Right to limit use</strong> of sensitive personal information.
              </li>
              <li>
                <strong>Right to non-discrimination</strong> for exercising any of the above &mdash;
                we will not deny you service, charge a different price, or give you a different
                experience because you exercised your rights.
              </li>
            </ul>

            <h2>How to exercise your rights</h2>
            <p>To exercise any of the rights above, you have two options:</p>
            <ul>
              <li>
                Email <a href="mailto:info@mukyala.com">info@mukyala.com</a> from the address on
                file (or include enough information for us to verify your identity). We&rsquo;ll
                respond within 45 days.
              </li>
              <li>
                Click <strong>Do Not Sell or Share My Personal Information</strong> in our site
                footer to immediately flip your analytics and ad consent state. That action takes
                effect on your device right away &mdash; no email round-trip required.
              </li>
            </ul>

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

            <h2>Children</h2>
            <p>
              Our site is not directed at anyone under 16, and we do not knowingly collect personal
              information from children. If you believe a child has given us personal information,
              email info@mukyala.com and we&rsquo;ll delete it.
            </p>

            <h2>Updates to this policy</h2>
            <p>
              We&rsquo;ll note material changes here and update the &ldquo;Last updated&rdquo; date
              at the top. Substantive changes will also be reflected on the site, and where
              appropriate we&rsquo;ll notify you by email.
            </p>

            <h2>Contact</h2>
            <p>
              Mukyala The Spa LLC &middot; 390 Oak Ave, Carlsbad, CA 92008 &middot;{' '}
              {primaryLocation.phone.display} &middot; info@mukyala.com
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export default PrivacyPolicy;
