import { RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { describe, it, expect } from 'vitest';
import { CartProvider } from '../../contexts/CartContext';
import { createTestRouter } from '../../router';

describe('CartDrawer', () => {
  it('opens from header and shows empty state', async () => {
    const user = userEvent.setup();
    const testRouter = createTestRouter(['/about']);
    render(
      <CartProvider>
        <RouterProvider router={testRouter} />
      </CartProvider>,
    );
    await act(async () => {
      await testRouter.navigate({ to: '/about' });
    });

    const openBtn = screen.getByRole('button', { name: /open cart/i });
    await user.click(openBtn);

    // Empty state rendered
    expect(screen.getByText(/no items found/i)).toBeInTheDocument();
    // Checkout CTA present
    expect(screen.getByRole('link', { name: /get started/i })).toHaveAttribute('href', '/shop');
  });
});
