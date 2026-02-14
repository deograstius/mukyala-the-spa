import { saveCheckoutSuccessSnapshot, clearCheckoutSuccessSnapshot } from '@hooks/checkoutSuccess';
import { createCheckout, createOrder } from '@hooks/orders.api';
import Button from '@shared/ui/Button';
import Container from '@shared/ui/Container';
import Price from '@shared/ui/Price';
import Section from '@shared/ui/Section';
import { useSearch } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useProducts } from '../hooks/products';
import { ApiError } from '../utils/api';
import { getCartDetails } from '../utils/cart';

export default function Checkout() {
  const { missingOrder } = useSearch({ from: '/checkout' }) as { missingOrder?: string };
  const products = useProducts();
  const { items, clear } = useCart();
  const { list, subtotalCents } = useMemo(() => getCartDetails(items, products), [items, products]);
  const [email, setEmail] = useState('');
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function formatCheckoutError(err: unknown): string {
    if (err instanceof ApiError) {
      const code = err.code;
      if (code === 'idempotency_in_progress') {
        return 'Checkout is already being created. Please wait a moment and try again.';
      }
      if (code === 'hold_failed') {
        const sku = (() => {
          const details = err.details;
          if (typeof details !== 'object' || details === null) return null;
          if (!('sku' in details)) return null;
          const raw = (details as Record<string, unknown>).sku;
          if (typeof raw === 'string') return raw;
          if (typeof raw === 'number') return String(raw);
          return null;
        })();
        return sku
          ? `That item is currently unavailable (${sku}). Please remove it from your cart and try again.`
          : 'One or more items are currently unavailable. Please review your cart and try again.';
      }
      if (code === 'catalog_unavailable') {
        return 'We’re having trouble loading products right now. Please try again.';
      }
      if (code === 'not_found') {
        return 'We couldn’t find that order. Please try checkout again from your cart.';
      }
      if (code === 'invalid_state') {
        return 'This order is no longer eligible for checkout. Please return to the shop and try again.';
      }
      if (err.status >= 500) {
        return 'Something went wrong starting checkout. Please try again.';
      }
      if (code) {
        return `Checkout failed (${code}). Please try again.`;
      }
      return `Checkout failed (HTTP ${err.status}). Please try again.`;
    }
    if (err instanceof Error && err.message) return err.message;
    return 'Failed to start checkout. Please try again.';
  }

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
    let stagedOrderId: string | null = null;
    try {
      setSubmitting(true);
      const order = await createOrder({ email, items: itemsWithSku });
      stagedOrderId = order.id;
      saveCheckoutSuccessSnapshot({
        orderId: order.id,
        email,
        subtotalCents,
        items: list,
        confirmationToken: order.confirmationToken,
        confirmationExpiresAt: order.confirmationExpiresAt,
      });
      const { checkoutUrl } = await createCheckout(order.id);
      clear();
      window.location.href = checkoutUrl;
    } catch (e: unknown) {
      if (stagedOrderId) {
        clearCheckoutSuccessSnapshot(stagedOrderId);
      }
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
                <label htmlFor="checkout-email" className="paragraph-small">
                  Email (needed for receipts & booking confirmations)
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
                <label
                  htmlFor="checkout-opt-in"
                  className="paragraph-small"
                  style={{ display: 'flex', gap: 8 }}
                >
                  <input
                    id="checkout-opt-in"
                    type="checkbox"
                    checked={marketingOptIn}
                    onChange={(e) => setMarketingOptIn(e.target.checked)}
                  />
                  <span>
                    Yes, send Mukyala product updates. You will receive a double opt-in email before
                    any marketing messages.
                  </span>
                </label>
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
