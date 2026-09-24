import { saveCheckoutSuccessSnapshot } from '@hooks/checkoutSuccess';
import { RouterProvider } from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import type { DetailedCartItem } from '@utils/cart';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CartProvider } from '../../contexts/CartContext';
import { createTestRouter } from '../../router';

const orderStatusMock = vi.hoisted(() => ({
  data: undefined as unknown,
  isFetching: false,
  isError: false,
}));

vi.mock('@hooks/orders.api', () => ({
  useOrderStatusQuery: () => orderStatusMock,
}));

beforeEach(() => {
  window.sessionStorage.clear();
  vi.useRealTimers();
  orderStatusMock.data = undefined;
  orderStatusMock.isFetching = false;
  orderStatusMock.isError = false;
});

async function renderCheckoutSuccess(initialPath: string) {
  const router = createTestRouter([initialPath]);
  render(
    <CartProvider>
      <RouterProvider router={router} />
    </CartProvider>,
  );
  await act(async () => {
    await router.load();
  });
  return router;
}

describe('CheckoutSuccess page', () => {
  it('renders graceful error when orderId missing', async () => {
    vi.useFakeTimers();
    await renderCheckoutSuccess('/checkout/success');
    expect(screen.getByText(/we couldn’t find your order/i)).toBeInTheDocument();
  });

  it('renders cached snapshot data and keeps the snapshot for refreshes', async () => {
    const items: DetailedCartItem[] = [
      {
        slug: 'b5-hydrating-serum',
        qty: 1,
        product: {
          sku: 'MK-B5HS-30ML',
          slug: 'b5-hydrating-serum',
          title: 'DermaQuest B5 Hydrating Serum',
          priceCents: 6800,
          image: '/images/dermaquest-b5-hydrating-serum.jpg',
          href: '/shop/b5-hydrating-serum',
        },
        priceCents: 6800,
        lineTotal: 6800,
      },
    ];
    saveCheckoutSuccessSnapshot({
      orderId: 'order-123',
      subtotalCents: 6800,
      items,
    });

    await renderCheckoutSuccess('/checkout/success?orderId=order-123');

    // Order ref renders as a short uppercase reference (dashes stripped).
    expect(await screen.findByText(/order #order123/i)).toBeInTheDocument();
    const productTexts = await screen.findAllByText(/b5 hydrating serum/i);
    expect(productTexts.length).toBeGreaterThan(0);

    // The snapshot must SURVIVE the mount (until its 2h TTL) so a refresh on
    // the success page keeps the summary + the confirmation token.
    await waitFor(() =>
      expect(window.sessionStorage.getItem('checkout-success:v1:order-123')).not.toBeNull(),
    );
  });

  it('#37: declined_sold_out renders the never-charged message, names the item, and offers the waitlist', async () => {
    const items: DetailedCartItem[] = [
      {
        slug: 'b5-hydrating-serum',
        qty: 1,
        product: {
          sku: 'MK-B5HS-30ML',
          slug: 'b5-hydrating-serum',
          title: 'DermaQuest B5 Hydrating Serum',
          priceCents: 6800,
          image: '/images/dermaquest-b5-hydrating-serum.jpg',
          href: '/shop/b5-hydrating-serum',
        },
        priceCents: 6800,
        lineTotal: 6800,
      },
    ];
    saveCheckoutSuccessSnapshot({
      orderId: 'order-321',
      subtotalCents: 6800,
      items,
      confirmationToken: 'tok',
    });
    orderStatusMock.data = {
      id: 'order-321',
      email: null,
      status: 'declined_sold_out',
      subtotalCents: 6800,
      soldOutSkus: ['MK-B5HS-30ML'],
      items: [
        { sku: 'MK-B5HS-30ML', title: 'DermaQuest B5 Hydrating Serum', priceCents: 6800, qty: 1 },
      ],
    };

    await renderCheckoutSuccess('/checkout/success?orderId=order-321');

    // The operator's exact line, and the money fact.
    expect(
      await screen.findByText(/sorry, this sold out while you were checking out/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/your card was not charged/i).length).toBeGreaterThan(0);
    // The culprit is named, the waitlist is offered, the badge flips.
    expect(screen.getAllByText(/b5 hydrating serum/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Text')).toHaveAttribute('href', 'sms:+17602766583');
    expect(screen.getByText('Sold out')).toBeInTheDocument();
    // No receipt promise — nothing was charged.
    expect(screen.queryByText(/receipt is on its way/i)).not.toBeInTheDocument();
    expect(screen.getByText(/didn’t go through/i)).toBeInTheDocument();
  });
});
