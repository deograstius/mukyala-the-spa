import type { ServiceItem } from '../types/service';

/*
 * services.ts — Mukyala service menu (trimmed to the Signature Facial only,
 * operator decision 2026-09-18; was the 8-service opening menu from chunk
 * spa-launch-readiness-seo-2026-05-09).
 *
 * This is the single source of truth for menu pricing. JSON-LD Offer entries
 * in index.html and the sitemap.xml service-detail entries must stay in
 * lockstep with the slugs and prices below. A future chunk should generate
 * both from this file at build time.
 *
 * This list is the API-DOWN fallback only (useHomeData) — the live menu is
 * the services table in core-api, where the other services were removed
 * (deleted, or deactivated where reservations reference them).
 */

export const services: ServiceItem[] = [
  {
    slug: 'signature-facial',
    title: 'Signature Facial',
    image: '/images/so-africal-facial.jpg',
    imageSrcSet:
      '/images/so-africal-facial-p-500.jpg 500w, /images/so-africal-facial-p-800.jpg 800w, /images/so-africal-facial.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
    href: '/services/signature-facial',
    description:
      'A complete licensed-esthetician facial — assessment, double-cleanse, exfoliation, extractions, mask, and finishing serums tailored to your skin.',
    duration: '60 min',
    priceCents: 18500,
  },
];
