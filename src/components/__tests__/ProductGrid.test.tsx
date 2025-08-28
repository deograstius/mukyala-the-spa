import ProductGrid from '@features/shop/ProductGrid';
import { render, screen } from '@testing-library/react';

const mockProducts = [
  {
    title: 'Test Product A',
    priceCents: 1000,
    image: '/images/baobab-peptide-glow-drops.jpg',
    href: '/shop/test-a',
  },
  {
    title: 'Test Product B',
    priceCents: 1200,
    image: '/images/kalahari-hydration-jelly-pod-duo.jpg',
    href: '/shop/test-b',
  },
];

describe('ProductGrid', () => {
  it('renders a grid with product cards', () => {
    render(<ProductGrid products={mockProducts} />);

    // finds links by product titles
    mockProducts.forEach((p) => {
      const link = screen.getByRole('link', { name: new RegExp(p.title) });
      expect(link).toHaveAttribute('href', p.href);
    });

    // basic grid roles
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').length).toBe(mockProducts.length);
  });
});
