import { apiGet } from '@utils/api';
import type { DetailedCartItem } from '@utils/cart';

type InventorySnapshot = { sku: string; available: number };

export function buildCurrentlyUnavailableBody(params: {
  holdFailedSku: string | null;
  list: DetailedCartItem[];
}): string {
  const { holdFailedSku, list } = params;
  if (holdFailedSku) {
    const titles = new Set(
      list
        .filter((it) => it.product.sku === holdFailedSku)
        .map((it) => it.product.title)
        .filter((t) => typeof t === 'string' && t.trim().length > 0),
    );
    if (titles.size === 1) {
      const title = [...titles][0]!;
      return `${title} is sold out. Remove it to continue checkout.`;
    }
  }
  return 'One or more items in your cart are sold out. Remove them to continue checkout.';
}

export async function removeUnavailableItems(params: {
  holdFailedSku: string | null;
  list: DetailedCartItem[];
  removeItem: (slug: string) => void;
}): Promise<number> {
  const { holdFailedSku, list, removeItem } = params;

  let removed = 0;

  if (holdFailedSku) {
    for (const it of list) {
      if (it.product.sku === holdFailedSku) {
        removeItem(it.slug);
        removed += 1;
      }
    }
    return removed;
  }

  for (const it of list) {
    const sku = it.product.sku;
    if (!sku) continue;
    try {
      const snap = await apiGet<InventorySnapshot>(
        `/inventory/v1/inventory/${encodeURIComponent(sku)}`,
      );
      if (snap.available === 0) {
        removeItem(it.slug);
        removed += 1;
      }
    } catch {
      // Ignore inventory lookup errors and leave the item in the cart.
    }
  }

  return removed;
}
