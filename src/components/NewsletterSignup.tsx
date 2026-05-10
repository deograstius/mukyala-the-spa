/*
 * NewsletterSignup — chunk: spa-tracking-and-consent-2026-05-09 (implementer pass).
 *
 * "Notify me when we open" email capture form. POSTs to `VITE_NEWSLETTER_ENDPOINT`
 * (operator wires a Klaviyo embedded-form action URL, a Mailchimp /post-json,
 * or a serverless function — we don't pick the backend here, just define the
 * contract).
 *
 * Backend contract:
 *   POST <VITE_NEWSLETTER_ENDPOINT>
 *   Content-Type: application/json
 *   Body: { "email": string, "source": string }
 *     - source = location.pathname at submit time (e.g. "/about", "/services").
 *   Success: any 2xx response. Body is ignored.
 *   Error: any non-2xx OR network failure -> render the generic error message.
 *
 * Anti-spam:
 *   - Honeypot field named `company` (visually hidden via inline style + tabIndex
 *     -1 + aria-hidden). If filled at submit time, silently mark success and
 *     skip the POST + the GTM `lead` event. Bots see the field and fill it,
 *     real users don't.
 *
 * Telemetry:
 *   - On success (only when honeypot was clean), fire `trackLead(pathname)`
 *     via @app/analytics. No-op when GTM is not loaded.
 *
 * Variants:
 *   - 'inline'  -> compact horizontal layout, used "above the footer" on every
 *                  page (mounted inside RootLayout in src/router.tsx).
 *   - 'section' -> full-width page-section layout, used as a section on /about.
 */

import { trackLead } from '@app/analytics';
import { useState } from 'react';

export type NewsletterSignupProps = {
  variant?: 'inline' | 'section';
  headline?: string;
  subcopy?: string;
};

type FormState = 'idle' | 'submitting' | 'success' | 'error';

const DEFAULT_HEADLINE = 'Notify me when we open';
const DEFAULT_SUBCOPY = "Be first to know about Founders' Rate appointments and our grand opening.";

// Simplified RFC-5322 — sufficient for client-side guard. The real
// authoritative validation happens server-side / at the email provider.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function NewsletterSignup({
  variant = 'inline',
  headline = DEFAULT_HEADLINE,
  subcopy = DEFAULT_SUBCOPY,
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [state, setState] = useState<FormState>('idle');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Bot? Silently succeed without POST or telemetry.
    if (honeypot.trim().length > 0) {
      setState('success');
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setState('error');
      return;
    }

    setState('submitting');

    const endpoint = (import.meta.env.VITE_NEWSLETTER_ENDPOINT as string | undefined)?.trim();
    const source = typeof window !== 'undefined' ? window.location.pathname : '/';

    if (!endpoint) {
      // Dev path: endpoint not configured. Treat as success so the UI works in
      // dev without a backend. No POST goes out. Fire `lead` so the operator
      // can see the dataLayer push when they wire GTM later.
      if (import.meta.env.DEV) {
        console.warn(
          '[NewsletterSignup] VITE_NEWSLETTER_ENDPOINT is not set. ' +
            'Treating submit as success without POST. Set the env var to enable real submission.',
        );
      }
      setState('success');
      trackLead(source);
      return;
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setState('success');
      trackLead(source);
    } catch {
      setState('error');
    }
  }

  return (
    <section
      className={
        variant === 'section'
          ? 'newsletter-signup newsletter-signup--section'
          : 'newsletter-signup newsletter-signup--inline'
      }
      data-cta-id="newsletter-signup-impression"
      data-variant={variant}
      aria-labelledby="newsletter-signup-heading"
      style={
        variant === 'section'
          ? {
              padding: '48px 16px',
              background: '#f3ead6',
              color: '#3a2e22',
              borderRadius: 12,
            }
          : {
              padding: '24px 16px',
              maxWidth: 720,
              margin: '0 auto',
            }
      }
    >
      <div style={{ marginBottom: 16 }}>
        <h2
          id="newsletter-signup-heading"
          className={variant === 'section' ? 'display-9' : 'paragraph-large'}
          style={{ margin: 0 }}
        >
          {headline}
        </h2>
        {subcopy ? (
          <p className="paragraph-small" style={{ marginTop: 8, marginBottom: 0, lineHeight: 1.4 }}>
            {subcopy}
          </p>
        ) : null}
      </div>

      {state === 'success' ? (
        <p role="status" aria-live="polite" style={{ margin: 0 }}>
          Thanks &mdash; we&rsquo;ll let you know when we open.
        </p>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          {/* Honeypot — invisible to humans, attractive to bots. */}
          <label
            htmlFor="newsletter-company"
            aria-hidden="true"
            tabIndex={-1}
            style={{
              position: 'absolute',
              left: '-10000px',
              width: 1,
              height: 1,
              overflow: 'hidden',
            }}
          >
            Company
          </label>
          <input
            id="newsletter-company"
            type="text"
            name="company"
            autoComplete="off"
            tabIndex={-1}
            aria-hidden="true"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            style={{
              position: 'absolute',
              left: '-10000px',
              width: 1,
              height: 1,
              overflow: 'hidden',
            }}
          />

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              alignItems: 'stretch',
            }}
          >
            <label htmlFor="newsletter-email" className="visually-hidden">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              name="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (state === 'error') setState('idle');
              }}
              disabled={state === 'submitting'}
              style={{
                flex: '1 1 220px',
                minWidth: 0,
                padding: '10px 12px',
                border: '1px solid rgba(58, 46, 34, 0.4)',
                borderRadius: 8,
                background: '#fff',
                color: '#3a2e22',
                fontSize: 14,
              }}
            />
            <button
              type="submit"
              disabled={state === 'submitting'}
              data-cta-id="newsletter-submit"
              style={{
                padding: '10px 18px',
                background: '#3a2e22',
                color: '#f3ead6',
                border: '1px solid #3a2e22',
                borderRadius: 8,
                cursor: state === 'submitting' ? 'progress' : 'pointer',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {state === 'submitting' ? 'Sending\u2026' : 'Notify me'}
            </button>
          </div>

          {state === 'error' ? (
            <p role="alert" style={{ marginTop: 12, color: '#7a2e2e' }}>
              Hmm, that didn&rsquo;t go through. Mind trying again?
            </p>
          ) : null}
        </form>
      )}
    </section>
  );
}

export default NewsletterSignup;
