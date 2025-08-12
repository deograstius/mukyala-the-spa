import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Inline from '../ui/Inline';
import Stack from '../ui/Stack';

describe('Stack and Inline', () => {
  it('Stack renders children and merges classes', () => {
    render(
      <Stack className="flex-vertical gap-16">
        <div>Child A</div>
      </Stack>,
    );
    expect(screen.getByText('Child A')).toBeInTheDocument();
  });

  it('Inline renders children and merges classes', () => {
    render(
      <Inline className="flex-horizontal gap-8">
        <span>Item</span>
      </Inline>,
    );
    expect(screen.getByText('Item')).toBeInTheDocument();
  });
});
