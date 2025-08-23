import { Link } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useCart } from '../../contexts/CartContext';
import { useProducts } from '../../hooks/products';
import { getCartDetails } from '../../utils/cart';
import { formatCurrency } from '../../utils/currency';

export interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const products = useProducts();
  const { items, setQty, removeItem } = useCart();
  const [liveMsg, setLiveMsg] = useState<string>('');
  const prevActive = useRef<HTMLElement | null>(null);

  const detailed = useMemo(() => getCartDetails(items, products), [items, products]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) window.addEventListener('keyup', onKey);
    return () => window.removeEventListener('keyup', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    prevActive.current = (document.activeElement as HTMLElement) || null;
    const focusable = overlayRef.current?.querySelector<HTMLElement>('button, a');
    focusable?.focus();
    return () => {
      // Restore focus to opener on unmount/close
      prevActive.current?.focus?.();
    };
  }, [open]);

  // Focus trap inside the drawer
  useEffect(() => {
    if (!open || !overlayRef.current) return;
    const overlay = overlayRef.current;
    const panel = overlay.querySelector<HTMLElement>('.cart-container') || overlay;
    function getFocusable(): HTMLElement[] {
      const nodes = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      return Array.from(nodes).filter((el) => !el.hasAttribute('disabled'));
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const focusables = getFocusable();
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !panel.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !panel.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    overlay.addEventListener('keydown', onKeyDown);
    return () => overlay.removeEventListener('keydown', onKeyDown);
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Cart"
      className="mobile-nav-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1100 }}
    >
      <div
        className="w-commerce-commercecartcontainer cart-container"
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 'min(420px, 92vw)',
          background: '#fff',
          overflow: 'auto',
          padding: '1rem',
          boxShadow: '-2px 0 8px rgba(0,0,0,0.15)',
          animation: 'slideInRight 250ms ease-out',
        }}
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
                  <div
                    className="w-commerce-commercecartordervalue cart-subtotal-number"
                    aria-label="Line total"
                  >
                    {formatCurrency(lineTotal)}
                  </div>
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
                <div className="w-commerce-commercecartordervalue cart-subtotal-number">
                  {formatCurrency(detailed.subtotalCents)}
                </div>
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
        <style>{`
          @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        `}</style>
      </div>
    </div>
  );
}
