import * as React from 'react';
import { EVENT_NAME } from './eventConfig';
import Canceled from './pages/Canceled';
import Landing from './pages/Landing';
import Thanks from './pages/Thanks';
import Tickets from './pages/Tickets';

/**
 * Four static routes navigated with real page loads (nginx falls back to
 * index.html). A router library would be ceremony here; Stripe's redirect
 * URLs (/thanks, /canceled) arrive as fresh page loads anyway.
 */
function currentPage(): React.ReactNode {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path === '/tickets') return <Tickets />;
  if (path === '/thanks') return <Thanks />;
  if (path === '/canceled') return <Canceled />;
  return <Landing />;
}

/**
 * Wordmark only — no header CTA. The header isn't sticky, so a pill here
 * only ever shared the viewport with the hero's own "Get tickets" (operator:
 * too many redundant buttons). One CTA per moment: hero → session cards →
 * closing pill.
 */
function Header() {
  return (
    <header className="dmv-header">
      <a href="/" className="dmv-wordmark" aria-label={`${EVENT_NAME} home`}>
        <span className="dmv-wordmark-brand">mukyala</span>
        <span className="dmv-wordmark-divider">·</span>
        <span className="dmv-wordmark-event">{EVENT_NAME}</span>
      </a>
    </header>
  );
}

function Footer() {
  return (
    <footer className="dmv-footer">
      <p className="dmv-footer-brand">an event by Mukyala</p>
      <nav className="dmv-footer-links" aria-label="Policies">
        <a className="text-link" href="https://staging.mukyala.com/privacy">
          Privacy
        </a>
        <a className="text-link" href="https://staging.mukyala.com/terms">
          Terms
        </a>
        <a className="text-link" href="mailto:info@mukyala.com">
          Contact
        </a>
      </nav>
    </footer>
  );
}

export default function DmvApp() {
  return (
    <div className="dmv-app">
      <Header />
      <main>{currentPage()}</main>
      <Footer />
    </div>
  );
}
