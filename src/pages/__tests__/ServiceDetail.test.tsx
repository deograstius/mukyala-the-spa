import { RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
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
    // The footer also links "Book a reservation" now, so target the detail
    // page's CTA by its cta-id.
    const bookCta = document.querySelector('[data-cta-id="service-detail-book-reservation"]');
    expect(bookCta).toBeTruthy();
    expect(bookCta).toHaveAttribute('href', '/reservation');
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
