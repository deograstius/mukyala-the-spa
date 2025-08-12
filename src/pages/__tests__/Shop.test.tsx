import { render, screen } from '@testing-library/react';
import { shopProducts } from '../../data/products';
import Shop from '../Shop';

describe('Shop page', () => {
  it('renders hero and product grid', () => {
    render(<Shop />);
    expect(
      screen.getByRole('heading', {
        name: /shop/i,
        level: 1,
      }),
    ).toBeInTheDocument();

    // One or more product links are present
    const first = shopProducts[0];
    const link = screen.getByRole('link', { name: new RegExp(first.title) });
    expect(link).toHaveAttribute('href', first.href);

    // Grid renders all items
    const allLinks = screen.getAllByRole('link');
    // Only product links exist within the page content
    expect(allLinks.length).toBeGreaterThanOrEqual(shopProducts.length);
  });
});
