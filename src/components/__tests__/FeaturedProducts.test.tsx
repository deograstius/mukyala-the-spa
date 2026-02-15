import type { Product } from '@app-types/product';
import FeaturedProducts from '@features/home/FeaturedProducts';
import { render, screen, within, fireEvent } from '@testing-library/react';
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
        slug: 'b5-hydrating-serum',
        title: 'DermaQuest B5 Hydrating Serum',
        priceCents: 6800,
        image: '/images/dermaquest-b5-hydrating-serum.jpg',
        href: '/shop/b5-hydrating-serum',
      },
      {
        slug: 'sheerzinc-spf-30',
        title: 'DermaQuest SheerZinc SPF 30',
        priceCents: 5800,
        image: '/images/dermaquest-sheerzinc-spf-30.jpg',
        href: '/shop/sheerzinc-spf-30',
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
