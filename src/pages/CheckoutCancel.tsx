import { formatCheckoutError, startStripeCheckout } from '@features/checkout/startStripeCheckout';
import { clearCheckoutSuccessSnapshot, readCheckoutSuccessSnapshot } from '@hooks/checkoutSuccess';
import { cancelOrder } from '@hooks/orders.api';
import Button from '@shared/ui/Button';
import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';
import { Link, useSearch } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useProducts } from '../hooks/products';
import { getCartDetails } from '../utils/cart';

type CheckoutCancelSearch = { orderId?: string };

type CancelState = 'idle' | 'canceling' | 'canceled' | 'failed';

export default function CheckoutCancel() {
  const search = useSearch({ from: '/checkout/cancel' }) as CheckoutCancelSearch;
  const orderId = search?.orderId;
  const { items: cartItems, clear, setQty } = useCart();
  const products = useProducts();
  const detailed = useMemo(() => getCartDetails(cartItems, products), [cartItems, products]);

  const snapshot = useMemo(() => readCheckoutSuccessSnapshot(orderId), [orderId]);
  const cartIsEmpty = useMemo(() => Object.keys(cartItems).length === 0, [cartItems]);
  const [cancelState, setCancelState] = useState<CancelState>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const restoredRef = useRef(false);

  useEffect(() => {
    if (!orderId || restoredRef.current) return;
    if (!snapshot || snapshot.items.length === 0) return;
    if (!cartIsEmpty) return;

    clear();
    for (const item of snapshot.items) {
      if (!item.slug || typeof item.qty !== 'number') continue;
      setQty(item.slug, item.qty);
    }
    restoredRef.current = true;
  }, [orderId, snapshot, cartIsEmpty, clear, setQty]);

  useEffect(() => {
    if (!orderId) return;
    let alive = true;

    setCancelState('canceling');
    cancelOrder(orderId)
      .then(() => {
        if (!alive) return;
        setCancelState('canceled');
        setMessage(null);
        clearCheckoutSuccessSnapshot(orderId);
      })
      .catch(() => {
        if (!alive) return;
        setCancelState('failed');
        setMessage(
          'We couldn’t confirm the cancellation yet. If you completed payment, check your email. Otherwise, you can try checkout again.',
        );
      });

    return () => {
      alive = false;
    };
  }, [orderId]);

  if (!orderId) {
    return (
      <Section>
        <Container>
          <div className="inner-container _580px center text-center">
            <h1 className="display-11">Checkout canceled</h1>
            <p className="paragraph-large mg-top-16px">
              We couldn’t find an order reference in the cancellation link.
            </p>
            <div className="buttons-row justify-center mg-top-24px">
              <Link to="/shop" className="button-primary large w-inline-block">
                <div className="text-block">Return to shop</div>
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  const heading =
    cancelState === 'canceling'
      ? 'Canceling checkout…'
      : cancelState === 'canceled'
        ? 'Checkout canceled'
        : 'Checkout canceled';

  const subcopy =
    cancelState === 'canceled'
      ? 'Your cart is ready if you’d like to try again.'
      : cancelState === 'canceling'
        ? 'Hang tight while we release your reserved items.'
        : message;

  return (
    <Section>
      <Container>
        <div className="inner-container _580px center text-center">
          <h1 className="display-11">{heading}</h1>
          <p className="paragraph-large mg-top-16px">{subcopy}</p>
          <p className="paragraph-small mg-top-12px">Order #{orderId}</p>
          <div className="buttons-row justify-center mg-top-24px wrap">
            <Button
              onClick={async () => {
                setRetryError(null);
                setRetrying(true);
                try {
                  await startStripeCheckout({
                    list: detailed.list,
                    subtotalCents: detailed.subtotalCents,
                    clearCart: clear,
                  });
                } catch (err) {
                  setRetryError(formatCheckoutError(err));
                  setRetrying(false);
                }
              }}
              disabled={retrying || cancelState === 'canceling'}
            >
              {retrying ? 'Redirecting…' : 'Try checkout again'}
            </Button>
            <Link to="/shop" className="link center-mbp w-inline-block">
              <div>Continue shopping</div>
              <div className="item-icon-right medium">
                <div className="icon-font-rounded"></div>
              </div>
            </Link>
          </div>
          {retryError ? (
            <p className="paragraph-small mg-top-12px" role="alert" style={{ color: '#b91c1c' }}>
              {retryError}
            </p>
          ) : null}

          {snapshot && snapshot.items.length > 0 && (
            <div className="mg-top-24px">
              <Button
                variant="link"
                onClick={() => {
                  clear();
                  for (const item of snapshot.items) {
                    if (!item.slug || typeof item.qty !== 'number') continue;
                    setQty(item.slug, item.qty);
                  }
                  clearCheckoutSuccessSnapshot(orderId);
                }}
              >
                Restore previous cart
              </Button>
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}
