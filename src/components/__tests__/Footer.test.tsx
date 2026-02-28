import { render, screen } from '@testing-library/react';

import Footer from '../Footer';

describe('Footer', () => {
  it('shows logo, address, and policy links', () => {
    render(<Footer />);

    expect(screen.getByAltText(/mukyala day spa logo/i)).toBeInTheDocument();

    expect(screen.getByText(/390 Oak Ave/i)).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /privacy policy/i })).toHaveAttribute(
      'href',
      '/privacy',
    );
    expect(screen.getByRole('link', { name: /terms of service/i })).toHaveAttribute(
      'href',
      '/terms',
    );
    expect(screen.getByRole('link', { name: /refunds\s*&\s*returns/i })).toHaveAttribute(
      'href',
      '/refunds',
    );
    expect(screen.getByRole('link', { name: /shipping\s*\/\s*fulfillment/i })).toHaveAttribute(
      'href',
      '/shipping',
    );
    expect(screen.getByRole('link', { name: /manage notifications/i })).toHaveAttribute(
      'href',
      '/notifications/manage',
    );
  });
});
