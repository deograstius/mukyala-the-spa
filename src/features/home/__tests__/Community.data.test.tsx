import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { socialLinks } from '../../../data/social';
import Community from '../Community';

describe('Community links come from centralized data', () => {
  it('community card links to the Instagram URL from data', () => {
    render(<Community />);
    const instaUrl =
      socialLinks.find((s) => s.key === 'instagram')?.url || 'https://www.instagram.com/';
    // The card itself is the follow link (the separate "Follow us" button was
    // removed as a duplicate CTA — operator pre-opening polish 2026-09-14).
    const card = screen.getByRole('link', { name: /follow instagram/i }) as HTMLAnchorElement;
    expect(card.href).toContain(instaUrl);
  });
});
