import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ProductCard from '../cards/ProductCard';

describe('ProductCard', () => {
  it('renders title, price, and links to href', () => {
    render(
      <ProductCard
        title="Sample Product"
        price="$9.99"
        image="/images/baobab-peptide-glow-drops.jpg"
        imageSrcSet="/images/baobab-peptide-glow-drops-p-500.jpg 500w, /images/baobab-peptide-glow-drops-p-800.jpg 800w, /images/baobab-peptide-glow-drops.jpg 1024w"
        href="/shop/sample"
      />,
    );

    const link = screen.getByRole('link', { name: /sample product/i });
    expect(link).toHaveAttribute('href', '/shop/sample');
    expect(screen.getByText('$9.99')).toBeInTheDocument();
  });
});
