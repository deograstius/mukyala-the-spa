import ProductGrid from '@features/shop/ProductGrid';
import { render } from '@testing-library/react';

describe('ProductGrid empty state', () => {
  it('renders nothing when no products — the page owns the sold-out fallback (#27)', () => {
    const { container } = render(<ProductGrid products={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
