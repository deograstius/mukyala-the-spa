import Button from '@shared/ui/Button';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('Button', () => {
  it('renders children and applies default classes', () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole('button', { name: /click me/i });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toMatch(/button-primary/);
  });

  it('supports variant and size', () => {
    render(
      <Button variant="white" size="large">
        Reserve
      </Button>,
    );
    const btn = screen.getByRole('button', { name: /reserve/i });
    expect(btn.className).toMatch(/button-primary/);
    expect(btn.className).toMatch(/white/);
    expect(btn.className).toMatch(/large/);
  });
});
