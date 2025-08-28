import { useCart } from '@contexts/CartContext';
import { useProducts } from '@hooks/products';
import SlideOver from '@shared/a11y/SlideOver';
import Price from '@shared/ui/Price';
import { Link } from '@tanstack/react-router';
import { getCartDetails } from '@utils/cart';
import { formatCurrency } from '@utils/currency';
import { useMemo, useState } from 'react';

export interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const products = useProducts();
  const { items, setQty, removeItem } = useCart();
  const [liveMsg, setLiveMsg] = useState<string>('');

  const detailed = useMemo(() => getCartDetails(items, products), [items, products]);

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      ariaLabel="Cart"
      side="right"
      width="min(420px, 92vw)"
      panelClassName="w-commerce-commercecartcontainer cart-container"
      panelStyle={{ padding: '1rem', boxShadow: '-2px 0 8px rgba(0,0,0,0.15)' }}
    >
      <div
        className="w-commerce-commercecartheader cart-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <h4 className="w-commerce-commercecartheading display-4" id="cart-title">
          Your Cart
        </h4>
        <button
          type="button"
          aria-label="Close cart"
          className="w-commerce-commercecartcloselink cart-close-button"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      {detailed.list.length === 0 ? (
        <div
          className="w-commerce-commercecartemptystate pd-sides-24px flex-vertical"
          style={{ padding: '1rem' }}
        >
          <div
            aria-live="polite"
            aria-label="This cart is empty"
            className="display-4 semi-bold text-neutral-800"
          >
            No items found.
          </div>
          <div className="mg-top-16px">
            <Link to="/shop" className="button-primary w-inline-block">
              <div className="text-block">Get started</div>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="w-commerce-commercecartlist cart-list" style={{ padding: '0.5rem 0' }}>
            {detailed.list.map(({ slug, qty, product, priceCents, lineTotal }) => (
              <div
                key={slug}
                className="w-commerce-commercecartlineitem cart-line-item"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '64px 1fr auto',
                  gap: '12px',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid #eee',
                }}
              >
                <img
                  src={product.image}
                  alt={product.title}
                  width={64}
                  height={64}
                  style={{ objectFit: 'cover', borderRadius: 8 }}
                />
                <div>
                  <Link to={product.href} className="nav-link">
                    {product.title}
                  </Link>
                  <div className="paragraph-small" aria-label="Unit price">
                    {formatCurrency(priceCents)}
                  </div>
                  <div
                    className="mg-top-8px"
                    style={{ display: 'flex', gap: 8, alignItems: 'center' }}
                  >
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      className="button-reset"
                      onClick={() => {
                        const newQty = Math.max(1, qty - 1);
                        setQty(slug, newQty);
                        setLiveMsg(`${product.title} quantity ${newQty}`);
                      }}
                    >
                      −
                    </button>
                    <span aria-live="polite" aria-label="Quantity">
                      {qty}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      className="button-reset"
                      onClick={() => {
                        const newQty = qty + 1;
                        setQty(slug, newQty);
                        setLiveMsg(`${product.title} quantity ${newQty}`);
                      }}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="link"
                      onClick={() => {
                        removeItem(slug);
                        setLiveMsg(`${product.title} removed from cart`);
                      }}
                      aria-label={`Remove ${product.title}`}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <Price
                  cents={lineTotal}
                  as="div"
                  className="w-commerce-commercecartordervalue cart-subtotal-number"
                />
              </div>
            ))}
          </div>

          <div
            className="w-commerce-commercecartfooter cart-footer"
            style={{ paddingTop: '0.75rem' }}
          >
            <div
              aria-atomic="true"
              aria-live="polite"
              className="w-commerce-commercecartlineitem cart-line-item"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
              }}
            >
              <div className="cart-subtotal">Subtotal</div>
              <Price
                cents={detailed.subtotalCents}
                as="div"
                className="w-commerce-commercecartordervalue cart-subtotal-number"
              />
            </div>
            <Link
              to="/checkout"
              className="w-commerce-commercecartcheckoutbutton button-primary w-inline-block"
              onClick={onClose}
            >
              <div className="text-block">Continue to Checkout</div>
            </Link>
          </div>
        </>
      )}
      {/* Live region for cart updates */}
      <div
        aria-live="polite"
        className="visually-hidden"
        style={{ position: 'absolute', left: -9999 }}
      >
        {liveMsg}
      </div>
    </SlideOver>
  );
}
