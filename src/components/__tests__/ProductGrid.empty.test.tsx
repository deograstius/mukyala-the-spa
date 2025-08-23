import ProductGrid from '@features/shop/ProductGrid';
import { render, screen } from '@testing-library/react';

describe('ProductGrid empty state', () => {
  it('renders a friendly empty state when no products', () => {
    render(<ProductGrid products={[]} />);
    expect(screen.getByText(/no items found\./i)).toBeInTheDocument();
  });
});
