import type { ServiceItem } from '@app-types/service';
import ServicesGrid from '@features/services/ServicesGrid';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('ServicesGrid section', () => {
  it('renders heading and service links from props', () => {
    const mockServices: ServiceItem[] = [
      {
        slug: 'so-africal-facial',
        title: 'So AfriCal Facial',
        image: '/images/so-africal-facial.jpg',
        href: '/services/so-africal-facial',
      },
    ];

    render(<ServicesGrid services={mockServices} />);

    expect(
      screen.getByRole('heading', { level: 2, name: /services, tailored with intention/i }),
    ).toBeInTheDocument();

    mockServices.forEach(({ title, href }) => {
      const link = screen.getByRole('link', { name: new RegExp(title, 'i') });
      expect(link).toHaveAttribute('href', href);
    });
  });
});
