import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import About from '../About';

describe('About page', () => {
  it('renders hero image, headings, and values', () => {
    render(<About />);

    // Hero image alt
    expect(screen.getByRole('img', { name: /mukyala day spa/i })).toBeInTheDocument();

    // Main headings
    expect(screen.getByRole('heading', { level: 2, name: /our story/i })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /the work values we thrive for/i }),
    ).toBeInTheDocument();

    // Value items headings
    const values = [
      /old school customer service/i,
      /luxury and timeless experiences/i,
      /technology that enhances, not hurries/i,
    ];
    values.forEach((v) => {
      expect(screen.getByRole('heading', { name: v })).toBeInTheDocument();
    });
  });
});
