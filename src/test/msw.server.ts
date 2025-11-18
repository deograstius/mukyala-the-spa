import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { CreateReservationInput } from '../hooks/reservations.api';

// Simple defaults for pages tests; tests can override via server.use(...)
const defaultServices = [
  {
    slug: 'baobab-glow-facial',
    title: 'Baobab Glow Facial',
    description: 'Brightening antioxidant-forward facial.',
    durationMinutes: 60,
    priceCents: 9500,
    image: '/images/baobab-glow-facial.jpg',
    imageSrcSet:
      '/images/baobab-glow-facial-p-500.jpg 500w, /images/baobab-glow-facial-p-800.jpg 800w, /images/baobab-glow-facial.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
  },
];

const defaultProducts = [
  {
    slug: 'baobab-peptide-glow-drops',
    title: 'Baobab & Peptide Glow Drops · 30 ml',
    priceCents: 3200,
    image: '/images/baobab-peptide-glow-drops.jpg',
    imageSrcSet:
      '/images/baobab-peptide-glow-drops-p-500.jpg 500w, /images/baobab-peptide-glow-drops-p-800.jpg 800w, /images/baobab-peptide-glow-drops.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 33vw, 440px',
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
