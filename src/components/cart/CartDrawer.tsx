import { Link } from '@tanstack/react-router';
import { useEffect, useMemo, useRef } from 'react';
import { useCart } from '../../contexts/CartContext';
import { getSlugFromHref, useProducts } from '../../hooks/products';

function parsePriceToCents(price: string): number {
  const m = price.replace(/[^0-9.]/g, '');
  const n = Number.parseFloat(m || '0');
  return Math.round(n * 100);
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const products = useProducts();
  const { items, setQty, removeItem } = useCart();

  const detailed = useMemo(() => {
    const list = Object.values(items)
      .map((it) => {
        const product = products.find((p) => getSlugFromHref(p.href) === it.slug);
        if (!product) return undefined;
        const priceCents = parsePriceToCents(product.price);
        return { ...it, product, priceCents, lineTotal: priceCents * it.qty };
      })
      .filter(Boolean) as Array<{
      slug: string;
      qty: number;
      product: ReturnType<typeof useProducts>[number];
      priceCents: number;
      lineTotal: number;
    }>;
    const subtotal = list.reduce((sum, r) => sum + r.lineTotal, 0);
    return { list, subtotal };
  }, [items, products]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) window.addEventListener('keyup', onKey);
    return () => window.removeEventListener('keyup', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const focusable = overlayRef.current?.querySelector<HTMLElement>('button, a');
    focusable?.focus();
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
                        onClick={() => setQty(slug, Math.max(1, qty - 1))}
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
                        onClick={() => setQty(slug, qty + 1)}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="link"
                        onClick={() => removeItem(slug)}
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
                  {formatCurrency(detailed.subtotal)}
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
        <style>{`
          @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        `}</style>
      </div>
    </div>
  );
}
