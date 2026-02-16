import { saveCheckoutSuccessSnapshot } from '@hooks/checkoutSuccess';
import { RouterProvider } from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import type { DetailedCartItem } from '@utils/cart';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CartProvider } from '../../contexts/CartContext';
import { createTestRouter } from '../../router';

vi.mock('@hooks/orders.api', () => ({
  useOrderStatusQuery: () => ({
    data: undefined,
    isFetching: false,
    isError: false,
  }),
}));

beforeEach(() => {
  window.sessionStorage.clear();
  vi.useRealTimers();
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

  it('renders cached snapshot data and clears storage after mount', async () => {
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

    expect(await screen.findByText(/order #order-123/i)).toBeInTheDocument();
    const productTexts = await screen.findAllByText(/b5 hydrating serum/i);
    expect(productTexts.length).toBeGreaterThan(0);

    await waitFor(() =>
      expect(window.sessionStorage.getItem('checkout-success:v1:order-123')).toBeNull(),
    );
  });
});
