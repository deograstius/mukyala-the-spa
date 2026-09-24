import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ValueItem from '../ValueItem';

describe('ValueItem', () => {
  it('renders icon, title and children', () => {
    render(
      <ValueItem iconSrc="/images/value-sparkle.png" title="Luxury, Done Properly">
        <p className="paragraph-large">Every visit is more than a service.</p>
      </ValueItem>,
    );

    expect(screen.getByRole('img', { name: /luxury, done properly/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /luxury, done properly/i })).toBeInTheDocument();
    expect(screen.getByText(/every visit is more than a service/i)).toBeInTheDocument();
  });

  it('uses provided iconAlt when given', () => {
    render(
      <ValueItem iconSrc="/images/value-sparkle.png" title="X" iconAlt="Sparkle icon">
        <p>Text</p>
      </ValueItem>,
    );
    expect(screen.getByAltText(/sparkle icon/i)).toBeInTheDocument();
  });
});
