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

export interface CartDetails {
  list: DetailedCartItem[];
  subtotalCents: number;
}

export function getCartDetails(items: CartState, products: Product[]): CartDetails {
  const list: DetailedCartItem[] = [];
  for (const it of Object.values(items)) {
    const product = products.find((p) => getSlugFromHref(p.href) === it.slug);
    if (!product) continue;
    const priceCents = product.priceCents;
    list.push({ slug: it.slug, qty: it.qty, product, priceCents, lineTotal: priceCents * it.qty });
  }
  const subtotalCents = list.reduce((sum, r) => sum + r.lineTotal, 0);
  return { list, subtotalCents };
}
