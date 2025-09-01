import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import DiagonalIconButton from '../DiagonalIconButton';

function Wrapper({ children }: { children: React.ReactNode }) {
  // Simulate the card wrapper that should trigger hover
  return <div className="beauty-services-link-item">{children}</div>;
}

describe('DiagonalIconButton (single icon timeline)', () => {
  beforeEach(() => {
    // Reset matchMedia between tests
    (window as unknown as { matchMedia?: unknown }).matchMedia = undefined;
  });

  it('renders exactly one icon element with the expected glyph', () => {
    render(
      <Wrapper>
        <DiagonalIconButton />
      </Wrapper>,
    );

    const icons = document.querySelectorAll('.diagonal-button-icon');
    expect(icons.length).toBe(1);

    // The glyph is rendered inside a span within the icon container
    // It should contain the expected character (Icon Rounded font)
    // We assert non-empty content rather than the exact private-use glyph,
    // which can vary by font mapping, but in our component it's \uE810.
    const span = icons[0].querySelector('span');
    expect(span).toBeTruthy();
    expect(span!.textContent).toBe('\uE810');
  });

  it('updates background and icon color on hover and reverses on unhover', async () => {
    render(
      <Wrapper>
        <DiagonalIconButton />
      </Wrapper>,
    );

    const button = document.querySelector('.secondary-button-icon') as HTMLElement;
    const iconSpan = document.querySelector('.diagonal-button-icon span') as HTMLElement;
    expect(button).toBeTruthy();
    expect(iconSpan).toBeTruthy();

    // Initial state
    expect(button.style.backgroundColor).toBe('');
    // Component sets initial icon color to white token
    expect(iconSpan.style.color).toBe('var(--core--colors--neutral--100)');

    // Hover in
    const trigger = document.querySelector('.beauty-services-link-item') as HTMLElement;
    fireEvent.mouseEnter(trigger);

    // After animation completes, background should be set via inline CSS variable
    await new Promise((r) => setTimeout(r, 380));
    expect(button.style.backgroundColor).toBe('var(--core--colors--neutral--100)');

    // Hover out
    fireEvent.mouseLeave(trigger);
    await new Promise((r) => setTimeout(r, 380));
    expect(
      button.style.backgroundColor === '' || button.style.backgroundColor === 'rgba(0, 0, 0, 0)',
    ).toBeTruthy();
  });

  it('respects prefers-reduced-motion: no movement but styles still update', async () => {
    // Stub matchMedia to indicate reduced motion preference
    (window as unknown as { matchMedia?: (q: string) => MediaQueryList }).matchMedia = vi
      .fn()
      .mockImplementation(
        (q: string) =>
          ({
            matches: q.includes('prefers-reduced-motion'),
            media: q,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
          }) as unknown as MediaQueryList,
      );

    render(
      <Wrapper>
        <DiagonalIconButton />
      </Wrapper>,
    );

    const button = document.querySelector('.secondary-button-icon') as HTMLElement;
    const icon = document.querySelector('.diagonal-button-icon') as HTMLElement;
    const iconSpan = icon.querySelector('span') as HTMLElement;

    const trigger = document.querySelector('.beauty-services-link-item') as HTMLElement;
    fireEvent.mouseEnter(trigger);
    await new Promise((r) => setTimeout(r, 40));

    // Background and color should update immediately
    expect(button.style.backgroundColor).toBe('var(--core--colors--neutral--100)');
    expect(iconSpan.style.color).toBe('var(--core--colors--neutral--800)');

    // No transform should be applied when reduced motion is on
    // (Framer Motion would otherwise set translateX/translateY)
    expect(icon.getAttribute('style') || '').not.toMatch(/translate/);
  });
});
