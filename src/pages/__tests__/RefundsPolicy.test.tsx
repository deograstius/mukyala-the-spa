import { RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, it } from 'vitest';
import { createTestRouter } from '../../router';

describe('RefundsPolicy page', () => {
  it('renders at /refunds', async () => {
    const router = createTestRouter(['/refunds']);
    render(<RouterProvider router={router} />);
    await act(async () => {
      await router.load();
    });

    expect(
      screen.getByRole('heading', { level: 1, name: /refunds\s*&\s*returns/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/last updated:\s*2026-02-28/i)).toBeInTheDocument();
  });
});
