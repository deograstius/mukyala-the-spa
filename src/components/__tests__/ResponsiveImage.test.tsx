import ResponsiveImage from '@shared/ui/ResponsiveImage';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('ResponsiveImage', () => {
  it('applies default loading and decoding attributes', () => {
    const { getByAltText } = render(
      <ResponsiveImage alt="Sample" src="/images/mukyala_logo.png" />,
    );
    const img = getByAltText('Sample');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('decoding', 'async');
  });

  it('allows overriding defaults via props', () => {
    const { getByAltText } = render(
      <ResponsiveImage
        alt="Eager"
        src="/images/mukyala_logo.png"
        loading="eager"
        decoding="sync"
      />,
    );
    const img = getByAltText('Eager');
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('decoding', 'sync');
  });
});
