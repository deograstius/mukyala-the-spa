import type { ServiceItem } from '../types/service';

/*
 * services.ts — Mukyala opening menu (chunk: spa-launch-readiness-seo-2026-05-09).
 *
 * This is the single source of truth for the opening-menu pricing. JSON-LD
 * Offer entries in index.html and the sitemap.xml service-detail entries must
 * stay in lockstep with the slugs and prices below. A future chunk should
 * generate both from this file at build time.
 *
 * NOTE: the disclosure copy on the nano-needling entry below is REQUIRED
 * (operator legal/positioning). Do not soften.
 *
 * TODO(implementer): swap /images/home-hero.jpg per service for commissioned
 * hero imagery and regenerate src/generated/mediaPlaceholders.ts thumbhashes.
 * Until that lands, every entry shares the home-hero placeholder.
 */

export const services: ServiceItem[] = [
  {
    slug: 'signature-facial',
    title: 'Signature Facial',
    image: '/images/home-hero.jpg',
    imageSrcSet:
      '/images/home-hero-p-500.jpg 500w, /images/home-hero-p-800.jpg 800w, /images/home-hero.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
    href: '/services/signature-facial',
    description:
      'A complete licensed-esthetician facial — assessment, double-cleanse, exfoliation, extractions, mask, and finishing serums tailored to your skin.',
    duration: '60 min',
    priceCents: 18500,
  },
  {
    slug: 'deluxe-ritual-facial',
    title: 'Deluxe Ritual Facial',
    image: '/images/home-hero.jpg',
    imageSrcSet:
      '/images/home-hero-p-500.jpg 500w, /images/home-hero-p-800.jpg 800w, /images/home-hero.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
    href: '/services/deluxe-ritual-facial',
    description:
      'An extended 90-minute ritual combining the Signature Facial with neck and décolleté work, hand and arm massage, and an LED finish.',
    duration: '90 min',
    priceCents: 24500,
  },
  {
    slug: 'dermaplane-facial',
    title: 'Dermaplane Facial',
    image: '/images/home-hero.jpg',
    imageSrcSet:
      '/images/home-hero-p-500.jpg 500w, /images/home-hero-p-800.jpg 800w, /images/home-hero.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
    href: '/services/dermaplane-facial',
    description:
      'Precision exfoliation that removes vellus hair and dead surface skin for an instantly smoother, brighter finish. Pairs well with peels.',
    duration: '60 min',
    priceCents: 19500,
  },
  {
    slug: 'chemical-peel',
    title: 'Chemical Peel',
    image: '/images/home-hero.jpg',
    imageSrcSet:
      '/images/home-hero-p-500.jpg 500w, /images/home-hero-p-800.jpg 800w, /images/home-hero.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
    href: '/services/chemical-peel',
    // The "Series of 3 — $450" package is described in copy here as an interim.
    // TODO(implementer): extend ServiceItem with a structured `packages` field
    // and surface the series price in the services UI + JSON-LD as a separate
    // Offer entry once operator approves the shape.
    description:
      'Targeted resurfacing peel for tone, texture, and post-inflammatory pigmentation. Available as a single session or a series of 3 ($450) for cumulative results.',
    duration: '45 min',
    priceCents: 17500,
  },
  {
    slug: 'nano-needling',
    title: 'Nano-needling',
    image: '/images/home-hero.jpg',
    imageSrcSet:
      '/images/home-hero-p-500.jpg 500w, /images/home-hero-p-800.jpg 800w, /images/home-hero.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
    href: '/services/nano-needling',
    // REQUIRED disclosure copy (operator legal/positioning). Do not soften.
    // TODO(implementer): also surface as a visible badge/callout on the
    // /services/nano-needling page — not just buried in description copy.
    description:
      'Cosmetic-depth (<0.3mm) treatment performed by a licensed esthetician. Encourages product penetration and a refined finish without clinical-depth needling.',
    duration: '60 min',
    priceCents: 25000,
  },
  {
    slug: 'body-scrub-ritual',
    title: 'Body Scrub Ritual',
    image: '/images/home-hero.jpg',
    imageSrcSet:
      '/images/home-hero-p-500.jpg 500w, /images/home-hero-p-800.jpg 800w, /images/home-hero.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
    href: '/services/body-scrub-ritual',
    description:
      'Full-body exfoliation, warm towels, and a hydrating finish. Leaves skin polished, soft, and ready for the season.',
    duration: '60 min',
    priceCents: 24500,
  },
  {
    slug: 'back-facial',
    title: 'Back Facial',
    image: '/images/home-hero.jpg',
    imageSrcSet:
      '/images/home-hero-p-500.jpg 500w, /images/home-hero-p-800.jpg 800w, /images/home-hero.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
    href: '/services/back-facial',
    description:
      'A focused treatment for the back — cleanse, exfoliate, extract where appropriate, and finish with calming serums and SPF.',
    duration: '45 min',
    priceCents: 11500,
  },
  {
    slug: 'led-add-on',
    title: 'LED Therapy Add-on',
    image: '/images/home-hero.jpg',
    imageSrcSet:
      '/images/home-hero-p-500.jpg 500w, /images/home-hero-p-800.jpg 800w, /images/home-hero.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
    href: '/services/led-add-on',
    description:
      'Add 20 minutes of professional LED light therapy to any facial. Wavelengths selected for your skin goals. Add-on only.',
    duration: '20 min',
    priceCents: 3500,
  },
];
