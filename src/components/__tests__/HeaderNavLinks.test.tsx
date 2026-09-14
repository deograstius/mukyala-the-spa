import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { navLinks } from '../../constants/navLinks';
import Header from '../Header';

describe('Header uses navLinks constants', () => {
  it('renders links from constants with matching paths', () => {
    // Header mounts CartDrawer, which reads the product catalog via react-query.
    const qc = new QueryClient();
    render(
      <QueryClientProvider client={qc}>
        <Header />
      </QueryClientProvider>,
    );
    navLinks.forEach((l) => {
      const link = screen.getAllByRole('link', { name: new RegExp(`^${l.label}$`, 'i') })[0];
      expect(link).toHaveAttribute('href', l.path);
    });
  });
});
