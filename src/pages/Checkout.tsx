import { createCheckout, createOrder } from '@hooks/orders.api';
import Button from '@shared/ui/Button';
import Container from '@shared/ui/Container';
import Price from '@shared/ui/Price';
import Section from '@shared/ui/Section';
import { useMemo, useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useProducts } from '../hooks/products';
import { getCartDetails } from '../utils/cart';

export default function Checkout() {
  const products = useProducts();
  const { items, clear } = useCart();
  const { list, subtotalCents } = useMemo(() => getCartDetails(items, products), [items, products]);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onProceed() {
    setError(null);
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('Please enter a valid email.');
      return;
    }
    if (list.length === 0) {
      setError('Your cart is empty.');
      return;
    }
    // Ensure all items have SKUs
    const itemsWithSku = list.map((it) => ({
      sku: it.product.sku || '',
      title: it.product.title,
      priceCents: it.product.priceCents,
      qty: it.qty,
    }));
    if (itemsWithSku.some((i) => !i.sku)) {
      setError('A product is missing a SKU.');
      return;
    }
    try {
      setSubmitting(true);
      const order = await createOrder({ email, items: itemsWithSku });
      const { checkoutUrl } = await createCheckout(order.id);
      window.location.href = checkoutUrl;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to start checkout.');
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
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                {error && (
                  <div role="alert" className="paragraph-small" style={{ color: '#b91c1c' }}>
                    {error}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <label htmlFor="checkout-email" className="paragraph-small">
                    Email
                  </label>
                  <input
                    id="checkout-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: 6,
                      minWidth: 260,
                    }}
                  />
                  <Button onClick={onProceed} disabled={submitting}>
                    {submitting ? 'Redirecting…' : 'Proceed to Checkout'}
                  </Button>
                  <Button variant="link" onClick={clear}>
                    Clear cart
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}
