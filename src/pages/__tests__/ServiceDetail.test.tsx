import { RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { services } from '../../data/services';
import { createTestRouter } from '../../router';

describe('ServiceDetail', () => {
  it('renders service by slug from path', async () => {
    const first = services[0];
    const slug = first.href.split('/').pop()!;
    const testRouter = createTestRouter(['/']);

    render(<RouterProvider router={testRouter} />);
    await act(async () => {
      await testRouter.navigate({ to: `/services/${slug}` });
    });

    expect(screen.getByRole('heading', { name: first.title, level: 1 })).toBeInTheDocument();
    if (first.priceCents) {
      const { formatCurrency } = await import('../../utils/currency');
      expect(screen.getByText(formatCurrency(first.priceCents))).toBeInTheDocument();
    }
    if (first.duration) {
      expect(screen.getByText(new RegExp(first.duration))).toBeInTheDocument();
    }
    expect(screen.getByRole('link', { name: /make a reservation/i })).toHaveAttribute(
      'href',
      '/reservation',
    );
  });

  it('shows NotFound page for unknown slug', async () => {
    const testRouter = createTestRouter(['/']);
    render(<RouterProvider router={testRouter} />);
    await act(async () => {
      await testRouter.navigate({ to: '/services/unknown' });
    });
    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument();
  });
});
