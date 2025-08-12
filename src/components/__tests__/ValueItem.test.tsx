import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ValueItem from '../ValueItem';

describe('ValueItem', () => {
  it('renders icon, title and children', () => {
    render(
      <ValueItem iconSrc="/images/pocket-watch-icon.png" title="Luxury and Timeless Experiences">
        <p className="paragraph-large">Every visit is more than a service.</p>
      </ValueItem>,
    );

    expect(
      screen.getByRole('img', { name: /luxury and timeless experiences/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /luxury and timeless experiences/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/every visit is more than a service/i)).toBeInTheDocument();
  });

  it('uses provided iconAlt when given', () => {
    render(
      <ValueItem iconSrc="/images/pocket-watch-icon.png" title="X" iconAlt="Pocket watch icon">
        <p>Text</p>
      </ValueItem>,
    );
    expect(screen.getByAltText(/pocket watch icon/i)).toBeInTheDocument();
  });
});
