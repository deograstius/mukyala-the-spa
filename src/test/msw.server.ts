import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { CreateReservationInput } from '../hooks/reservations.api';

// Simple defaults for pages tests; tests can override via server.use(...)
const defaultServices = [
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
