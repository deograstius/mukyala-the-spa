import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import MobileNav from '../MobileNav';

describe('MobileNav', () => {
  it('focuses first actionable element on open', () => {
    render(
      <MobileNav open onClose={() => {}}>
        <a href="#">First Link</a>
        <button type="button">Other</button>
      </MobileNav>,
    );

    const first = screen.getByRole('link', { name: /first link/i });
    expect(document.activeElement).toBe(first);
  });

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn();
    render(
      <MobileNav open onClose={onClose}>
        <a href="#">First</a>
      </MobileNav>,
    );
    fireEvent.keyUp(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when clicking overlay background', () => {
    const onClose = vi.fn();
    render(
      <MobileNav open onClose={onClose}>
        <a href="#">First</a>
      </MobileNav>,
    );
    const overlay = screen.getByRole('dialog');
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it('traps focus within the panel when tabbing', async () => {
    const user = userEvent.setup();
    render(
      <MobileNav open onClose={() => {}}>
        <a href="#">First Link</a>
        <button type="button">Second Button</button>
      </MobileNav>,
    );

    const first = screen.getByRole('link', { name: /first link/i });
    const second = screen.getByRole('button', { name: /second button/i });
    expect(document.activeElement).toBe(first);

    await user.tab();
    expect(document.activeElement).toBe(second);

    await user.tab();
    expect(document.activeElement).toBe(first);

    await user.tab({ shift: true });
    expect(document.activeElement).toBe(second);
  });
});
