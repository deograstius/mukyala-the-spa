import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CartProvider } from '../../contexts/CartContext';
import Checkout from '../Checkout';

describe('Checkout page', () => {
  it('renders heading and empty state', () => {
    render(
      <CartProvider>
        <Checkout />
      </CartProvider>,
    );
    expect(screen.getByRole('heading', { level: 1, name: /checkout/i })).toBeInTheDocument();
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });
});
