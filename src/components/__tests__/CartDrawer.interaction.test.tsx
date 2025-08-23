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
});
