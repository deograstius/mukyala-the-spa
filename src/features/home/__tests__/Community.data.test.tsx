import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { socialLinks } from '../../../data/social';
import Community from '../Community';

describe('Community links come from centralized data', () => {
  it('CTA Follow us button uses Instagram URL from data', () => {
    render(<Community />);
    const instaUrl =
      socialLinks.find((s) => s.key === 'instagram')?.url || 'https://www.instagram.com/';
    const followCta = screen.getByRole('link', { name: /follow us/i }) as HTMLAnchorElement;
    expect(followCta.href).toContain(instaUrl);
  });
});
