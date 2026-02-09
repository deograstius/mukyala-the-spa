import { useCart } from '@contexts/CartContext';
import { useProducts } from '@hooks/products';
import Dialog from '@shared/a11y/Dialog';
import LiveRegion from '@shared/a11y/LiveRegion';
import Price from '@shared/ui/Price';
import { Link } from '@tanstack/react-router';
import { getCartDetails } from '@utils/cart';
import { formatCurrency } from '@utils/currency';
import { useMemo, useState } from 'react';

const ERROR_MESSAGES = {
  general: 'Something went wrong when adding this item to the cart.',
  quantity: 'Product is not available in this quantity.',
  checkout_disabled: 'Checkout is disabled on this site.',
  order_min: 'The order minimum was not met. Add more items to your cart to continue.',
  subscription:
    'Before you purchase, please use your email invite to verify your address so we can send order updates.',
} as const;

export default function CartDrawer() {
  const products = useProducts();
  const { items, setQty, removeItem, cartOpen, cartError, closeCart } = useCart();
  const [liveMsg, setLiveMsg] = useState<string>('');

  const detailed = useMemo(() => getCartDetails(items, products), [items, products]);

  return (
    <Dialog
      open={cartOpen}
      onClose={closeCart}
      ariaLabelledBy="cart-title"
      overlayStyle={{ backgroundColor: 'rgba(0,0,0,0.35)', zIndex: 1200 }}
    >
      <div
        className="w-commerce-commercecartcontainerwrapper w-commerce-commercecartcontainerwrapper--cartType-modal"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeCart();
        }}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px',
          // Prevent double-darkness: Webflow wrapper sets its own backdrop; we want Dialog to own the overlay.
          backgroundColor: 'transparent',
        }}
      >
        <div
          data-dialog-panel
          className="w-commerce-commercecartcontainer cart-container"
          style={{
            width: 'min(560px, 92vw)',
            maxHeight: 'min(760px, 90vh)',
            background: '#fff',
            overflow: 'auto',
            borderRadius: 16,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          }}
        >
          <div className="w-commerce-commercecartheader cart-header">
            <h4 className="w-commerce-commercecartheading display-4" id="cart-title">
              Your Cart
            </h4>
            <button
              type="button"
              aria-label="Close cart"
              className="w-commerce-commercecartcloselink cart-close-button w-inline-block button-reset"
              onClick={closeCart}
            >
              <div className="icon-font-rounded" aria-hidden="true">
                
              </div>
            </button>
          </div>

          <div className="w-commerce-commercecartformwrapper cart-form-wrapper">
            <div className="w-commerce-commercecartform">
              {detailed.list.length === 0 ? (
                <div className="w-commerce-commercecartemptystate pd-sides-24px flex-vertical">
                  <div
                    aria-live="polite"
                    aria-label="This cart is empty"
                    className="display-4 semi-bold text-neutral-800"
                  >
                    No items found.
                  </div>
                  <div className="mg-top-16px">
                    <Link to="/shop" className="button-primary w-button" onClick={closeCart}>
                      Get started
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-commerce-commercecartlist cart-list">
                    {detailed.list.map(({ slug, qty, product, priceCents }) => (
                      <div key={slug} className="w-commerce-commercecartitem cart-item-wrapper">
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-commerce-commercecartitemimage cart-image-image"
                          loading="lazy"
                        />
                        <div className="w-commerce-commercecartiteminfo">
                          <Link
                            to={product.href}
                            className="w-commerce-commercecartproductname cart-item-title"
                          >
                            {product.title}
                          </Link>
                          <div className="cart-item-price">{formatCurrency(priceCents)}</div>
                          <button
                            type="button"
                            className="w-inline-block button-reset"
                            onClick={() => {
                              removeItem(slug);
                              setLiveMsg(`${product.title} removed from cart`);
                            }}
                            aria-label={`Remove ${product.title} from cart`}
                          >
                            <div>Remove</div>
                          </button>
                        </div>
                        <input
                          aria-label="Update quantity"
                          className="w-commerce-commercecartquantity input cart-quantity-input"
                          required
                          pattern="^[0-9]+$"
                          inputMode="numeric"
                          type="number"
                          name="quantity"
                          autoComplete="off"
                          value={qty}
                          onChange={(e) => {
                            const nextQty = Number.parseInt(e.target.value, 10);
                            const safeQty = Number.isFinite(nextQty) ? Math.max(0, nextQty) : 1;
                            setQty(slug, safeQty);
                            setLiveMsg(`${product.title} quantity ${safeQty}`);
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="w-commerce-commercecartfooter cart-footer">
                    <div
                      aria-atomic="true"
                      aria-live="polite"
                      className="w-commerce-commercecartlineitem cart-line-item"
                    >
                      <div className="cart-subtotal">Subtotal</div>
                      <Price
                        cents={detailed.subtotalCents}
                        as="div"
                        className="w-commerce-commercecartordervalue cart-subtotal-number"
                      />
                    </div>
                    <div>
                      <Link
                        to="/checkout"
                        className="w-commerce-commercecartcheckoutbutton button-primary"
                        onClick={closeCart}
                      >
                        Continue to Checkout
                      </Link>
                    </div>
                  </div>
                </>
              )}

              {cartError ? (
                <div
                  aria-live="assertive"
                  data-node-type="commerce-cart-error"
                  className="w-commerce-commercecarterrorstate error-message"
                >
                  <div className="w-cart-error-msg">{ERROR_MESSAGES[cartError]}</div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Live region for cart updates */}
        <LiveRegion
          message={liveMsg}
          politeness="polite"
          style={{ position: 'absolute', left: -9999 }}
        />
      </div>
    </Dialog>
  );
}
