import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from '../../components/Header';
import { CartProvider } from '../../contexts/CartContext';
import { shopProducts } from '../../data/products';
import ProductDetail from '../ProductDetail';

function setPath(path: string) {
  window.history.pushState({}, '', path);
}

describe('ProductDetail', () => {
  it('renders product by slug from path', () => {
    const first = shopProducts[0];
    const slug = first.href.split('/').pop()!;
    setPath(`/shop/${slug}`);

    render(
      <CartProvider>
        <ProductDetail />
      </CartProvider>,
    );

    expect(screen.getByRole('heading', { name: first.title, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(first.price)).toBeInTheDocument();
  });

  it('shows not-found message for unknown slug', () => {
    setPath('/shop/unknown-product');
    render(
      <CartProvider>
        <ProductDetail />
      </CartProvider>,
    );
    expect(screen.getByRole('heading', { name: /product not found/i })).toBeInTheDocument();
  });

  it('adds to cart and updates header count', async () => {
    const user = userEvent.setup();
    const first = shopProducts[0];
    const slug = first.href.split('/').pop()!;
    setPath(`/shop/${slug}`);

    render(
      <CartProvider>
        {/* Render header to show live count */}
        <Header />
        <ProductDetail />
      </CartProvider>,
    );

    // Initial count 0
    const cartButton = screen.getByRole('button', { name: /open cart/i });
    let qtyEl = cartButton.querySelector('.cart-quantity');
    expect(qtyEl?.textContent).toBe('0');

    await user.click(screen.getByRole('button', { name: /add to cart/i }));

    qtyEl = cartButton.querySelector('.cart-quantity');
    expect(qtyEl?.textContent).toBe('1');
  });
});
