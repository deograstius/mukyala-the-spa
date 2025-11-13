import FeaturedProducts from '@features/home/FeaturedProducts';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Product } from '@types/product';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('FeaturedProducts interactions', () => {
  const htmlProto = window.HTMLElement.prototype as HTMLElement & {
    scrollTo: (options?: ScrollToOptions | number, y?: number) => void;
  };
  const originalScrollTo = htmlProto.scrollTo;

  beforeEach(() => {
    htmlProto.scrollTo = vi.fn();
  });

  it('invokes scrollTo on next/prev clicks', async () => {
    const user = userEvent.setup();
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
    render(<FeaturedProducts products={mockProducts} />);

    const next = screen.getByRole('button', { name: /next slide/i });
    const prev = screen.getByRole('button', { name: /previous slide/i });

    await user.click(next);
    expect(window.HTMLElement.prototype.scrollTo).toHaveBeenCalled();

    await user.click(prev);
    expect(window.HTMLElement.prototype.scrollTo).toHaveBeenCalled();
  });

  afterEach(() => {
    htmlProto.scrollTo = originalScrollTo;
  });
});
