import FeaturedProducts from '@features/home/FeaturedProducts';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('FeaturedProducts section', () => {
  it('renders heading, product cards, controls, and CTA', () => {
    // jsdom doesn't implement Element#scrollTo; stub it for the slider
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Element.prototype as any).scrollTo = () => {};

    const { container } = render(<FeaturedProducts />);

    // Heading
    expect(
      screen.getByRole('heading', { level: 2, name: /featured products/i }),
    ).toBeInTheDocument();

    // Carousel container has appropriate ARIA roledescription
    const slider = container.querySelector('[aria-roledescription="carousel"]');
    expect(slider).toBeTruthy();

    // Product links by title (names come from card titles)
    const titles = [
      /baobab & peptide glow drops/i,
      /kalahari hydration jelly pod duo/i,
      /rooibos radiance antioxidant mist/i,
      /shea gold overnight renewal balm/i,
    ];
    titles.forEach((t) => {
      expect(screen.getByRole('link', { name: t })).toBeInTheDocument();
    });

    // Controls exist and are clickable
    const prev = screen.getByRole('button', { name: /previous slide/i });
    const next = screen.getByRole('button', { name: /next slide/i });
    fireEvent.click(prev);
    fireEvent.click(next);

    // CTA link under the slider
    const cta = screen.getByRole('link', { name: /browse our shop/i });
    expect(cta).toHaveAttribute('href', '/shop');
    expect(within(cta).getByText(/browse our shop/i)).toBeInTheDocument();
  });
});
