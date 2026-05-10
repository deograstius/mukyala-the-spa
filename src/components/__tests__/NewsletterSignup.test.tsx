/*
 * NewsletterSignup unit tests — chunk: spa-tracking-and-consent-2026-05-09 (implementer pass).
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';

import NewsletterSignup from '../NewsletterSignup';

interface DataLayerWindow extends Window {
  dataLayer?: Array<Record<string, unknown>>;
}

const ENDPOINT = 'https://example.test/newsletter';

describe('NewsletterSignup', () => {
  beforeEach(() => {
    delete (window as DataLayerWindow).dataLayer;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    delete (window as DataLayerWindow).dataLayer;
  });

  it('renders an email input + submit button (smoke)', () => {
    render(<NewsletterSignup />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /notify me/i })).toBeInTheDocument();
  });

  it('renders a heading element with the default headline', () => {
    render(<NewsletterSignup />);
    expect(screen.getByRole('heading', { name: /notify me when we open/i })).toBeInTheDocument();
  });

  it('renders a honeypot field that is visually hidden + tab-skipped', () => {
    const { container } = render(<NewsletterSignup />);
    const honeypot = container.querySelector('input[name="company"]') as HTMLInputElement | null;
    expect(honeypot).not.toBeNull();
    expect(honeypot!.getAttribute('aria-hidden')).toBe('true');
    expect(honeypot!.tabIndex).toBe(-1);
    // Off-screen positioning (matches the inline style applied in the component).
    expect(honeypot!.style.position).toBe('absolute');
  });

  it('honeypot-filled submit silently succeeds without calling fetch', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('VITE_NEWSLETTER_ENDPOINT', ENDPOINT);

    const { container } = render(<NewsletterSignup />);
    const honeypot = container.querySelector('input[name="company"]') as HTMLInputElement;
    const email = screen.getByLabelText(/email address/i) as HTMLInputElement;

    fireEvent.change(honeypot, { target: { value: 'http://spam.example' } });
    fireEvent.change(email, { target: { value: 'real@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /notify me/i }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/we[’']?ll let you know/i);
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('invalid email flips into error state without firing fetch', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('VITE_NEWSLETTER_ENDPOINT', ENDPOINT);

    render(<NewsletterSignup />);
    const email = screen.getByLabelText(/email address/i) as HTMLInputElement;
    fireEvent.change(email, { target: { value: 'not-an-email' } });
    fireEvent.click(screen.getByRole('button', { name: /notify me/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/hmm, that didn.t go through/i);
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('successful POST flips into success state and fires lead event', async () => {
    (window as DataLayerWindow).dataLayer = [];
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('VITE_NEWSLETTER_ENDPOINT', ENDPOINT);

    render(<NewsletterSignup />);
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'real@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /notify me/i }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/we[’']?ll let you know/i);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      ENDPOINT,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('real@example.com'),
      }),
    );
    const dl = (window as DataLayerWindow).dataLayer!;
    const lead = dl.find((e) => e.event === 'lead');
    expect(lead).toBeDefined();
  });

  it('failed POST flips into error state with the generic error copy', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('VITE_NEWSLETTER_ENDPOINT', ENDPOINT);

    render(<NewsletterSignup />);
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'real@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /notify me/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/hmm, that didn.t go through/i);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('section variant emits a different layout marker than inline (default)', () => {
    const { container: inlineEl, unmount } = render(<NewsletterSignup variant="inline" />);
    const inline = inlineEl.querySelector('[data-cta-id="newsletter-signup-impression"]');
    expect(inline?.getAttribute('data-variant')).toBe('inline');
    expect(inline?.className).toContain('newsletter-signup--inline');
    unmount();

    const { container: sectionEl } = render(<NewsletterSignup variant="section" />);
    const section = sectionEl.querySelector('[data-cta-id="newsletter-signup-impression"]');
    expect(section?.getAttribute('data-variant')).toBe('section');
    expect(section?.className).toContain('newsletter-signup--section');
  });

  it('custom headline + subcopy props override the defaults', () => {
    render(<NewsletterSignup headline="Custom headline copy" subcopy="Custom subcopy line" />);
    expect(screen.getByRole('heading', { name: /custom headline copy/i })).toBeInTheDocument();
    expect(screen.getByText(/custom subcopy line/i)).toBeInTheDocument();
    // And no longer renders the defaults.
    expect(screen.queryByText(/founders' rate appointments/i)).not.toBeInTheDocument();
  });

  it('POST body has the {email, source} contract shape', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('VITE_NEWSLETTER_ENDPOINT', ENDPOINT);

    render(<NewsletterSignup />);
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'shape@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /notify me/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body).toHaveProperty('email', 'shape@example.com');
    expect(body).toHaveProperty('source');
    expect(typeof body.source).toBe('string');
  });

  it('failed POST does NOT fire the lead event', async () => {
    (window as DataLayerWindow).dataLayer = [];
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('VITE_NEWSLETTER_ENDPOINT', ENDPOINT);

    render(<NewsletterSignup />);
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'fail@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /notify me/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    const dl = (window as DataLayerWindow).dataLayer!;
    const lead = dl.find((e) => e.event === 'lead');
    expect(lead).toBeUndefined();
  });

  it('does not POST when VITE_NEWSLETTER_ENDPOINT is unset (dev fallback)', async () => {
    (window as DataLayerWindow).dataLayer = [];
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('VITE_NEWSLETTER_ENDPOINT', '');
    // Quiet the dev-only console warning we emit.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(<NewsletterSignup />);
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'real@example.com' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /notify me/i }));
    });

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/we[’']?ll let you know/i);
    });
    expect(fetchMock).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
