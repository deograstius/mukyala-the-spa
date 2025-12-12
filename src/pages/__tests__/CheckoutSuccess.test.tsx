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
        slug: 'baobab-peptide-glow-drops',
        qty: 1,
        product: {
          sku: 'MK-BPGD',
          slug: 'baobab-peptide-glow-drops',
          title: 'Baobab & Peptide Glow Drops',
          priceCents: 3200,
          image: '/images/baobab-peptide-glow-drops.jpg',
          href: '/shop/baobab-peptide-glow-drops',
        },
        priceCents: 3200,
        lineTotal: 3200,
      },
    ];
    saveCheckoutSuccessSnapshot({
      orderId: 'order-123',
      email: 'guest@example.com',
      subtotalCents: 3200,
      items,
    });

    await renderCheckoutSuccess('/checkout/success?orderId=order-123');

    expect(await screen.findByText(/order #order-123/i)).toBeInTheDocument();
    expect(await screen.findByText(/guest@example.com/i)).toBeInTheDocument();
    const productTexts = await screen.findAllByText(/baobab & peptide glow drops/i);
    expect(productTexts.length).toBeGreaterThan(0);

    await waitFor(() =>
      expect(window.sessionStorage.getItem('checkout-success:v1:order-123')).toBeNull(),
    );
  });
});
