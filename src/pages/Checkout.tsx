import { setBaseTitle } from '@app/seo';
import SoldOutBanner from '@features/checkout/SoldOutBanner';
import {
  formatCheckoutError,
  getHoldFailedErrorInfo,
  startStripeCheckout,
} from '@features/checkout/startStripeCheckout';
import Button from '@shared/ui/Button';
import Container from '@shared/ui/Container';
import Price from '@shared/ui/Price';
import Section from '@shared/ui/Section';
import { Link, useSearch } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { SHOP_UNAVAILABLE_MESSAGE, useProductsState } from '../hooks/products';
import { getCartDetails } from '../utils/cart';
import { humanizeSlug } from '../utils/slug';

export default function Checkout() {
  const { missingOrder } = useSearch({ from: '/checkout' }) as { missingOrder?: string };
  const {
    products,
    isLoading: productsLoading,
    isUnavailable: shopUnreachable,
    refetch: refetchProducts,
  } = useProductsState();
  const { items, clear, removeItem } = useCart();
  const { list, subtotalCents, unavailable } = useMemo(
    () => getCartDetails(items, products),
    [items, products],
  );
  const cartItemCount = Object.keys(items).length;
  const [submitting, setSubmitting] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [error, setError] = useState<
    null | { kind: 'hold_failed'; sku: string | null } | { kind: 'message'; message: string }
  >(null);

  useEffect(() => {
    setBaseTitle('Checkout');
  }, []);

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
            <div className="mg-top-16px">
              <p className="paragraph-large">
                Review your order below — payment happens on our secure Stripe page.
              </p>
            </div>
          </div>
        </div>

        <div className="mg-top-40px">
          <div className="inner-container _760px center">
            {missingOrder === '1' && (
              <div className="card checkout-card mg-bottom-32px" role="alert">
                <p className="paragraph-large">
                  We couldn’t find the last order attempt. Please review your cart below and try
                  checkout again.
                </p>
                <p className="paragraph-small mg-top-12px">
                  Need help? Email{' '}
                  <a
                    href="mailto:info@mukyala.com"
                    className="text-link"
                    data-cta-id="checkout-missing-order-email"
                  >
                    info@mukyala.com
                  </a>{' '}
                  or return to the{' '}
                  <Link to="/shop" className="text-link" data-cta-id="checkout-missing-order-shop">
                    shop
                  </Link>
                  .
                </p>
              </div>
            )}
            {cartItemCount === 0 ? (
              <div className="card checkout-card text-center">
                <p className="paragraph-large">Your cart is empty.</p>
                <div className="mg-top-16px">
                  <Link
                    to="/shop"
                    className="button-primary filled large w-inline-block"
                    data-cta-id="checkout-empty-browse-shop"
                  >
                    <div className="text-block">Browse the shop</div>
                  </Link>
                </div>
              </div>
            ) : shopUnreachable ? (
              <div className="card checkout-card" role="alert">
                <p className="paragraph-large">{SHOP_UNAVAILABLE_MESSAGE}</p>
                <div className="mg-top-12px">
                  <Button
                    data-cta-id="checkout-retry-load-products"
                    onClick={() => refetchProducts()}
                  >
                    Try again
                  </Button>
                </div>
              </div>
            ) : productsLoading ? (
              <div className="card checkout-card" aria-live="polite">
                <p className="paragraph-large">Loading your cart…</p>
              </div>
            ) : (
              <div className="card checkout-card">
                {unavailable.length > 0 && (
                  <ul className="cart-lines mg-bottom-16px">
                    {unavailable.map(({ slug }) => (
                      <li key={slug} className="cart-line">
                        <div>
                          <div className="paragraph-large">
                            “{humanizeSlug(slug)}” is no longer available.
                          </div>
                          <div className="paragraph-small">
                            It left our catalog and won’t be charged.
                          </div>
                        </div>
                        <Button
                          variant="link"
                          data-cta-id={`checkout-remove-unavailable-${slug}`}
                          aria-label={`Remove unavailable item ${humanizeSlug(slug)} from cart`}
                          onClick={() => removeItem(slug)}
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                <ul className="cart-lines">
                  {list.map(({ slug, qty, product, lineTotal }) => (
                    <li key={slug} className="cart-line">
                      <div className="cart-line-main">
                        <img
                          src={product.image}
                          alt={product.title}
                          width={64}
                          height={64}
                          className="cart-line-media"
                        />
                        <div>
                          <Link
                            to={product.href}
                            className="paragraph-large text-link"
                            data-cta-id={`checkout-item-view-${slug}`}
                          >
                            {product.title}
                          </Link>
                          <div className="paragraph-small">
                            Qty {qty} ·{' '}
                            <button
                              type="button"
                              className="button-reset text-link paragraph-small"
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer',
                              }}
                              data-cta-id={`checkout-remove-item-${slug}`}
                              aria-label={`Remove ${product.title} from cart`}
                              onClick={() => removeItem(slug)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                      <Price cents={lineTotal} as="div" className="paragraph-large" />
                    </li>
                  ))}
                </ul>
                <div className="checkout-subtotal-row">
                  <div className="display-7">Subtotal</div>
                  <Price cents={subtotalCents} as="div" className="display-7" />
                </div>
                <p className="paragraph-small mg-top-8px">
                  Free shipping within the U.S. Any sales tax is shown on the payment page.
                </p>
                <div className="mg-top-24px">
                  {error ? (
                    error.kind === 'hold_failed' ? (
                      <SoldOutBanner
                        surface="checkout"
                        holdFailedSku={error.sku}
                        list={list}
                        removeItem={removeItem}
                        onRemoved={() => setError(null)}
                        style={{ marginBottom: 16 }}
                      />
                    ) : (
                      <div
                        role="alert"
                        aria-live="assertive"
                        className="error-message"
                        style={{ marginBottom: 16 }}
                      >
                        {error.message}
                      </div>
                    )
                  ) : null}
                  <div className="checkout-actions">
                    <Button
                      onClick={onProceed}
                      disabled={submitting || list.length === 0}
                      variant="primary-filled"
                      size="large"
                      data-cta-id="checkout-proceed"
                    >
                      {submitting ? 'Redirecting…' : 'Proceed to Checkout'}
                    </Button>
                    {confirmingClear ? (
                      <>
                        <span className="paragraph-small">
                          Remove {list.length === 1 ? 'this item' : `all ${list.length} items`}?
                        </span>
                        <Button
                          variant="link"
                          data-cta-id="checkout-clear-cart-confirm"
                          onClick={() => {
                            clear();
                            setConfirmingClear(false);
                          }}
                        >
                          Yes, clear
                        </Button>
                        <Button
                          variant="link"
                          data-cta-id="checkout-clear-cart-keep"
                          onClick={() => setConfirmingClear(false)}
                        >
                          Keep items
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="link"
                        onClick={() => setConfirmingClear(true)}
                        data-cta-id="checkout-clear-cart"
                      >
                        Clear cart
                      </Button>
                    )}
                  </div>
                  <p className="paragraph-small mg-top-16px">
                    By continuing you acknowledge our{' '}
                    <Link to="/terms" className="text-link" data-cta-id="checkout-terms">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-link" data-cta-id="checkout-privacy">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}
