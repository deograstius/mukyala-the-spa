import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ButtonLink from '../ui/ButtonLink';

describe('ButtonLink', () => {
  it('renders an anchor with href and children', () => {
    render(<ButtonLink href="/reservation">Reserve</ButtonLink>);
    const link = screen.getByRole('link', { name: /reserve/i });
    expect(link).toHaveAttribute('href', '/reservation');
  });

  it('applies primary variant by default', () => {
    render(<ButtonLink href="/reservation">Go</ButtonLink>);
    const link = screen.getByRole('link', { name: /go/i });
    expect(link.className).toMatch(/button-primary/);
    expect(link.className).toMatch(/w-inline-block/);
    expect(link.className).not.toMatch(/large/);
  });

  it('supports white variant and large size', () => {
    render(
      <ButtonLink href="/about" variant="white" size="large">
        About
      </ButtonLink>,
    );
    const link = screen.getByRole('link', { name: /about/i });
    expect(link.className).toMatch(/button-primary/);
    expect(link.className).toMatch(/white/);
    expect(link.className).toMatch(/large/);
  });

  it('supports link variant', () => {
    render(
      <ButtonLink href="/services" variant="link">
        Services
      </ButtonLink>,
    );
    const link = screen.getByRole('link', { name: /services/i });
    expect(link.className).toMatch(/link/);
    expect(link.className).not.toMatch(/button-primary/);
  });
});
