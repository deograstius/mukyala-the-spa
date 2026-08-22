/*
 * Unit tests for the build-time prerender entry (src/prerender.tsx).
 *
 * The home ('/') fallback is load-bearing for Google OAuth branding
 * verification: the raw HTML served for the home page must contain the app
 * name "Mukyala" (matching the consent screen verbatim), a description of the
 * app's functionality, the Google Ads API data-use statement, and links to
 * /privacy and /terms. These tests run in the unit suite (pre-push gate) so a
 * regression is caught before the e2e pass.
 */

import { describe, expect, it } from 'vitest';

import { prerender } from './prerender';

describe('prerender', () => {
  it('home fallback contains the exact app name as an <h1>', async () => {
    const { html } = await prerender({ url: '/' });
    expect(html).toContain('<h1>Mukyala</h1>');
  });

  it('home fallback describes functionality and Google Ads API data use', async () => {
    const { html } = await prerender({ url: '/' });
    expect(html).toContain('Licensed esthetician facials');
    expect(html).toContain('Carlsbad, California');
    expect(html).toContain('Google Ads API');
    expect(html).toContain('does not access personal data');
  });

  it('home fallback links to the privacy policy and terms of service', async () => {
    const { html } = await prerender({ url: '/' });
    expect(html).toContain('href="/privacy"');
    expect(html).toContain('href="/terms"');
  });

  it('returns empty html for routes outside the prerender set', async () => {
    const { html } = await prerender({ url: '/checkout' });
    expect(html).toBe('');
  });

  it('renders real content for the prerendered /privacy route', async () => {
    const { html } = await prerender({ url: '/privacy' });
    expect(html).toContain('Privacy Policy');
  });
});
