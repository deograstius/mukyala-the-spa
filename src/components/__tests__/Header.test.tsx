import { render, screen } from '@testing-library/react';

import Header from '../Header';

describe('Header', () => {
  it('renders logo and main nav links', () => {
    render(<Header />);

    // Logo image
    expect(screen.getByAltText(/mukyala day spa logo/i)).toBeInTheDocument();

    // A few representative nav links
    // There are duplicate "Home" links (desktop + mobile). Assert at least one.
    const homeLinks = screen.getAllByRole('link', { name: /home/i });
    expect(homeLinks.length).toBeGreaterThan(0);
    expect(homeLinks[0]).toHaveAttribute('href', '/');
    const aboutLinks = screen.getAllByRole('link', { name: /about/i });
    expect(aboutLinks[0]).toHaveAttribute('href', '/about');

    const shopLinks = screen.getAllByRole('link', { name: /shop/i });
    expect(shopLinks[0]).toHaveAttribute('href', '/shop');
  });
});
