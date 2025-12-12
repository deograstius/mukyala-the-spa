import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';
import { useState } from 'react';

type FormState = 'idle' | 'submitted';

function ManageNotifications() {
  const [status, setStatus] = useState<FormState>('idle');
  const [message, setMessage] = useState('');

  function handleUnavailable(feature: string) {
    setStatus('submitted');
    setMessage(
      `Thank you! We will finish wiring ${feature} shortly. In the meantime email info@mukyala.com for immediate assistance.`,
    );
  }

  return (
    <Section className="pd-top-50px pd-bottom-200px">
      <Container>
        <div className="inner-container _800px center">
          <header className="text-center">
            <p className="paragraph-small text-uppercase mg-bottom-16px">Manage notifications</p>
            <h1 className="display-7">Update how we contact you</h1>
            <p className="paragraph-large mg-top-12px">
              Use this page to confirm marketing opt-in, pause promotional emails, or stop all but
              essential reservation updates. A double opt-in link or cancel code is required so only
              you can change these settings.
            </p>
          </header>

          <div className="mg-top-40px">
            <div className="card pd-24px">
              <h2 className="display-9">Option 1 · Email link</h2>
              <p className="paragraph-medium mg-top-12px">
                Enter the email address you used with Mukyala. We’ll send a secure confirmation link
                (48-hour TTL, single-use) so you can review preferences.
              </p>
              <form
                className="mg-top-20px"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleUnavailable('email preference links');
                }}
              >
                <label className="paragraph-small" htmlFor="manage-email">
                  Email address
                </label>
                <input
                  id="manage-email"
                  type="email"
                  required
                  className="w-input input-line medium"
                  placeholder="you@example.com"
                  style={{ marginTop: 8, marginBottom: 16 }}
                />
                <button type="submit" className="button-primary w-button">
                  Send confirmation link
                </button>
              </form>
            </div>

            <div className="card mg-top-32px pd-24px">
              <h2 className="display-9">Option 2 · Cancel code</h2>
              <p className="paragraph-medium mg-top-12px">
                Have a six-digit cancel code? Enter it below to load the associated reservation and
                adjust notification preferences instantly.
              </p>
              <form
                className="mg-top-20px"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleUnavailable('cancel code preferences');
                }}
              >
                <label className="paragraph-small" htmlFor="manage-code">
                  6-digit code
                </label>
                <input
                  id="manage-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  className="w-input input-line medium"
                  placeholder="123456"
                  style={{ marginTop: 8, marginBottom: 16, width: 160 }}
                />
                <button type="submit" className="button-secondary w-button">
                  Continue
                </button>
              </form>
            </div>

            <div className="card mg-top-32px pd-24px">
              <h2 className="display-9">Need help now?</h2>
              <p className="paragraph-medium mg-top-12px">
                Email info@mukyala.com or call (760) 870-1087. We’ll honor unsubscribe requests
                within one business day while the automated experience rolls out.
              </p>
            </div>

            {status === 'submitted' && (
              <div
                className="card mg-top-24px pd-24px"
                role="status"
                style={{ background: '#f3f4f6' }}
              >
                <p className="paragraph-medium" style={{ margin: 0 }}>
                  {message}
                </p>
              </div>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}

export default ManageNotifications;
