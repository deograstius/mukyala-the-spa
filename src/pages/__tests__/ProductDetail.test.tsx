import { RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import { CartProvider } from '../../contexts/CartContext';
import { shopProducts } from '../../data/products';
import { createTestRouter } from '../../router';
import { formatCurrency } from '../../utils/currency';

describe('ProductDetail', () => {
  it('renders product by slug from path', async () => {
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

    expect(screen.getByRole('heading', { name: first.title, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(formatCurrency(first.priceCents))).toBeInTheDocument();
  });

  it('shows NotFound page for unknown slug', async () => {
    const testRouter = createTestRouter(['/']);
    render(
      <CartProvider>
        <RouterProvider router={testRouter} />
      </CartProvider>,
    );
    await act(async () => {
      await testRouter.navigate({ to: '/shop/unknown-product' });
    });
    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument();
  });

  it('adds to cart and updates header count', async () => {
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

    // Initial count 0
    const cartButton = screen.getByRole('button', { name: /open cart/i });
    let qtyEl = cartButton.querySelector('.cart-quantity');
    expect(qtyEl?.textContent).toBe('0');

    await user.click(screen.getByRole('button', { name: /add to cart/i }));

    qtyEl = cartButton.querySelector('.cart-quantity');
    expect(qtyEl?.textContent).toBe('1');
  });
});
