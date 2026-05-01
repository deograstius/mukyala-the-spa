import { primaryLocation } from '@data/contact';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import BulletItem from '../BulletItem';

describe('BulletItem', () => {
  it('renders content inside a non-link container by default', () => {
    render(
      <BulletItem>
        <div className="paragraph-large">Mon to Fri: 10 am to 6 pm</div>
      </BulletItem>,
    );
    expect(screen.getByText(/mon to fri/i)).toBeInTheDocument();
    // Ensure it's not rendered as a link
    expect(screen.queryByRole('link', { name: /mon to fri/i })).toBeNull();
  });

  it('renders as a link when href provided', () => {
    const tel = primaryLocation.phone.tel;
    const display = primaryLocation.phone.display;
    render(
      <BulletItem href={`tel:${tel}`}>
        <div className="paragraph-large">{display}</div>
      </BulletItem>,
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', `tel:${tel}`);
    expect(link).toHaveTextContent(display);
  });
});
