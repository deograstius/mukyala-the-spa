import { RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import { describe, it, expect, beforeEach } from 'vitest';
import { CartProvider } from '../../contexts/CartContext';
import { shopProducts } from '../../data/products';
import { createTestRouter } from '../../router';
import { server, http, HttpResponse } from '../../test/msw.server';

describe('CartDrawer interactions', () => {
  beforeEach(() => {
    window.localStorage.removeItem('cart:v1');
  });

  it('quantity controls update subtotal', async () => {
    const user = userEvent.setup();
    const first = shopProducts[0];
    const slug = first.href.split('/').pop()!;
    const testRouter = createTestRouter(['/']);

    render(
      <CartProvider>
        <RouterProvider router={testRouter} />
      </CartProvider>,
    );
    await act(async () => {
      await testRouter.navigate({ to: `/shop/${slug}` });
    });

    // Add one item to cart (opens modal automatically)
    await user.click(await screen.findByRole('button', { name: /add to cart/i }));

    // Subtotal should match unit price initially
    const subtotalEl = screen
      .getByText(/subtotal/i)
      .parentElement?.querySelector('.cart-subtotal-number');
    expect(subtotalEl?.textContent).toMatch(/\$\d/);

    const prevText = subtotalEl?.textContent;

    // Update quantity input
    const qtyInput = screen.getByRole('spinbutton', { name: /update quantity/i });
    await user.clear(qtyInput);
    await user.type(qtyInput, '2');

    const nextText = screen
      .getByText(/subtotal/i)
      .parentElement?.querySelector('.cart-subtotal-number')?.textContent;
    expect(nextText).not.toBe(prevText);
  });

  it('closes with Escape and shows populated items before close', async () => {
    const user = userEvent.setup();
    const first = shopProducts[0];
    const slug = first.href.split('/').pop()!;
    const testRouter = createTestRouter(['/']);

    render(
      <CartProvider>
        <RouterProvider router={testRouter} />
      </CartProvider>,
    );
    await act(async () => {
      await testRouter.navigate({ to: `/shop/${slug}` });
    });

    await screen.findByRole('heading', { level: 1, name: new RegExp(first.title, 'i') });

    await user.click(await screen.findByRole('button', { name: /add to cart/i }));

    // Populated list contains product link by title
    expect(screen.getByRole('link', { name: new RegExp(first.title, 'i') })).toBeInTheDocument();

    // Press Escape to close
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('heading', { name: /your cart/i })).not.toBeInTheDocument();
    // Focus returned to the opener button (Add to Cart)
    expect(screen.getByRole('button', { name: /add to cart/i })).toHaveFocus();
  });

  it('remove item clears row and updates count/subtotal', async () => {
    const user = userEvent.setup();
    const first = shopProducts[0];
    const slug = first.href.split('/').pop()!;
    const testRouter = createTestRouter(['/']);

    render(
      <CartProvider>
        <RouterProvider router={testRouter} />
      </CartProvider>,
    );
    await act(async () => {
      await testRouter.navigate({ to: `/shop/${slug}` });
    });

    // Add (opens modal)
    await user.click(await screen.findByRole('button', { name: /add to cart/i }));

    // Remove
    await user.click(
      screen.getByRole('button', { name: new RegExp(`remove ${first.title} from cart`, 'i') }),
    );

    // Empty state visible
    expect(screen.getByText(/no items found/i)).toBeInTheDocument();

    // Header count shows 0
    const cartButton = screen.getByRole('button', { name: /open cart/i });
    const qtyEl = cartButton.querySelector('.cart-quantity');
    expect(qtyEl?.textContent).toBe('0');
  });

  it('checkout CTA is rendered', async () => {
    const user = userEvent.setup();
    const first = shopProducts[0];
    const slug = first.href.split('/').pop()!;
    const testRouter = createTestRouter(['/']);

    render(
      <CartProvider>
        <RouterProvider router={testRouter} />
      </CartProvider>,
    );
    await act(async () => {
      await testRouter.navigate({ to: `/shop/${slug}` });
    });

    await user.click(screen.getByRole('button', { name: /add to cart/i }));

    const cta = screen.getByRole('button', { name: /continue to checkout/i });
    expect(cta).toBeEnabled();
  });

  it('shows sold out banner on hold_failed and removes sold out items', async () => {
    const user = userEvent.setup();
    // Use the default MSW /v1/products seed (b5-hydrating-serum) so the ProductDetail loader resolves.
    const product = shopProducts[0];
    const slug = product.href.split('/').pop()!;
    const testRouter = createTestRouter(['/']);

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

    render(
      <CartProvider>
        <RouterProvider router={testRouter} />
      </CartProvider>,
    );
    await act(async () => {
      await testRouter.navigate({ to: `/shop/${slug}` });
    });

    await user.click(await screen.findByRole('button', { name: /add to cart/i }));

    await user.click(screen.getByRole('button', { name: /continue to checkout/i }));

    expect(await screen.findByText('Sold out')).toBeInTheDocument();
    expect(
      screen.getByText(`${product.title} is sold out. Remove it to continue checkout.`),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /remove sold out items/i }));

    expect(await screen.findByText(/no items found/i)).toBeInTheDocument();
  });
});
