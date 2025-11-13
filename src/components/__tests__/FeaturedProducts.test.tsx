import FeaturedProducts from '@features/home/FeaturedProducts';
import { render, screen, within, fireEvent } from '@testing-library/react';
import type { Product } from '@types/product';
import { describe, it, expect } from 'vitest';

describe('FeaturedProducts section', () => {
  it('renders heading, product cards, controls, and CTA', () => {
    const elementProto = Element.prototype as Element & {
      scrollTo: (options?: ScrollToOptions | number, y?: number) => void;
    };
    const originalScrollTo = elementProto.scrollTo;
    elementProto.scrollTo = () => {};

    const mockProducts: Product[] = [
      {
        slug: 'baobab-peptide-glow-drops',
        title: 'Baobab & Peptide Glow Drops · 30 ml',
        priceCents: 3200,
        image: '/images/baobab-peptide-glow-drops.jpg',
        href: '/shop/baobab-peptide-glow-drops',
      },
      {
        slug: 'kalahari-hydration-jelly-pod-duo',
        title: 'Kalahari Hydration Jelly Pod Duo',
        priceCents: 1400,
        image: '/images/kalahari-hydration-jelly-pod-duo.jpg',
        href: '/shop/kalahari-hydration-jelly-pod-duo',
      },
    ];

    const { container } = render(<FeaturedProducts products={mockProducts} />);

    expect(
      screen.getByRole('heading', { level: 2, name: /featured products/i }),
    ).toBeInTheDocument();

    const slider = container.querySelector('[aria-roledescription="carousel"]');
    expect(slider).toBeTruthy();

    mockProducts.forEach((product) => {
      expect(screen.getByRole('link', { name: new RegExp(product.title, 'i') })).toHaveAttribute(
        'href',
        product.href,
      );
    });

    const prev = screen.getByRole('button', { name: /previous slide/i });
    const next = screen.getByRole('button', { name: /next slide/i });
    fireEvent.click(prev);
    fireEvent.click(next);

    const cta = screen.getByRole('link', { name: /browse our shop/i });
    expect(cta).toHaveAttribute('href', '/shop');
    expect(within(cta).getByText(/browse our shop/i)).toBeInTheDocument();
    elementProto.scrollTo = originalScrollTo;
  });
});
