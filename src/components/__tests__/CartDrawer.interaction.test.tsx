import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { CartProvider } from '../../contexts/CartContext';
import { shopProducts } from '../../data/products';
import ProductDetail from '../../pages/ProductDetail';
import Header from '../Header';

function setPath(path: string) {
  window.history.pushState({}, '', path);
}

describe('CartDrawer interactions', () => {
  it('quantity controls update subtotal', async () => {
    const user = userEvent.setup();
    const first = shopProducts[0];
    const slug = first.href.split('/').pop()!;
    setPath(`/shop/${slug}`);

    render(
      <CartProvider>
        <Header />
        <ProductDetail />
      </CartProvider>,
    );

    // Add one item to cart
    await user.click(screen.getByRole('button', { name: /add to cart/i }));

    // Open drawer from header
    await user.click(screen.getByRole('button', { name: /open cart/i }));

    // Subtotal should match unit price initially
    const subtotalEl = screen
      .getByText(/subtotal/i)
      .parentElement?.querySelector('.cart-subtotal-number');
    expect(subtotalEl?.textContent).toMatch(/\$\d/);

    const prevText = subtotalEl?.textContent;

    // Click + to increase quantity
    await user.click(screen.getByRole('button', { name: /increase quantity/i }));

    const nextText = screen
      .getByText(/subtotal/i)
      .parentElement?.querySelector('.cart-subtotal-number')?.textContent;
    expect(nextText).not.toBe(prevText);
  });

  it('closes with Escape and shows populated items before close', async () => {
    const user = userEvent.setup();
    const first = shopProducts[0];
    const slug = first.href.split('/').pop()!;
    setPath(`/shop/${slug}`);

    render(
      <CartProvider>
        <Header />
        <ProductDetail />
      </CartProvider>,
    );

    await user.click(screen.getByRole('button', { name: /add to cart/i }));
    await user.click(screen.getByRole('button', { name: /open cart/i }));

    // Populated list contains product link by title
    expect(screen.getByRole('link', { name: new RegExp(first.title, 'i') })).toBeInTheDocument();

    // Press Escape to close
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('heading', { name: /your cart/i })).not.toBeInTheDocument();
    // Focus returned to the opener button
    expect(screen.getByRole('button', { name: /open cart/i })).toHaveFocus();
  });

  it('remove item clears row and updates count/subtotal', async () => {
    const user = userEvent.setup();
    const first = shopProducts[0];
    const slug = first.href.split('/').pop()!;
    setPath(`/shop/${slug}`);

    render(
      <CartProvider>
        <Header />
        <ProductDetail />
      </CartProvider>,
    );

    // Add and open
    await user.click(screen.getByRole('button', { name: /add to cart/i }));
    await user.click(screen.getByRole('button', { name: /open cart/i }));

    // Remove
    await user.click(
      screen.getByRole('button', { name: new RegExp(`remove ${first.title}`, 'i') }),
    );

    // Empty state visible
    expect(screen.getByText(/no items found/i)).toBeInTheDocument();

    // Header count shows 0
    const cartButton = screen.getByRole('button', { name: /open cart/i });
    const qtyEl = cartButton.querySelector('.cart-quantity');
    expect(qtyEl?.textContent).toBe('0');
  });

  it('checkout CTA has correct href', async () => {
    const user = userEvent.setup();
    const first = shopProducts[0];
    const slug = first.href.split('/').pop()!;
    setPath(`/shop/${slug}`);

    render(
      <CartProvider>
        <Header />
        <ProductDetail />
      </CartProvider>,
    );

    await user.click(screen.getByRole('button', { name: /add to cart/i }));
    await user.click(screen.getByRole('button', { name: /open cart/i }));

    const cta = screen.getByRole('link', { name: /continue to checkout/i });
    expect(cta).toHaveAttribute('href', '/checkout');
  });
});
