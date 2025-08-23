import FeaturedProducts from '@features/home/FeaturedProducts';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('FeaturedProducts interactions', () => {
  const originalScrollTo = window.HTMLElement.prototype.scrollTo;

  beforeEach(() => {
    // @ts-expect-error allow spy override in JSDOM
    window.HTMLElement.prototype.scrollTo = vi.fn();
  });

  it('invokes scrollTo on next/prev clicks', async () => {
    const user = userEvent.setup();
    render(<FeaturedProducts />);

    const next = screen.getByRole('button', { name: /next slide/i });
    const prev = screen.getByRole('button', { name: /previous slide/i });

    await user.click(next);
    expect(window.HTMLElement.prototype.scrollTo).toHaveBeenCalled();

    await user.click(prev);
    expect(window.HTMLElement.prototype.scrollTo).toHaveBeenCalled();
  });

  afterEach(() => {
    window.HTMLElement.prototype.scrollTo = originalScrollTo;
  });
});
