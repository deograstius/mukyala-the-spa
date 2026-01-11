import MediaCard from '@shared/cards/MediaCard';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('MediaCard (service)', () => {
  it('renders title and links to href', () => {
    render(
      <MediaCard
        title="So AfriCal Facial"
        image="/images/so-africal-facial.jpg"
        imageSrcSet="/images/so-africal-facial-p-500.jpg 500w, /images/so-africal-facial-p-800.jpg 800w, /images/so-africal-facial.jpg 1024w"
        href="/services/so-africal-facial"
        wrapperClassName="image-wrapper"
        imageClassName="card-image _w-h-100"
        overlayClassName="bg-image-overlay overlay-15"
        contentClassName="content-card-services"
        titleClassName="card-title display-7 text-neutral-100"
      />,
    );

    const link = screen.getByRole('link', { name: /so afric(al|a)l facial/i });
    expect(link).toHaveAttribute('href', '/services/so-africal-facial');
    expect(screen.getByText('So AfriCal Facial')).toBeInTheDocument();
  });
});
