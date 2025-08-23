import LocationSpotlight from '@features/home/LocationSpotlight';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('LocationSpotlight section', () => {
  it('renders heading, address, phone, email, and image', () => {
    render(<LocationSpotlight />);

    expect(screen.getByRole('heading', { name: /our location/i })).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: /2951 state street, carlsbad, ca 92008, united states/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /\(760\) 870 1087/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /info@mukyala.com/i })).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /carlsbad spa location exterior/i }),
    ).toBeInTheDocument();
  });
});
