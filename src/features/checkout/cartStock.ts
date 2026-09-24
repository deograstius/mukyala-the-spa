import { ApiError, apiGet } from '@utils/api';
import type { DetailedCartItem } from '@utils/cart';

type InventorySnapshot = { sku: string; available: number };

export type CartStockChange =
  | { kind: 'removed'; slug: string; title: string }
  | { kind: 'reduced'; slug: string; title: string; kept: number; wanted: number };

export function buildCurrentlyUnavailableBody(params: {
  holdFailedSku: string | null;
  list: DetailedCartItem[];
}): string {
  const { holdFailedSku, list } = params;
  if (holdFailedSku) {
    const line = list.find(
      (it) =>
        it.product.sku === holdFailedSku &&
        typeof it.product.title === 'string' &&
        it.product.title.trim().length > 0,
    );
    if (line) {
      // A 409 on a single-unit line can only mean zero available; a
      // multi-unit line may still be partially in stock.
      return line.qty === 1
        ? `“${line.product.title}” is sold out. Update your cart to continue checkout.`
        : `There isn’t enough of “${line.product.title}” in stock. Update your cart to continue checkout.`;
    }
  }
  return 'Some items in your cart are sold out or low on stock. Update your cart to continue checkout.';
}

/** One human sentence per change, e.g. for a notice or live region. */
export function describeCartStockChanges(changes: CartStockChange[]): string {
  return changes
    .map((c) =>
      c.kind === 'reduced'
        ? `Only ${c.kept} of “${c.title}” ${c.kept === 1 ? 'was' : 'were'} left, so we kept ${c.kept} in your cart.`
        : `“${c.title}” is sold out and was removed from your cart.`,
    )
    .join(' ');
}

/**
 * Fit the cart to live stock: quantities clamp to what's available and only
 * truly-zero items are removed — the customer never has to re-add anything
 * (#38). Sweeps EVERY line (a 409 names only the first failure).
 */
export async function fitCartToStock(params: {
  holdFailedSku: string | null;
  list: DetailedCartItem[];
  removeItem: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
}): Promise<CartStockChange[]> {
  const { holdFailedSku, list, removeItem, setQty } = params;
  const changes: CartStockChange[] = [];

  for (const it of list) {
    const sku = it.product.sku;
    if (!sku) continue;

    let available: number;
    try {
      const snap = await apiGet<InventorySnapshot>(
        `/inventory/v1/inventory/${encodeURIComponent(sku)}`,
      );
      available = Math.max(0, snap.available);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // Unknown to inventory = gone from the catalog.
        available = 0;
      } else if (sku === holdFailedSku) {
        // The server already said this line can't be fulfilled; with the
        // lookup down we can't clamp, so removing is the only unblock.
        available = 0;
      } else {
        continue; // lookup failed on an unaccused line — leave it alone
      }
    }

    if (available <= 0) {
      removeItem(it.slug);
      changes.push({ kind: 'removed', slug: it.slug, title: it.product.title });
    } else if (it.qty > available) {
      setQty(it.slug, available);
      changes.push({
        kind: 'reduced',
        slug: it.slug,
        title: it.product.title,
        kept: available,
        wanted: it.qty,
      });
    }
  }

  return changes;
}
