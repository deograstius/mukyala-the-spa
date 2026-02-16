import { startStripeCheckout, formatCheckoutError } from '@features/checkout/startStripeCheckout';
import Button from '@shared/ui/Button';
import Container from '@shared/ui/Container';
import Price from '@shared/ui/Price';
import Section from '@shared/ui/Section';
import { useSearch } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useProducts } from '../hooks/products';
import { getCartDetails } from '../utils/cart';

export default function Checkout() {
  const { missingOrder } = useSearch({ from: '/checkout' }) as { missingOrder?: string };
  const products = useProducts();
  const { items, clear } = useCart();
  const { list, subtotalCents } = useMemo(() => getCartDetails(items, products), [items, products]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onProceed() {
    setError(null);
    if (list.length === 0) {
      setError('Your cart is empty.');
      return;
    }
    try {
      setSubmitting(true);
      await startStripeCheckout({ list, subtotalCents, clearCart: clear });
    } catch (e: unknown) {
      setError(formatCheckoutError(e));
      setSubmitting(false);
    }
  }

  return (
    <Section>
      <Container>
        <div className="inner-container _580px center">
          <div className="text-center">
            <h1 className="display-11">Checkout</h1>
          </div>
        </div>

        <div className="mg-top-40px">
          {missingOrder === '1' && (
            <div className="card _404-not-found-card" role="alert" style={{ padding: '1rem' }}>
              <p className="paragraph-large">
                We couldn’t find the last order attempt. Please review your cart below and try
                checkout again.
              </p>
              <p className="paragraph-small mg-top-12px">
                Need help? Email{' '}
                <a href="mailto:info@mukyala.com" className="link">
                  info@mukyala.com
                </a>{' '}
                or return to the{' '}
                <a href="/shop" className="link">
                  shop
                </a>
                .
              </p>
            </div>
          )}
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
              <div
                className="mg-top-16px"
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                {error && (
                  <div role="alert" className="paragraph-small" style={{ color: '#b91c1c' }}>
                    {error}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Button onClick={onProceed} disabled={submitting}>
                    {submitting ? 'Redirecting…' : 'Proceed to Checkout'}
                  </Button>
                  <Button variant="link" onClick={clear}>
                    Clear cart
                  </Button>
                </div>
                <p className="paragraph-small" style={{ margin: 0 }}>
                  By continuing you acknowledge our{' '}
                  <a href="/terms" className="link">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="link">
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}
