import { render, screen } from '@testing-library/react';
import Reveal, { RevealStagger } from '../Reveal';

function withMatchMedia(matches: boolean, run: () => void) {
  const original = window.matchMedia;
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    media: query,
    matches,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as any;
  try {
    run();
  } finally {
    window.matchMedia = original;
  }
}

describe('Reveal', () => {
  it('renders children when reduced motion is preferred', () => {
    withMatchMedia(true, () => {
      render(
        <Reveal>
          <div data-testid="child">Hello</div>
        </Reveal>,
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });

  it('renders children when animations are enabled', () => {
    withMatchMedia(false, () => {
      render(
        <Reveal>
          <div data-testid="child">Hello</div>
        </Reveal>,
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });
});

describe('RevealStagger', () => {
  it('renders each provided child', () => {
    withMatchMedia(false, () => {
      render(
        <RevealStagger>
          <div data-testid="a">A</div>
          <div data-testid="b">B</div>
        </RevealStagger>,
      );
      expect(screen.getByTestId('a')).toBeInTheDocument();
      expect(screen.getByTestId('b')).toBeInTheDocument();
    });
  });
});
