import { RouterProvider } from '@tanstack/react-router';
import { render, screen, within } from '@testing-library/react';
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

  function useHoldFailedCheckout(sku: string) {
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
        HttpResponse.json({ error: 'hold_failed', sku }, { status: 409 }),
      ),
    );
  }

  it('shows sold out banner on hold_failed and Update cart removes the zero-stock item', async () => {
    const user = userEvent.setup();
    const product = shopProducts.find((p) => p.sku === 'MK-GRC-177ML') ?? shopProducts[1];
    const slug = product.href.split('/').pop()!;

    window.localStorage.setItem('cart:v1', JSON.stringify({ [slug]: { slug, qty: 1 } }));

    useHoldFailedCheckout(product.sku);
    server.use(
      http.get('/inventory/v1/inventory/:sku', ({ params }) =>
        HttpResponse.json({ sku: params.sku, available: 0 }),
      ),
    );

    await renderCheckout({ preserveCart: true });

    // Products load from /v1/products; the button appears once the cart hydrates.
    await user.click(await screen.findByRole('button', { name: /proceed to checkout/i }));

    expect(await screen.findByText('Sold out')).toBeInTheDocument();
    expect(
      screen.getByText(`“${product.title}” is sold out. Update your cart to continue checkout.`),
    ).toBeInTheDocument();
    expect(screen.getByText(/by joining the waitlist via sms/i)).toBeInTheDocument();
    expect(screen.getByText(/consent is not a condition of purchase/i)).toBeInTheDocument();
    const soldOutAlert = screen.getByRole('alert');
    const disclosuresLink = within(soldOutAlert).getByRole('link', {
      name: /sms program disclosures/i,
    });
    expect(disclosuresLink).toHaveAttribute('href', '/sms-disclosures');
    expect(disclosuresLink).toHaveAttribute('data-cta-id', 'checkout-waitlist-sms-disclosures');
    expect(disclosuresLink).not.toHaveClass('link');

    await user.click(screen.getByRole('button', { name: /update cart/i }));

    expect(await screen.findByText(/your cart is empty/i)).toBeInTheDocument();
  });

  it('#38: Update cart CLAMPS a partially-available line instead of removing it', async () => {
    const user = userEvent.setup();
    const product = shopProducts.find((p) => p.sku === 'MK-GRC-177ML') ?? shopProducts[1];
    const slug = product.href.split('/').pop()!;

    window.localStorage.setItem('cart:v1', JSON.stringify({ [slug]: { slug, qty: 2 } }));

    useHoldFailedCheckout(product.sku);
    server.use(
      http.get('/inventory/v1/inventory/:sku', ({ params }) =>
        HttpResponse.json({ sku: params.sku, available: 1 }),
      ),
    );

    await renderCheckout({ preserveCart: true });
    await user.click(await screen.findByRole('button', { name: /proceed to checkout/i }));

    // Multi-unit line: the banner hedges (it may be partial, not zero).
    expect(
      await screen.findByText(
        `There isn’t enough of “${product.title}” in stock. Update your cart to continue checkout.`,
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /update cart/i }));

    // The line survives at qty 1 — no re-adding — and the notice says exactly
    // what changed. The banner is gone.
    expect(
      await screen.findByText(`Only 1 of “${product.title}” was left — we kept 1 in your cart.`),
    ).toBeInTheDocument();
    expect(screen.getByText(/Qty 1 ·/)).toBeInTheDocument();
    expect(screen.getByText(product.title)).toBeInTheDocument();
    expect(screen.queryByText('Sold out')).not.toBeInTheDocument();
    expect(screen.queryByText(/your cart is empty/i)).not.toBeInTheDocument();
  });

  it('#38: falls back to removing the accused line when the inventory lookup is down', async () => {
    const user = userEvent.setup();
    const product = shopProducts.find((p) => p.sku === 'MK-GRC-177ML') ?? shopProducts[1];
    const slug = product.href.split('/').pop()!;

    window.localStorage.setItem('cart:v1', JSON.stringify({ [slug]: { slug, qty: 2 } }));

    useHoldFailedCheckout(product.sku);
    server.use(
      http.get('/inventory/v1/inventory/:sku', () =>
        HttpResponse.json({ error: 'down' }, { status: 500 }),
      ),
    );

    await renderCheckout({ preserveCart: true });
    await user.click(await screen.findByRole('button', { name: /proceed to checkout/i }));
    await user.click(await screen.findByRole('button', { name: /update cart/i }));

    // Can't clamp without a number — removing is the only unblock.
    expect(await screen.findByText(/your cart is empty/i)).toBeInTheDocument();
  });

  it('shows a "can’t reach the shop" error (not the empty state) when the catalog API is down', async () => {
    const product = shopProducts[0];
    const slug = product.href.split('/').pop()!;
    window.localStorage.setItem('cart:v1', JSON.stringify({ [slug]: { slug, qty: 1 } }));

    server.use(
      http.get('/v1/products', () => HttpResponse.json({ error: 'down' }, { status: 500 })),
    );

    await renderCheckout({ preserveCart: true });

    // retry:1 with default backoff means the error state can take a beat to land.
    expect(
      await screen.findByText(/can’t reach the shop right now/i, {}, { timeout: 6000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    // No stale fallback: the item list and the empty state must not render.
    expect(screen.queryByText(product.title)).not.toBeInTheDocument();
    expect(screen.queryByText(/your cart is empty/i)).not.toBeInTheDocument();
  }, 10000);

  it('renders an explicit "no longer available" row for cart slugs missing from the catalog', async () => {
    const user = userEvent.setup();
    const available = shopProducts[0];
    const availableSlug = available.href.split('/').pop()!;
    const goneSlug = 'discontinued-glow-oil';
    window.localStorage.setItem(
      'cart:v1',
      JSON.stringify({
        [availableSlug]: { slug: availableSlug, qty: 1 },
        [goneSlug]: { slug: goneSlug, qty: 2 },
      }),
    );

    await renderCheckout({ preserveCart: true });

    expect(
      await screen.findByText(/“discontinued glow oil” is no longer available\./i),
    ).toBeInTheDocument();
    // The available item still renders and the subtotal only counts it.
    expect(screen.getByText(available.title)).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /remove unavailable item discontinued glow oil/i }),
    );
    expect(screen.queryByText(/no longer available/i)).not.toBeInTheDocument();
    expect(screen.getByText(available.title)).toBeInTheDocument();
  });
});
