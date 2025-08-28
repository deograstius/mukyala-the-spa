import MediaCard from '@shared/cards/MediaCard';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('MediaCard (service)', () => {
  it('renders title and links to href', () => {
    render(
      <MediaCard
        title="Kalahari Melon Hydration Facial"
        image="/images/kalahari-melon-hydration-facial.jpg"
        imageSrcSet="/images/kalahari-melon-hydration-facial-p-500.jpg 500w, /images/kalahari-melon-hydration-facial-p-800.jpg 800w, /images/kalahari-melon-hydration-facial.jpg 1024w"
        href="/services/kalahari-melon-hydration-facial"
        wrapperClassName="image-wrapper"
        imageClassName="card-image _w-h-100"
        overlayClassName="bg-image-overlay overlay-15"
        contentClassName="content-card-services"
        titleClassName="card-title display-7 text-neutral-100"
      />,
    );

    const link = screen.getByRole('link', { name: /kalahari melon hydration facial/i });
    expect(link).toHaveAttribute('href', '/services/kalahari-melon-hydration-facial');
    expect(screen.getByText('Kalahari Melon Hydration Facial')).toBeInTheDocument();
  });
});
