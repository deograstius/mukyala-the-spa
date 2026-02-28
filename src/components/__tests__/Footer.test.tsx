import { render, screen } from '@testing-library/react';

import { primaryLocation } from '../../data/contact';
import TermsOfService from '../../pages/TermsOfService';
import Footer from '../Footer';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const supportAddressText = [
  primaryLocation.address.line1,
  primaryLocation.address.line2,
  `${primaryLocation.address.city}, ${primaryLocation.address.state} ${primaryLocation.address.postalCode}`,
]
  .filter(Boolean)
  .join(', ');

describe('Footer', () => {
  it('shows logo, support contact details, and policy links', () => {
    render(<Footer />);

    expect(screen.getByAltText(/mukyala day spa logo/i)).toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 2, name: /support contact/i })).toBeInTheDocument();

    const addressLink = screen.getByRole('link', {
      name: new RegExp(escapeRegExp(primaryLocation.address.line1), 'i'),
    });
    expect(addressLink).toHaveAttribute('href', primaryLocation.mapUrl);
    expect(addressLink).toHaveAttribute('data-cta-id', 'footer-address');
    expect(addressLink).toHaveClass('footer-contact-link');
    expect(addressLink).toHaveTextContent(supportAddressText);

    const phoneLink = screen.getByRole('link', { name: primaryLocation.phone.display });
    expect(phoneLink).toHaveAttribute('href', `tel:${primaryLocation.phone.tel}`);
    expect(phoneLink).toHaveAttribute('data-cta-id', 'footer-phone');
    expect(phoneLink).toHaveClass('footer-contact-link');

    const emailLink = screen.getByRole('link', { name: primaryLocation.email });
    expect(emailLink).toHaveAttribute('href', `mailto:${primaryLocation.email}`);
    expect(emailLink).toHaveAttribute('data-cta-id', 'footer-email');
    expect(emailLink).toHaveClass('footer-contact-link');
    expect(screen.getAllByText(primaryLocation.email)).toHaveLength(1);

    const peaceOfMindHeading = screen.getByRole('heading', { level: 2, name: /peace of mind/i });
    expect(peaceOfMindHeading.parentElement).toHaveTextContent(
      /support contact listed in this footer/i,
    );
    expect(peaceOfMindHeading.parentElement).not.toHaveTextContent(primaryLocation.email);

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
    expect(screen.getByRole('link', { name: /sms program disclosures/i })).toHaveAttribute(
      'href',
      '/sms-disclosures',
    );
    expect(screen.getByRole('link', { name: /sms program disclosures/i })).toHaveAttribute(
      'data-cta-id',
      'footer-sms-disclosures',
    );
    expect(screen.getByRole('link', { name: /manage notifications/i })).toHaveAttribute(
      'href',
      '/notifications/manage',
    );
  });

  it('formats support address cleanly when line2 is empty', () => {
    render(<Footer />);

    expect(primaryLocation.address.line2).toBeUndefined();

    const addressLink = screen.getByRole('link', {
      name: new RegExp(escapeRegExp(primaryLocation.address.line1), 'i'),
    });
    expect(addressLink).toHaveTextContent(supportAddressText);
    expect(addressLink).toHaveAttribute('href', expect.stringMatching(/^https?:\/\//));
    expect(addressLink.textContent).not.toMatch(/,\s*,/);
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
