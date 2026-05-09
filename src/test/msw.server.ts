import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { CreateReservationInput } from '../hooks/reservations.api';

// Simple defaults for pages tests; tests can override via server.use(...)
//
// chunk: spa-launch-readiness-seo-2026-05-09 (implementer pass).
// `defaultServices` now starts with the new opening-menu services (so the
// /services/$slug loader can resolve canonical slugs in tests like
// ServiceDetail.test.tsx) and KEEPS the legacy fixtures appended afterwards
// to preserve the ~30 existing tests pinned to legacy strings (ServiceCard,
// ServicesGrid, Reservation, etc.). A clean migration belongs in a future
// chunk.
//
// TODO(implementer): migrate the legacy-pinned tests to the new menu in a
// follow-up chunk and remove the legacy entries below.
const defaultServices = [
  {
    slug: 'signature-facial',
    title: 'Signature Facial',
    description:
      'A complete licensed-esthetician facial — assessment, double-cleanse, exfoliation, extractions, mask, and finishing serums tailored to your skin.',
    durationMinutes: 60,
    priceCents: 18500,
    image: '/images/home-hero.jpg',
    imageSrcSet:
      '/images/home-hero-p-500.jpg 500w, /images/home-hero-p-800.jpg 800w, /images/home-hero.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
  },
  {
    slug: 'deluxe-ritual-facial',
    title: 'Deluxe Ritual Facial',
    description:
      'An extended 90-minute ritual combining the Signature Facial with neck and décolleté work, hand and arm massage, and an LED finish.',
    durationMinutes: 90,
    priceCents: 24500,
    image: '/images/home-hero.jpg',
    imageSrcSet:
      '/images/home-hero-p-500.jpg 500w, /images/home-hero-p-800.jpg 800w, /images/home-hero.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
  },
  {
    slug: 'dermaplane-facial',
    title: 'Dermaplane Facial',
    description:
      'Precision exfoliation that removes vellus hair and dead surface skin for an instantly smoother, brighter finish.',
    durationMinutes: 60,
    priceCents: 19500,
    image: '/images/home-hero.jpg',
    imageSrcSet:
      '/images/home-hero-p-500.jpg 500w, /images/home-hero-p-800.jpg 800w, /images/home-hero.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
  },
  {
    slug: 'nano-needling',
    title: 'Nano-needling',
    description: 'Cosmetic-depth (<0.3mm) treatment performed by a licensed esthetician.',
    durationMinutes: 60,
    priceCents: 25000,
    image: '/images/home-hero.jpg',
    imageSrcSet:
      '/images/home-hero-p-500.jpg 500w, /images/home-hero-p-800.jpg 800w, /images/home-hero.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
  },
  {
    slug: 'body-scrub-ritual',
    title: 'Body Scrub Ritual',
    description: 'Full-body exfoliation, warm towels, and a hydrating finish.',
    durationMinutes: 60,
    priceCents: 24500,
    image: '/images/home-hero.jpg',
    imageSrcSet:
      '/images/home-hero-p-500.jpg 500w, /images/home-hero-p-800.jpg 800w, /images/home-hero.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
  },
  {
    slug: 'back-facial',
    title: 'Back Facial',
    description: 'A focused treatment for the back.',
    durationMinutes: 45,
    priceCents: 11500,
    image: '/images/home-hero.jpg',
    imageSrcSet:
      '/images/home-hero-p-500.jpg 500w, /images/home-hero-p-800.jpg 800w, /images/home-hero.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
  },
  {
    slug: 'led-add-on',
    title: 'LED Therapy Add-on',
    description: 'Add 20 minutes of professional LED light therapy to any facial.',
    durationMinutes: 20,
    priceCents: 3500,
    image: '/images/home-hero.jpg',
    imageSrcSet:
      '/images/home-hero-p-500.jpg 500w, /images/home-hero-p-800.jpg 800w, /images/home-hero.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
  },
  // --- Legacy fixtures kept to preserve pre-existing tests ---
  {
    slug: 'so-africal-facial',
    title: 'So AfriCal Facial',
    description:
      'Includes a skin assessment and a consultation-guided facial customized to your needs. Combines traditional remedies with advanced technologies like LED and microdermabrasion, plus an at-home plan to maintain results.',
    durationMinutes: 60,
    priceCents: 40000,
    image: '/images/so-africal-facial.jpg',
    imageSrcSet:
      '/images/so-africal-facial-p-500.jpg 500w, /images/so-africal-facial-p-800.jpg 800w, /images/so-africal-facial.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
  },
  {
    slug: 'hydrafacial',
    title: 'HydraFacial',
    description:
      'Multi-step cleanse and gentle exfoliation, followed by extraction and hydration with targeted serums.',
    durationMinutes: 60,
    priceCents: 25000,
    image: '/images/kalahari-melon-hydration-facial.jpg',
    imageSrcSet:
      '/images/kalahari-melon-hydration-facial-p-500.jpg 500w, /images/kalahari-melon-hydration-facial-p-800.jpg 800w, /images/kalahari-melon-hydration-facial.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
  },
  {
    slug: 'microcurrent-facial',
    title: 'Microcurrent Facial',
    description:
      'A low-level current treatment designed to support a lifted, sculpted look with no downtime.',
    durationMinutes: 60,
    priceCents: 17500,
    image: '/images/rooibos-radiance-facial.jpg',
    imageSrcSet:
      '/images/rooibos-radiance-facial-p-500.jpg 500w, /images/rooibos-radiance-facial-p-800.jpg 800w, /images/rooibos-radiance-facial.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
  },
  {
    slug: 'dermaplaning-facial',
    title: 'Dermaplaning Facial',
    description:
      'Precise exfoliation that removes dead skin and peach fuzz for a smoother finish and brighter look.',
    durationMinutes: 50,
    priceCents: 17500,
    image: '/images/baobab-glow-facial.jpg',
    imageSrcSet:
      '/images/baobab-glow-facial-p-500.jpg 500w, /images/baobab-glow-facial-p-800.jpg 800w, /images/baobab-glow-facial.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
  },
  {
    slug: 'lash-extensions',
    title: 'Lash Extensions (Full Set)',
    description:
      'Semi-permanent extensions applied lash-by-lash for length, definition, and fullness.',
    durationMinutes: 150,
    priceCents: 18500,
    image: '/images/close-up-of-cosmetic-hair-x-webflow-template.jpg',
    imageSrcSet:
      '/images/close-up-of-cosmetic-hair-x-webflow-template-p-500.jpg 500w, /images/close-up-of-cosmetic-hair-x-webflow-template-p-800.jpg 800w, /images/close-up-of-cosmetic-hair-x-webflow-template.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
  },
  {
    slug: 'brow-lamination',
    title: 'Brow Lamination',
    description: 'A brow “set” that smooths and shapes hairs into a fuller, brushed-up look.',
    durationMinutes: 45,
    priceCents: 9000,
    image: '/images/brown-makeup-brush-hair-x-webflow-template.jpg',
    imageSrcSet:
      '/images/brown-makeup-brush-hair-x-webflow-template-p-500.jpg 500w, /images/brown-makeup-brush-hair-x-webflow-template-p-800.jpg 800w, /images/brown-makeup-brush-hair-x-webflow-template.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
  },
  {
    slug: 'full-body-wax',
    title: 'Full Body Wax',
    description: 'Smooth, longer-lasting hair removal across multiple areas in one appointment.',
    durationMinutes: 120,
    priceCents: 38000,
    image: '/images/beauty-and-wellness-hero-hair-x-webflow-template.jpg',
    imageSrcSet:
      '/images/beauty-and-wellness-hero-hair-x-webflow-template-p-500.jpg 500w, /images/beauty-and-wellness-hero-hair-x-webflow-template-p-800.jpg 800w, /images/beauty-and-wellness-hero-hair-x-webflow-template.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
  },
];

const defaultProducts = [
  {
    slug: 'b5-hydrating-serum',
    title: 'DermaQuest B5 Hydrating Serum',
    priceCents: 6800,
    image: '/images/dermaquest-b5-hydrating-serum.jpg',
    imageSrcSet:
      '/images/dermaquest-b5-hydrating-serum-p-500.jpg 500w, /images/dermaquest-b5-hydrating-serum-p-800.jpg 800w, /images/dermaquest-b5-hydrating-serum.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
  },
];

const defaultLocations = [
  {
    id: 'carlsbad-village',
    name: 'Carlsbad Village',
    timezone: 'America/Los_Angeles',
    address: {
      line1: '123 Main',
      city: 'Carlsbad',
      state: 'CA',
      postalCode: '92008',
      country: 'US',
    },
    mapUrl: 'https://maps.example.com',
    phoneDisplay: '(760) 555-1212',
    phoneE164: '+17605551212',
    email: 'hello@example.com',
    hoursByDay: {},
  },
];

export const server = setupServer(
  http.post('http://localhost:4500/v1/events', () =>
    HttpResponse.json({ accepted: 1, rejected: [] }, { status: 202 }),
  ),
  http.get('/v1/services', () => HttpResponse.json(defaultServices)),
  http.get('/v1/products', () => HttpResponse.json(defaultProducts)),
  http.get('/v1/locations', () => HttpResponse.json(defaultLocations)),
  http.get('/v1/locations/:locationId/services/:serviceSlug/availability', () =>
    HttpResponse.json({ timezone: 'America/Los_Angeles', slots: [] }),
  ),
  http.post('/v1/reservations', async ({ request }) => {
    const body = (await request.json()) as CreateReservationInput;
    return HttpResponse.json(
      {
        id: '00000000-0000-0000-0000-000000000001',
        locationId: body.locationId,
        serviceSlug: body.serviceSlug,
        guestName: body.name,
        guestEmail: body.email,
        guestPhoneE164: body.phone ?? null,
        startAt: body.startAt,
        timezone: body.timezone,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),
);

export { http, HttpResponse };
