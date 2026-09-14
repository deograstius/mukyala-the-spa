import { useMemo } from 'react';
import type { Product } from '../types/product';
import { getSlugFromHref } from '../utils/slug';
import { useProductsQuery } from './catalog.api';

const EMPTY_PRODUCTS: Product[] = [];

/** Shared copy for the cart/checkout surfaces when the catalog is unreachable. */
export const SHOP_UNAVAILABLE_MESSAGE =
  'We can’t reach the shop right now. Please try again in a moment.';

export interface ProductsState {
  products: Product[];
  /** True until the first /v1/products response arrives (no cached data yet). */
  isLoading: boolean;
  /**
   * True only when the catalog is unreachable AND we have no data at all.
   * Cached data from an earlier successful fetch keeps the shop usable, but
   * there is deliberately no static-file fallback here — the database is the
   * source of truth for anything purchasable.
   */
  isUnavailable: boolean;
  refetch: () => void;
}

export function useProductsState(): ProductsState {
  const query = useProductsQuery();
  const products = query.data ?? EMPTY_PRODUCTS;
  return {
    products,
    isLoading: query.isPending,
    isUnavailable: query.isError && !query.data,
    refetch: query.refetch,
  };
}

export function useProducts(): Product[] {
  return useProductsState().products;
}

export function useProductBySlug(slug: string | undefined): Product | undefined {
  const products = useProducts();
  return useMemo(() => {
    if (!slug) return undefined;
    return products.find((p) => getSlugFromHref(p.href) === slug);
  }, [products, slug]);
}
