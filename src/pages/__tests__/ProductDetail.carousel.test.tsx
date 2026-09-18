import { RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { CartProvider } from '../../contexts/CartContext';
import { createTestRouter } from '../../router';
import { server, http, HttpResponse } from '../../test/msw.server';

/** Detail-page image carousel (#33): 2+ images → carousel; 1 image → none. */

const multi = {
  slug: 'multi-shot',
  title: 'Multi Shot Mask',
  priceCents: 8000,
  image: 'https://assets.example/front.jpg',
  images: [
    { src: 'https://assets.example/front.jpg', srcSet: null, sizes: null },
    { src: 'https://assets.example/back.jpg' },
    { src: 'https://assets.example/kit.jpg' },
  ],
  active: true,
  description: null,
  category: null,
};

const single = {
  slug: 'single-shot',
  title: 'Single Shot Balm',
  priceCents: 1200,
  image: 'https://assets.example/only.jpg',
  images: [{ src: 'https://assets.example/only.jpg', srcSet: null, sizes: null }],
  active: true,
  description: null,
  category: null,
};

// jsdom has no Element.scrollTo — same stub the featured-carousel tests use.
const htmlProto = window.HTMLElement.prototype as unknown as { scrollTo: unknown };
const originalScrollTo = htmlProto.scrollTo;
beforeAll(() => {
  htmlProto.scrollTo = vi.fn();
});
afterAll(() => {
  htmlProto.scrollTo = originalScrollTo;
});

async function renderDetail(slug: string) {
  server.use(http.get('/v1/products', () => HttpResponse.json([multi, single])));
  const testRouter = createTestRouter(['/']);
  render(
    <CartProvider>
      <RouterProvider router={testRouter} />
    </CartProvider>,
  );
  await act(async () => {
    await testRouter.navigate({ to: `/shop/${slug}` });
  });
}

describe('ProductDetail image carousel (#33)', () => {
  it('renders every image as a slide with dots when a product has 2+', async () => {
    await renderDetail('multi-shot');

    expect(screen.getByRole('region', { name: 'Multi Shot Mask photos' })).toBeInTheDocument();
    expect(screen.getByAltText('Multi Shot Mask — photo 1 of 3')).toBeInTheDocument();
    expect(screen.getByAltText('Multi Shot Mask — photo 2 of 3')).toBeInTheDocument();
    expect(screen.getByAltText('Multi Shot Mask — photo 3 of 3')).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
  });

  it('advances the current dot on Next and invokes the smooth scroll', async () => {
    await renderDetail('multi-shot');

    const dots = screen.getAllByRole('tab');
    expect(dots[0]).toHaveAttribute('aria-current', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Next photo' }));
    expect(screen.getAllByRole('tab')[1]).toHaveAttribute('aria-current', 'true');
    expect(htmlProto.scrollTo).toHaveBeenCalled();
  });

  it('renders a single-image product exactly as before — no carousel chrome', async () => {
    await renderDetail('single-shot');

    expect(screen.getByAltText('Single Shot Balm')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /photos/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next photo' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });
});
