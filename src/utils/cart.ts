import type { CartState } from '../contexts/CartContext';
import type { Product } from '../types/product';
import { getSlugFromHref } from '../utils/slug';

export interface DetailedCartItem {
  slug: string;
  qty: number;
  product: Product;
  priceCents: number;
  lineTotal: number;
}

export interface UnavailableCartItem {
  slug: string;
  qty: number;
}

export interface CartDetails {
  list: DetailedCartItem[];
  subtotalCents: number;
  /**
   * Cart entries whose slug no longer resolves to a catalog product (removed
   * or deactivated in the database since they were added). They are excluded
   * from the subtotal and from checkout, and the UI surfaces them explicitly
   * rather than dropping them silently.
   */
  unavailable: UnavailableCartItem[];
}

export function getCartDetails(items: CartState, products: Product[]): CartDetails {
  const list: DetailedCartItem[] = [];
  const unavailable: UnavailableCartItem[] = [];
  for (const it of Object.values(items)) {
    const product = products.find((p) => getSlugFromHref(p.href) === it.slug);
    if (!product) {
      unavailable.push({ slug: it.slug, qty: it.qty });
      continue;
    }
    const priceCents = product.priceCents;
    list.push({ slug: it.slug, qty: it.qty, product, priceCents, lineTotal: priceCents * it.qty });
  }
  const subtotalCents = list.reduce((sum, r) => sum + r.lineTotal, 0);
  return { list, subtotalCents, unavailable };
}
