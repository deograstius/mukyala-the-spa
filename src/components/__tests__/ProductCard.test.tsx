import MediaCard from '@shared/cards/MediaCard';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('MediaCard (product)', () => {
  it('renders title, price, and links to href', () => {
    render(
      <MediaCard
        title="Sample Product"
        price="$9.99"
        image="/images/baobab-peptide-glow-drops.jpg"
        imageSrcSet="/images/baobab-peptide-glow-drops-p-500.jpg 500w, /images/baobab-peptide-glow-drops-p-800.jpg 800w, /images/baobab-peptide-glow-drops.jpg 1024w"
        href="/shop/sample"
        wrapperClassName="image-wrapper border-radius-16px z-index-1"
        imageClassName="card-image _w-h-100"
        overlayClassName="bg-image-overlay z-index-1"
        contentClassName="content-inside-image-bottom"
        titleClassName="card-white-title display-7 text-neutral-100"
      />,
    );

    const link = screen.getByRole('link', { name: /sample product/i });
    expect(link).toHaveAttribute('href', '/shop/sample');
    expect(screen.getByText('$9.99')).toBeInTheDocument();
  });
});
