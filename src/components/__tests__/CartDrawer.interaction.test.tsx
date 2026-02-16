import { RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import { describe, it, expect } from 'vitest';
import { CartProvider } from '../../contexts/CartContext';
import { shopProducts } from '../../data/products';
import { createTestRouter } from '../../router';

describe('CartDrawer interactions', () => {
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
    await user.click(screen.getByRole('button', { name: /add to cart/i }));

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

    await user.click(screen.getByRole('button', { name: /add to cart/i }));

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
    await user.click(screen.getByRole('button', { name: /add to cart/i }));

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
});
