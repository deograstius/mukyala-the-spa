import { clearCheckoutSuccessSnapshot, saveCheckoutSuccessSnapshot } from '@hooks/checkoutSuccess';
import { createCheckout, createOrder } from '@hooks/orders.api';
import { ApiError } from '@utils/api';
import type { DetailedCartItem } from '@utils/cart';

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

  let stagedOrderId: string | null = null;
  try {
    const order = await createOrder({ items: itemsWithSku });
    stagedOrderId = order.id;
    saveCheckoutSuccessSnapshot({
      orderId: order.id,
      subtotalCents: params.subtotalCents,
      items: params.list,
      confirmationToken: order.confirmationToken,
      confirmationExpiresAt: order.confirmationExpiresAt,
    });

    const { checkoutUrl } = await createCheckout(order.id);
    params.clearCart();
    window.location.href = checkoutUrl;
  } catch (e: unknown) {
    if (e instanceof ApiError && e.code === 'checkout_complete') {
      const redirectUrl = (() => {
        const details = e.details;
        if (typeof details !== 'object' || details === null) return null;
        if (!('redirectUrl' in details)) return null;
        const raw = (details as Record<string, unknown>).redirectUrl;
        return typeof raw === 'string' ? raw : null;
      })();
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }
    }
    if (stagedOrderId) {
      clearCheckoutSuccessSnapshot(stagedOrderId);
    }
    throw e;
  }
}
