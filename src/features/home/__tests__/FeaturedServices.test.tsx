/**
 * FeaturedServices: two layouts chosen by menu size (operator decision
 * 2026-09-24). One service gets the focused two-column layout; two or more
 * keep the original three-up grid and header.
 */

import type { ServiceItem } from '@app-types/service';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import FeaturedServices from '../FeaturedServices';

function svc(slug: string, title: string): ServiceItem {
  return {
    slug,
    title,
    href: `/services/${slug}`,
    image: `/images/${slug}.jpg`,
    duration: '60 min',
    priceCents: 20000,
  };
}

describe('FeaturedServices layout by menu size', () => {
  it('one service: focused copy, the card, a Book button, and Browse services', () => {
    const { container } = render(
      <FeaturedServices services={[svc('signature-facial', 'Signature Facial')]} />,
    );

    expect(container.querySelector('.home-featured-service-solo')).not.toBeNull();
    expect(container.querySelector('.home-featured-services-grid')).toBeNull();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /^giving you the best facial\.$/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/^we are focused on one thing$/i)).toBeInTheDocument();
    expect(screen.queryByText(/services, tailored with intention/i)).toBeNull();

    const card = container.querySelector('[data-cta-id="home-featured-service-signature-facial"]');
    expect(card).not.toBeNull();
    expect(card!.getAttribute('href')).toBe('/services/signature-facial');
    expect(screen.getByRole('heading', { level: 3, name: 'Signature Facial' })).toBeInTheDocument();

    const book = screen.getByText('Book the Signature Facial').closest('a');
    expect(book!.getAttribute('href')).toBe('/reservation');

    const browse = screen.getByText('Browse services').closest('a');
    expect(browse!.getAttribute('href')).toBe('/services');

    expect(
      screen.getByText(/Signature Facial, 60 minutes with a licensed esthetician\./),
    ).toBeInTheDocument();
    expect(container.textContent).not.toContain(String.fromCharCode(0x2014));

    // Taller card: the 4:5 wrapper and the portrait cut of the clip.
    expect(
      container.querySelector('.home-featured-service-solo .image-wrapper.aspect-4-5'),
    ).not.toBeNull();
    const video = container.querySelector('video');
    expect(video?.getAttribute('src')).toBe('/videos/signature-facial-portrait.mp4');
  });

  it('two or more services: the original header and grid, at most three cards', () => {
    const { container } = render(
      <FeaturedServices
        services={[
          svc('a', 'Facial A'),
          svc('b', 'Facial B'),
          svc('c', 'Facial C'),
          svc('d', 'Facial D'),
        ]}
      />,
    );

    expect(container.querySelector('.home-featured-service-solo')).toBeNull();
    expect(container.querySelector('.home-featured-services-grid')).not.toBeNull();
    expect(
      screen.getByRole('heading', { level: 2, name: /services, tailored with intention/i }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll('[data-cta-id^="home-featured-service-"]')).toHaveLength(3);
    expect(screen.queryByText(/Book the/)).toBeNull();
    expect(screen.getAllByText('Browse services').length).toBeGreaterThan(0);
  });

  it('no services while loading: shows the loading status, not the solo layout', () => {
    render(<FeaturedServices services={[]} isLoading />);
    expect(screen.getByRole('status')).toHaveTextContent(/loading services/i);
  });
});
