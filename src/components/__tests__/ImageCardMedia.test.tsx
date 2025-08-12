import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ImageCardMedia from '../cards/ImageCardMedia';

describe('ImageCardMedia', () => {
  it('renders img with alt and optional overlay', () => {
    render(
      <ImageCardMedia
        src="/images/example.jpg"
        alt="Example"
        wrapperClassName="image-wrapper"
        imageClassName="card-image _w-h-100"
        overlayClassName="bg-image-overlay"
      />,
    );
    expect(screen.getByRole('img', { name: /example/i })).toBeInTheDocument();
  });
});
