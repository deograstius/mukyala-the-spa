import { saveCheckoutSuccessSnapshot } from '@hooks/checkoutSuccess';
import { RouterProvider } from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import type { DetailedCartItem } from '@utils/cart';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CartProvider } from '../../contexts/CartContext';
import { createTestRouter } from '../../router';

const mocks = vi.hoisted(() => ({
  cancelOrder: vi.fn(),
  createOrder: vi.fn(),
  createCheckout: vi.fn(),
  getOrder: vi.fn(),
}));

vi.mock('@hooks/orders.api', () => ({
  cancelOrder: mocks.cancelOrder,
  createOrder: mocks.createOrder,
  createCheckout: mocks.createCheckout,
  getOrder: mocks.getOrder,
  useOrderStatusQuery: () => ({
    data: undefined,
    isFetching: false,
    isError: false,
  }),
}));

beforeEach(() => {
  window.sessionStorage.clear();
  window.localStorage.clear();
  mocks.cancelOrder.mockReset();
  mocks.createOrder.mockReset();
  mocks.createCheckout.mockReset();
  mocks.getOrder.mockReset();
});

async function renderCheckoutCancel(initialPath: string) {
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

describe('CheckoutCancel page', () => {
  it('renders graceful message when orderId missing', async () => {
    await renderCheckoutCancel('/checkout/cancel');
    expect(
      screen.getByRole('heading', { level: 1, name: /checkout canceled/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/couldn’t find an order reference/i)).toBeInTheDocument();
  });

  it('calls cancel endpoint, restores cart, and clears snapshot', async () => {
    mocks.cancelOrder.mockResolvedValueOnce({ id: 'order-123', status: 'canceled' });

    const items: DetailedCartItem[] = [
      {
        slug: 'baobab-peptide-glow-drops',
        qty: 2,
        product: {
          sku: 'MK-BPGD',
          slug: 'baobab-peptide-glow-drops',
          title: 'Baobab & Peptide Glow Drops',
          priceCents: 3200,
          image: '/images/baobab-peptide-glow-drops.jpg',
          href: '/shop/baobab-peptide-glow-drops',
        },
        priceCents: 3200,
        lineTotal: 6400,
      },
    ];

    saveCheckoutSuccessSnapshot({
      orderId: 'order-123',
      email: 'guest@example.com',
      subtotalCents: 6400,
      items,
      confirmationToken: 'token-123',
      confirmationExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    });

    await renderCheckoutCancel('/checkout/cancel?orderId=order-123');

    await waitFor(() => expect(mocks.cancelOrder).toHaveBeenCalledWith('order-123'));

    await waitFor(() => {
      const raw = window.localStorage.getItem('cart:v1');
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw as string) as Record<string, { slug: string; qty: number }>;
      expect(parsed['baobab-peptide-glow-drops']?.qty).toBe(2);
    });

    await waitFor(() =>
      expect(window.sessionStorage.getItem('checkout-success:v1:order-123')).toBeNull(),
    );
  });
});
