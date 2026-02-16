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
      active: true,
    },
  ];

  const products = [
    {
      slug: 'b5-hydrating-serum',
      title: 'DermaQuest B5 Hydrating Serum',
      priceCents: 6800,
      image: '/images/dermaquest-b5-hydrating-serum.jpg',
      imageSrcSet:
        '/images/dermaquest-b5-hydrating-serum-p-500.jpg 500w, /images/dermaquest-b5-hydrating-serum-p-800.jpg 800w, /images/dermaquest-b5-hydrating-serum.jpg 1024w',
      imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
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
    json(route, { timezone: 'America/Los_Angeles', slots: [] }),
  );

  let lastOrderId = 'test-order';
  let lastOrderItems: { sku: string; title: string; priceCents: number; qty: number }[] = [];
  let lastOrderSubtotal = 0;
  let lastOrderEmail: string | null = null;
  let lastConfirmationToken = '';
  await page.route('**/orders/v1/orders', async (route) => {
    const payload = route.request().postDataJSON?.() as
      | { email?: string; items: { sku: string; title: string; priceCents: number; qty: number }[] }
      | undefined;
    lastOrderSubtotal =
      payload?.items?.reduce((total, item) => total + item.priceCents * item.qty, 0) ?? 0;
    lastOrderId = `test-order-${Date.now()}`;
    lastOrderItems = payload?.items ?? [];
    lastOrderEmail = payload?.email ?? null;
    lastConfirmationToken = `mock-token-${lastOrderId}`;
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        id: lastOrderId,
        status: 'pending',
        subtotalCents: lastOrderSubtotal,
        confirmationToken: lastConfirmationToken,
        confirmationExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      }),
    });
  });
  await page.route('**/orders/v1/orders/*/checkout', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        checkoutUrl: `/checkout/success?orderId=${lastOrderId}`,
      }),
    });
  });
  await page.route('**/orders/v1/orders/*', async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    const url = new URL(route.request().url());
    const token = url.searchParams.get('token');
    if (!token || token !== lastConfirmationToken) {
      return json(route, { error: 'invalid_token' }, 403);
    }
    return json(route, {
      id: lastOrderId,
      email: lastOrderEmail,
      status: 'confirmed',
      subtotalCents: lastOrderSubtotal,
      items: lastOrderItems,
    });
  });
}

// Additional mocks for full reservation flow used by staging-api.spec
export async function mockReservationFlow(page: Page) {
  let lastReservationId = 'e2e-reservation-1';
  const token = 'test-token';

  // Availability returns a single slot at 18:00Z for the requested date
  await page.route('**/v1/locations/*/services/*/availability?*', async (route) => {
    const url = new URL(route.request().url());
    const date = url.searchParams.get('date') || '2030-01-01';
    const slot = `${date}T18:00:00.000Z`;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ timezone: 'America/Los_Angeles', slots: [slot] }),
    });
  });

  await page.route('**/v1/reservations', async (route) => {
    lastReservationId = 'e2e-' + Math.random().toString(36).slice(2, 8);
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ id: lastReservationId, status: 'pending' }),
    });
  });

  await page.route('**/v1/reservations/*/token', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ token }),
    });
  });

  await page.route('**/v1/reservations/*/confirm', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });

  await page.route('**/v1/reservations/*/cancel', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });
}
