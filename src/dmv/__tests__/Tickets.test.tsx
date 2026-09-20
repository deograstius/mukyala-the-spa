import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { server, http, HttpResponse } from '../../test/msw.server';
import Tickets from '../pages/Tickets';

const catalog = [
  { sku: 'EVT-S1-GA', priceCents: 35000 },
  { sku: 'EVT-S1-VIP', priceCents: 40000 },
  { sku: 'EVT-S2-GA', priceCents: 35000 },
  { sku: 'EVT-S2-VIP', priceCents: 40000 },
];

function catalogHandlers(availableBySku: Record<string, number> = {}) {
  return [
    http.get('/v1/products', () => HttpResponse.json(catalog)),
    http.get('/inventory/v1/inventory/:sku', ({ params }) => {
      const sku = String(params.sku);
      return HttpResponse.json({ sku, available: availableBySku[sku] ?? 50 });
    }),
  ];
}

describe('dmv Tickets page', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/tickets?session=S1');
    window.sessionStorage.clear();
  });

  it('renders live prices and one name field per ticket', async () => {
    server.use(...catalogHandlers());
    render(<Tickets />);
    await waitFor(() => expect(screen.getAllByText('$350.00').length).toBeGreaterThan(0));
    // Default 1 GA ticket → exactly one name input, labeled "your name".
    expect(screen.getByLabelText(/Ticket 1 · your name/)).toBeInTheDocument();
  });

  it('blocks submit until every ticket has a name, an email, and the policy ack', async () => {
    server.use(...catalogHandlers());
    render(<Tickets />);
    await screen.findByLabelText(/Ticket 1 · your name/);
    await userEvent.click(screen.getByRole('button', { name: 'Continue to payment' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Add a name for every ticket.');
  });

  it('submits attendees + opt-in and redirects to the Stripe checkout URL', async () => {
    let orderBody: any = null;
    server.use(
      ...catalogHandlers(),
      http.post('/orders/v1/orders', async ({ request }) => {
        orderBody = await request.json();
        return HttpResponse.json(
          {
            id: 'order-1',
            status: 'pending',
            subtotalCents: 35000,
            confirmationToken: 'tok-1',
            confirmationExpiresAt: new Date(Date.now() + 3600_000).toISOString(),
          },
          { status: 201 },
        );
      }),
      http.post('/orders/v1/orders/order-1/checkout', () =>
        HttpResponse.json({ checkoutUrl: 'https://stripe.test/session' }),
      ),
    );

    // jsdom navigation: swap the whole location object to capture assign().
    const assigned: string[] = [];
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        search: originalLocation.search,
        assign: (url: string) => assigned.push(url),
      },
    });

    render(<Tickets />);
    await userEvent.type(await screen.findByLabelText(/Ticket 1 · your name/), 'Amina Kalisa');
    await userEvent.type(screen.getByLabelText('Email for your tickets'), 'amina@example.com');
    await userEvent.click(screen.getByLabelText(/Keep me posted on Mukyala/));
    await userEvent.click(screen.getByLabelText(/I understand all sales are final/));
    await userEvent.click(screen.getByRole('button', { name: 'Continue to payment' }));

    await waitFor(() => expect(assigned).toEqual(['https://stripe.test/session']));
    expect(orderBody).toMatchObject({
      email: 'amina@example.com',
      items: [{ sku: 'EVT-S1-GA', qty: 1 }],
      attendees: [{ sku: 'EVT-S1-GA', name: 'Amina Kalisa' }],
      marketingOptIn: true,
    });
    // The confirmation token is stashed for /thanks (Stripe returns with only the orderId).
    expect(window.sessionStorage.getItem('dmv-thanks:v1:order-1')).toContain('tok-1');

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('sold-out tier renders its sold-out state', async () => {
    server.use(...catalogHandlers({ 'EVT-S1-VIP': 0 }));
    render(<Tickets />);
    await waitFor(() => expect(screen.getByText('Sold out for this session')).toBeInTheDocument());
  });
});
