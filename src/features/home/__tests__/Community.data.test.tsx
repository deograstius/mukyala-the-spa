import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { socialLinks } from '../../../data/social';
import Community from '../Community';

describe('Community links come from centralized data', () => {
  it('CTA Follow us button uses Instagram URL from data', () => {
    render(<Community />);
    const instaUrl =
      socialLinks.find((s) => s.key === 'instagram')?.url || 'https://www.instagram.com/';
    const followCtas = screen.getAllByRole('link', { name: /follow us/i });
    // The CTA under the grid comes last; ensure at least one matches the instagram URL
    expect(followCtas.some((a) => (a as HTMLAnchorElement).href.includes(instaUrl))).toBe(true);
  });
});
