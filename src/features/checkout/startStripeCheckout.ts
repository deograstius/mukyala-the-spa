import { saveCheckoutSuccessSnapshot } from '@hooks/checkoutSuccess';
import { createCheckout, createOrder } from '@hooks/orders.api';
import { ApiError } from '@utils/api';
import type { DetailedCartItem } from '@utils/cart';

/**
 * Retry-safe pending-order marker. If `createOrder` succeeds but the checkout
 * step fails (network blip, transient 5xx), a plain retry used to create a
 * SECOND pending order — stacking inventory holds and, at the margin, making
 * items read as sold out. We remember the staged order per cart fingerprint
 * (sessionStorage) and re-enter checkout on the SAME order when the cart has
 * not changed. Stale markers (order canceled/expired server-side) fall back
 * to creating a fresh order.
 */
const PENDING_ORDER_KEY = 'checkout-pending-order:v1';

type PendingOrderMarker = { fingerprint: string; orderId: string };

function cartFingerprint(items: Array<{ sku: string; qty: number }>): string {
  return JSON.stringify(
    [...items].map((i) => ({ sku: i.sku, qty: i.qty })).sort((a, b) => a.sku.localeCompare(b.sku)),
  );
}

function readPendingOrder(fingerprint: string): string | null {
  try {
    const raw = window.sessionStorage.getItem(PENDING_ORDER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingOrderMarker;
    return parsed.fingerprint === fingerprint && typeof parsed.orderId === 'string'
      ? parsed.orderId
      : null;
  } catch {
    return null;
  }
}

function savePendingOrder(marker: PendingOrderMarker): void {
  try {
    window.sessionStorage.setItem(PENDING_ORDER_KEY, JSON.stringify(marker));
  } catch {
    // Storage unavailable — retries just create fresh orders, as before.
  }
}

function clearPendingOrder(): void {
  try {
    window.sessionStorage.removeItem(PENDING_ORDER_KEY);
  } catch {
    // ignore
  }
}

export function getHoldFailedErrorInfo(err: unknown): {
  isHoldFailed: boolean;
  sku: string | null;
} {
  if (!(err instanceof ApiError)) return { isHoldFailed: false, sku: null };
  if (err.code !== 'hold_failed') return { isHoldFailed: false, sku: null };

  const sku = (() => {
    const details = err.details;
    if (typeof details !== 'object' || details === null) return null;
    if (!('sku' in details)) return null;
    const raw = (details as Record<string, unknown>).sku;
    if (typeof raw === 'string') return raw;
    if (typeof raw === 'number') return String(raw);
    return null;
  })();

  return { isHoldFailed: true, sku };
}

export function formatCheckoutError(err: unknown): string {
  if (err instanceof ApiError) {
    const code = err.code;
    if (code === 'idempotency_in_progress') {
      return 'Checkout is already being created. Please wait a moment and try again.';
    }
    if (code === 'hold_failed') {
      // Prefer the richer “Sold out” banner in the cart/checkout UI.
      return 'One or more items in your cart are sold out. Remove them to continue checkout.';
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
    if (code === 'checkout_complete') {
      return 'It looks like checkout was already completed for this order. Redirecting you to the confirmation…';
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

export async function startStripeCheckout(params: {
  list: DetailedCartItem[];
  subtotalCents: number;
  clearCart: () => void;
}) {
  if (params.list.length === 0) {
    throw new Error('Your cart is empty.');
  }

  const itemsWithSku = params.list.map((it) => ({
    sku: it.product.sku || '',
    title: it.product.title,
    priceCents: it.product.priceCents,
    qty: it.qty,
  }));

  if (itemsWithSku.some((i) => !i.sku)) {
    throw new Error('A product is missing a SKU.');
  }

  const fingerprint = cartFingerprint(itemsWithSku);

  // Retry path: an identical cart already staged an order — re-enter checkout
  // on it instead of creating a duplicate (and a duplicate inventory hold).
  const reusableOrderId = readPendingOrder(fingerprint);
  if (reusableOrderId) {
    try {
      const { checkoutUrl } = await createCheckout(reusableOrderId);
      clearPendingOrder();
      params.clearCart();
      window.location.href = checkoutUrl;
      return;
    } catch (e: unknown) {
      if (e instanceof ApiError && e.code === 'checkout_complete') {
        const redirectUrl = extractRedirectUrl(e);
        if (redirectUrl) {
          clearPendingOrder();
          window.location.href = redirectUrl;
          return;
        }
      }
      if (e instanceof ApiError && (e.code === 'not_found' || e.code === 'invalid_state')) {
        // The staged order died server-side (canceled/expired) — drop the
        // marker and fall through to a fresh order below.
        clearPendingOrder();
      } else {
        // Transient/hold failures: keep the marker so the NEXT retry still
        // reuses the same order, and surface the error as before.
        throw e;
      }
    }
  }

  try {
    const order = await createOrder({ items: itemsWithSku });
    savePendingOrder({ fingerprint, orderId: order.id });
    saveCheckoutSuccessSnapshot({
      orderId: order.id,
      subtotalCents: params.subtotalCents,
      items: params.list,
      confirmationToken: order.confirmationToken,
      confirmationExpiresAt: order.confirmationExpiresAt,
    });

    const { checkoutUrl } = await createCheckout(order.id);
    clearPendingOrder();
    params.clearCart();
    window.location.href = checkoutUrl;
  } catch (e: unknown) {
    if (e instanceof ApiError && e.code === 'checkout_complete') {
      const redirectUrl = extractRedirectUrl(e);
      if (redirectUrl) {
        clearPendingOrder();
        window.location.href = redirectUrl;
        return;
      }
    }
    // The snapshot is intentionally KEPT on failure — the staged order still
    // exists, and the snapshot carries the confirmation token the success
    // page needs if a retry completes checkout on the same order.
    throw e;
  }
}

function extractRedirectUrl(e: ApiError): string | null {
  const details = e.details;
  if (typeof details !== 'object' || details === null) return null;
  if (!('redirectUrl' in details)) return null;
  const raw = (details as Record<string, unknown>).redirectUrl;
  return typeof raw === 'string' ? raw : null;
}
