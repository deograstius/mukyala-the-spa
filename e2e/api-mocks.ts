import type { Page, Route } from '@playwright/test';

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

export async function mockApiRoutes(page: Page) {
  // Basic fixtures used by SPA pages/tests
  const services = [
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
      active: true,
    },
  ];

  const products = [
    {
      slug: 'baobab-peptide-glow-drops',
      title: 'Baobab & Peptide Glow Drops · 30 ml',
      priceCents: 3200,
      image: '/images/baobab-peptide-glow-drops.jpg',
      imageSrcSet:
        '/images/baobab-peptide-glow-drops-p-500.jpg 500w, /images/baobab-peptide-glow-drops-p-800.jpg 800w, /images/baobab-peptide-glow-drops.jpg 1024w',
      imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 33vw, 440px',
      active: true,
    },
  ];

  const locations = [
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

  await page.route('**/v1/services', (route) => json(route, services));
  await page.route('**/v1/products', (route) => json(route, products));
  await page.route('**/v1/locations', (route) => json(route, locations));
  await page.route('**/v1/locations/*/services/*/availability?*', (route) =>
    json(route, { slots: [] }),
  );
}
