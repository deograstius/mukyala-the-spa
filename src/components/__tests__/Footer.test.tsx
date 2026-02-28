import { render, screen } from '@testing-library/react';

import TermsOfService from '../../pages/TermsOfService';
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
    expect(screen.getByRole('link', { name: /cancellations/i })).toHaveAttribute(
      'href',
      '/terms#cancellations',
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

  it('keeps footer cancellations deep-link aligned with the terms anchor section', () => {
    const { unmount } = render(<Footer />);

    const cancellationsLink = screen.getByRole('link', { name: /cancellations/i });
    expect(cancellationsLink).toHaveAttribute('href', '/terms#cancellations');
    expect(cancellationsLink).toHaveAttribute('data-cta-id', 'footer-cancellations');

    unmount();
    render(<TermsOfService />);

    const cancellationsHeading = screen.getByRole('heading', { level: 2, name: /cancellations/i });
    expect(cancellationsHeading).toHaveAttribute('id', 'cancellations');
  });
});
