import {
  buildCurrentlyUnavailableBody,
  removeUnavailableItems,
} from '@features/checkout/removeUnavailableItems';
import {
  formatCheckoutError,
  getHoldFailedErrorInfo,
  startStripeCheckout,
} from '@features/checkout/startStripeCheckout';
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
  const { items, clear, removeItem } = useCart();
  const { list, subtotalCents } = useMemo(() => getCartDetails(items, products), [items, products]);
  const [submitting, setSubmitting] = useState(false);
  const [removingUnavailable, setRemovingUnavailable] = useState(false);
  const [error, setError] = useState<
    null | { kind: 'hold_failed'; sku: string | null } | { kind: 'message'; message: string }
  >(null);

  async function onProceed() {
    setError(null);
    if (list.length === 0) {
      setError({ kind: 'message', message: 'Your cart is empty.' });
      return;
    }
    try {
      setSubmitting(true);
      await startStripeCheckout({ list, subtotalCents, clearCart: clear });
    } catch (e: unknown) {
      const info = getHoldFailedErrorInfo(e);
      if (info.isHoldFailed) {
        setError({ kind: 'hold_failed', sku: info.sku });
      } else {
        setError({ kind: 'message', message: formatCheckoutError(e) });
      }
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
                {error ? (
                  error.kind === 'hold_failed' ? (
                    <div role="alert" aria-live="assertive" className="error-message">
                      <div className="paragraph-large" style={{ fontWeight: 600 }}>
                        Currently unavailable
                      </div>
                      <div className="paragraph-small mg-top-8px">
                        {buildCurrentlyUnavailableBody({
                          holdFailedSku: error.sku,
                          list,
                        })}
                      </div>
                      <div
                        className="mg-top-12px"
                        style={{
                          display: 'flex',
                          gap: 12,
                          justifyContent: 'center',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                        }}
                      >
                        <Button
                          variant="white"
                          disabled={removingUnavailable}
                          onClick={async () => {
                            setRemovingUnavailable(true);
                            const removed = await removeUnavailableItems({
                              holdFailedSku: error.sku,
                              list,
                              removeItem,
                            });
                            setRemovingUnavailable(false);
                            if (removed > 0) setError(null);
                          }}
                        >
                          {removingUnavailable ? 'Removing…' : 'Remove unavailable items'}
                        </Button>
                      </div>
                      <div className="paragraph-small mg-top-8px">
                        Join the waitlist:{' '}
                        <a
                          href="sms:+17608701087"
                          style={{ color: '#fff', textDecoration: 'underline' }}
                        >
                          Text
                        </a>{' '}
                        or{' '}
                        <a
                          href="mailto:info@mukyala.com?subject=Waitlist"
                          style={{ color: '#fff', textDecoration: 'underline' }}
                        >
                          Email
                        </a>
                        .
                      </div>
                    </div>
                  ) : (
                    <div role="alert" aria-live="assertive" className="error-message">
                      {error.message}
                    </div>
                  )
                ) : null}
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
