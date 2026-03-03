import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SmsDisclosureInline from '../SmsDisclosureInline';

describe('SmsDisclosureInline', () => {
  it('renders key disclosure phrases and links to sms disclosures', () => {
    render(<SmsDisclosureInline />);

    expect(screen.getByText(/by joining the waitlist via sms/i)).toBeInTheDocument();
    expect(screen.getByText(/recurring marketing texts/i)).toBeInTheDocument();
    expect(screen.getByText(/consent is not a condition of purchase/i)).toBeInTheDocument();
    expect(screen.getByText(/by joining the waitlist via sms/i).closest('p')).toHaveClass(
      'paragraph-small',
    );

    const disclosuresLink = screen.getByRole('link', { name: /sms program disclosures/i });
    expect(disclosuresLink).toHaveAttribute('href', '/sms-disclosures');
    expect(disclosuresLink).not.toHaveClass('link');
    expect(disclosuresLink).toHaveStyle({ display: 'inline' });
  });

  it('renders full variant disclosures and links', () => {
    render(<SmsDisclosureInline variant="full" />);

    expect(screen.getByText(/message frequency varies/i)).toBeInTheDocument();
    expect(screen.getByText(/message and data rates may apply/i)).toBeInTheDocument();
    expect(screen.getByText(/reply stop to opt out and help for help/i)).toBeInTheDocument();
    expect(
      screen.getByText(/carriers are not liable for delayed or undelivered messages/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sms program disclosures/i })).toHaveAttribute(
      'href',
      '/sms-disclosures',
    );
    expect(screen.getByRole('link', { name: /terms of service/i })).toHaveAttribute(
      'href',
      '/terms',
    );
    expect(screen.getByRole('link', { name: /privacy policy/i })).toHaveAttribute(
      'href',
      '/privacy',
    );
  });
});
