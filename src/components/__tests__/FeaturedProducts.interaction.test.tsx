import type { Product } from '@app-types/product';
import FeaturedProducts from '@features/home/FeaturedProducts';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
