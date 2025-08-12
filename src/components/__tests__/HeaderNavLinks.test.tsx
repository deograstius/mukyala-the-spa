import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { navLinks } from '../../constants/navLinks';
import Header from '../Header';

describe('Header uses navLinks constants', () => {
  it('renders links from constants with matching paths', () => {
    render(<Header />);
    navLinks.forEach((l) => {
      const link = screen.getAllByRole('link', { name: new RegExp(`^${l.label}$`, 'i') })[0];
      expect(link).toHaveAttribute('href', l.path);
    });
  });
});
