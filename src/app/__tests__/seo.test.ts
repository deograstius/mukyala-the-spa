/*
 * setRouteMeta unit tests — chunk: spa-launch-readiness-seo-2026-05-09 (tester pass).
 *
 * Covers per-route head mutation: title, description, og:* / twitter:* tags,
 * canonical, partial-input non-clobbering, double-call convergence, and
 * lazy-create-on-missing semantics.
 */

import { afterEach, beforeEach, describe, it, expect } from 'vitest';

import { setRouteMeta } from '../seo';

function getMetaContentByName(name: string): string | null {
  const el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  return el ? el.getAttribute('content') : null;
}

function getMetaContentByProperty(property: string): string | null {
  const el = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  return el ? el.getAttribute('content') : null;
}

function getCanonicalHref(): string | null {
  const el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  return el ? el.getAttribute('href') : null;
}

describe('setRouteMeta', () => {
  beforeEach(() => {
    // Wipe head between tests so we exercise the lazy-create paths cleanly.
    document.head.innerHTML = '';
    document.title = '';
  });

  afterEach(() => {
    document.head.innerHTML = '';
    document.title = '';
  });

  it('updates document.title when title is provided', () => {
    setRouteMeta({ title: 'Carlsbad Skin Studio | Mukyala' });
    expect(document.title).toBe('Carlsbad Skin Studio | Mukyala');
  });

  it('updates <meta name="description"> content when description is provided', () => {
    setRouteMeta({ description: 'Licensed esthetician facials in Carlsbad.' });
    expect(getMetaContentByName('description')).toBe('Licensed esthetician facials in Carlsbad.');
  });

  it('updates og:image, og:url, og:title, og:description when those are provided', () => {
    setRouteMeta({
      title: 'OG title',
      description: 'OG description',
      canonical: 'https://www.mukyala.com/services/signature-facial',
      ogImage: 'https://www.mukyala.com/og-image.jpg',
    });

    expect(getMetaContentByProperty('og:title')).toBe('OG title');
    expect(getMetaContentByProperty('og:description')).toBe('OG description');
    expect(getMetaContentByProperty('og:url')).toBe(
      'https://www.mukyala.com/services/signature-facial',
    );
    expect(getMetaContentByProperty('og:image')).toBe('https://www.mukyala.com/og-image.jpg');
  });

  it('updates twitter:image, twitter:title, twitter:description when those are provided', () => {
    setRouteMeta({
      title: 'Twitter title',
      description: 'Twitter description',
      ogImage: 'https://www.mukyala.com/og-image.jpg',
    });

    expect(getMetaContentByName('twitter:title')).toBe('Twitter title');
    expect(getMetaContentByName('twitter:description')).toBe('Twitter description');
    expect(getMetaContentByName('twitter:image')).toBe('https://www.mukyala.com/og-image.jpg');
  });

  it('partial input only mutates the provided fields (no clobbering)', () => {
    // Seed with a full set.
    setRouteMeta({
      title: 'Initial title',
      description: 'Initial description',
      canonical: 'https://www.mukyala.com/initial',
      ogImage: 'https://www.mukyala.com/og-image.jpg',
    });

    // Sanity baseline.
    expect(document.title).toBe('Initial title');
    expect(getMetaContentByName('description')).toBe('Initial description');
    expect(getCanonicalHref()).toBe('https://www.mukyala.com/initial');
    expect(getMetaContentByProperty('og:image')).toBe('https://www.mukyala.com/og-image.jpg');

    // Partial update: only title.
    setRouteMeta({ title: 'Updated title' });

    // Title fields update.
    expect(document.title).toBe('Updated title');
    expect(getMetaContentByProperty('og:title')).toBe('Updated title');
    expect(getMetaContentByName('twitter:title')).toBe('Updated title');

    // Other fields stay intact.
    expect(getMetaContentByName('description')).toBe('Initial description');
    expect(getMetaContentByProperty('og:description')).toBe('Initial description');
    expect(getMetaContentByName('twitter:description')).toBe('Initial description');
    expect(getCanonicalHref()).toBe('https://www.mukyala.com/initial');
    expect(getMetaContentByProperty('og:url')).toBe('https://www.mukyala.com/initial');
    expect(getMetaContentByProperty('og:image')).toBe('https://www.mukyala.com/og-image.jpg');
    expect(getMetaContentByName('twitter:image')).toBe('https://www.mukyala.com/og-image.jpg');
  });

  it('two calls with different values converge to the latest values', () => {
    setRouteMeta({
      title: 'First',
      description: 'First description',
      canonical: 'https://www.mukyala.com/first',
      ogImage: 'https://www.mukyala.com/first.jpg',
    });

    setRouteMeta({
      title: 'Second',
      description: 'Second description',
      canonical: 'https://www.mukyala.com/second',
      ogImage: 'https://www.mukyala.com/second.jpg',
    });

    expect(document.title).toBe('Second');
    expect(getMetaContentByName('description')).toBe('Second description');
    expect(getMetaContentByProperty('og:title')).toBe('Second');
    expect(getMetaContentByProperty('og:description')).toBe('Second description');
    expect(getMetaContentByProperty('og:url')).toBe('https://www.mukyala.com/second');
    expect(getMetaContentByProperty('og:image')).toBe('https://www.mukyala.com/second.jpg');
    expect(getMetaContentByName('twitter:title')).toBe('Second');
    expect(getMetaContentByName('twitter:description')).toBe('Second description');
    expect(getMetaContentByName('twitter:image')).toBe('https://www.mukyala.com/second.jpg');
    expect(getCanonicalHref()).toBe('https://www.mukyala.com/second');

    // Idempotent re-apply does not throw and does not regress values.
    setRouteMeta({
      title: 'Second',
      description: 'Second description',
      canonical: 'https://www.mukyala.com/second',
      ogImage: 'https://www.mukyala.com/second.jpg',
    });
    expect(document.title).toBe('Second');
    expect(getMetaContentByName('description')).toBe('Second description');
  });

  it('creates meta tags lazily when they do not exist (no crash on missing tags)', () => {
    // document.head is empty (cleared in beforeEach). Every meta path must
    // create the element on demand rather than throw.
    expect(document.head.querySelectorAll('meta').length).toBe(0);

    expect(() =>
      setRouteMeta({
        title: 'Lazy title',
        description: 'Lazy description',
        canonical: 'https://www.mukyala.com/lazy',
        ogImage: 'https://www.mukyala.com/lazy.jpg',
        ogImageAlt: 'Lazy image alt',
      }),
    ).not.toThrow();

    expect(getMetaContentByName('description')).toBe('Lazy description');
    expect(getMetaContentByProperty('og:title')).toBe('Lazy title');
    expect(getMetaContentByProperty('og:description')).toBe('Lazy description');
    expect(getMetaContentByProperty('og:url')).toBe('https://www.mukyala.com/lazy');
    expect(getMetaContentByProperty('og:image')).toBe('https://www.mukyala.com/lazy.jpg');
    expect(getMetaContentByName('twitter:title')).toBe('Lazy title');
    expect(getMetaContentByName('twitter:description')).toBe('Lazy description');
    expect(getMetaContentByName('twitter:image')).toBe('https://www.mukyala.com/lazy.jpg');
    expect(getMetaContentByProperty('og:image:alt')).toBe('Lazy image alt');
    expect(getMetaContentByName('twitter:image:alt')).toBe('Lazy image alt');
    expect(getCanonicalHref()).toBe('https://www.mukyala.com/lazy');
  });

  it('does not create duplicate meta elements when called twice', () => {
    setRouteMeta({ description: 'First description' });
    setRouteMeta({ description: 'Second description' });
    const matches = document.head.querySelectorAll('meta[name="description"]');
    expect(matches.length).toBe(1);
    expect(getMetaContentByName('description')).toBe('Second description');
  });
});
