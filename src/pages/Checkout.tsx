import Button from '@shared/ui/Button';
import Container from '@shared/ui/Container';
import Price from '@shared/ui/Price';
import Section from '@shared/ui/Section';
import { useMemo } from 'react';
import { useCart } from '../contexts/CartContext';
import { useProducts } from '../hooks/products';
import { getCartDetails } from '../utils/cart';

export default function Checkout() {
  const products = useProducts();
  const { items, clear } = useCart();
  const { list, subtotalCents } = useMemo(() => getCartDetails(items, products), [items, products]);

  return (
    <Section>
      <Container>
        <div className="inner-container _580px center">
          <div className="text-center">
            <h1 className="display-11">Checkout</h1>
            <div className="mg-top-16px">
              <p className="paragraph-large">
                Online checkout coming soon. Please call or visit to complete purchase.
              </p>
            </div>
          </div>
        </div>

        <div className="mg-top-40px">
          {list.length === 0 ? (
            <div className="card _404-not-found-card" style={{ padding: '1rem' }}>
              <p className="paragraph-large">Your cart is empty.</p>
            </div>
          ) : (
            <div className="card checkout-block" style={{ padding: '1rem' }}>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {list.map(({ slug, qty, product, lineTotal }) => (
                  <li
                    key={slug}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: '1px solid #eee',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <img
                        src={product.image}
                        alt={product.title}
                        width={48}
                        height={48}
                        style={{ borderRadius: 8, objectFit: 'cover' }}
                      />
                      <div>
                        <div className="paragraph-large">{product.title}</div>
                        <div className="paragraph-small">Qty: {qty}</div>
                      </div>
                    </div>
                    <Price cents={lineTotal} as="div" className="paragraph-large" />
                  </li>
                ))}
              </ul>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                <div className="display-7">Subtotal</div>
                <Price cents={subtotalCents} as="div" className="display-7" />
              </div>
              <div className="mg-top-16px" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="link" onClick={clear}>
                  Clear cart
                </Button>
              </div>
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}
