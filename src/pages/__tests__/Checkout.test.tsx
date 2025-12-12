import { RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { describe, it, expect } from 'vitest';
import { CartProvider } from '../../contexts/CartContext';
import { createTestRouter } from '../../router';

async function renderCheckout(searchParams?: Record<string, string>) {
  const router = createTestRouter(['/']);
  render(
    <CartProvider>
      <RouterProvider router={router} />
    </CartProvider>,
  );
  await act(async () => {
    await router.navigate({
      to: '/checkout',
      search: (searchParams as { missingOrder?: string }) ?? {},
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
    await renderCheckout({ missingOrder: '1' });
    expect(screen.getByText(/we couldn’t find the last order attempt/i)).toBeInTheDocument();
  });
});
