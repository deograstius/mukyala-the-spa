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
});
