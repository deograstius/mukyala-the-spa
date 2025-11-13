import ServicesGrid from '@features/services/ServicesGrid';
import { render, screen } from '@testing-library/react';
import type { ServiceItem } from '@types/service';
import { describe, it, expect } from 'vitest';

describe('ServicesGrid section', () => {
  it('renders heading and service links from props', () => {
    const mockServices: ServiceItem[] = [
      {
        slug: 'baobab-glow-facial',
        title: 'Baobab Glow Facial',
        image: '/images/baobab-glow-facial.jpg',
        href: '/services/baobab-glow-facial',
      },
      {
        slug: 'kalahari-melon-hydration-facial',
        title: 'Kalahari Melon Hydration Facial',
        image: '/images/kalahari-melon-hydration-facial.jpg',
        href: '/services/kalahari-melon-hydration-facial',
      },
    ];

    render(<ServicesGrid services={mockServices} />);

    expect(
      screen.getByRole('heading', { level: 2, name: /our set of beauty services/i }),
    ).toBeInTheDocument();

    mockServices.forEach(({ title, href }) => {
      const link = screen.getByRole('link', { name: new RegExp(title, 'i') });
      expect(link).toHaveAttribute('href', href);
    });
  });
});
