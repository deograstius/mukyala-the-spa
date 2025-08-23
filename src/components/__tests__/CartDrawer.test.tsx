import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { CartProvider } from '../../contexts/CartContext';
import Header from '../Header';

describe('CartDrawer', () => {
  it('opens from header and shows empty state', async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <Header />
      </CartProvider>,
    );

    const openBtn = screen.getByRole('button', { name: /open cart/i });
    await user.click(openBtn);

    // Empty state rendered
    expect(screen.getByText(/no items found/i)).toBeInTheDocument();
    // Checkout CTA present
    expect(screen.getByRole('link', { name: /get started/i })).toHaveAttribute('href', '/shop');
  });
});
