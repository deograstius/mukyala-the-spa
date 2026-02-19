import { RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { describe, it, expect } from 'vitest';
import { CartProvider } from '../../contexts/CartContext';
import { shopProducts } from '../../data/products';
import { createTestRouter } from '../../router';
import { server, http, HttpResponse } from '../../test/msw.server';

async function renderCheckout(opts?: {
  searchParams?: Record<string, string>;
  preserveCart?: boolean;
}) {
  if (!opts?.preserveCart) window.localStorage.removeItem('cart:v1');
  const router = createTestRouter(['/']);
  render(
    <CartProvider>
      <RouterProvider router={router} />
    </CartProvider>,
  );
  await act(async () => {
    await router.navigate({
      to: '/checkout',
      search: (opts?.searchParams as { missingOrder?: string }) ?? {},
    });
  });
  return router;
}

describe('Checkout page', () => {
  it('renders heading and empty state', async () => {
    await renderCheckout();
    expect(screen.getByRole('heading', { level: 1, name: /checkout/i })).toBeInTheDocument();
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });

  it('surfaces missing order alert when search param present', async () => {
    await renderCheckout({ searchParams: { missingOrder: '1' } });
    expect(screen.getByText(/we couldn’t find the last order attempt/i)).toBeInTheDocument();
  });

  it('shows currently unavailable banner on hold_failed and removes unavailable items', async () => {
    const user = userEvent.setup();
    const product = shopProducts.find((p) => p.sku === 'MK-GRC-177ML') ?? shopProducts[1];
    const slug = product.href.split('/').pop()!;

    window.localStorage.setItem('cart:v1', JSON.stringify({ [slug]: { slug, qty: 1 } }));

    server.use(
      http.post('/orders/v1/orders', async ({ request }) => {
        const body = (await request.json()) as {
          items: Array<{ priceCents: number; qty: number }>;
        };
        const subtotalCents = (body.items ?? []).reduce(
          (sum, it) => sum + (it.priceCents ?? 0) * (it.qty ?? 0),
          0,
        );
        return HttpResponse.json(
          { id: 'order-1', status: 'pending', subtotalCents },
          { status: 201 },
        );
      }),
      http.post('/orders/v1/orders/:orderId/checkout', () =>
        HttpResponse.json({ error: 'hold_failed', sku: product.sku }, { status: 409 }),
      ),
    );

    await renderCheckout({ preserveCart: true });

    await user.click(screen.getByRole('button', { name: /proceed to checkout/i }));

    expect(await screen.findByText('Currently unavailable')).toBeInTheDocument();
    expect(
      screen.getByText(
        `${product.title} is currently unavailable. Remove it to continue checkout.`,
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /remove unavailable items/i }));

    expect(await screen.findByText(/your cart is empty/i)).toBeInTheDocument();
  });
});
