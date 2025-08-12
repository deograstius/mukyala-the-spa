import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ServicesGrid from '../sections/ServicesGrid';

describe('ServicesGrid section', () => {
  it('renders heading and service links', () => {
    render(<ServicesGrid />);

    expect(
      screen.getByRole('heading', { level: 2, name: /our set of beauty services/i }),
    ).toBeInTheDocument();

    const services = [
      { title: /baobab glow facial/i, href: '/services/baobab-glow-facial' },
      {
        title: /kalahari melon hydration facial/i,
        href: '/services/kalahari-melon-hydration-facial',
      },
      { title: /rooibos radiance facial/i, href: '/services/rooibos-radiance-facial' },
      { title: /shea gold collagen lift/i, href: '/services/shea-gold-collagen-lift' },
    ];
    services.forEach(({ title, href }) => {
      const link = screen.getByRole('link', { name: title });
      expect(link).toHaveAttribute('href', href);
    });
  });
});
